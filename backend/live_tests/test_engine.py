"""Live-workspace regression tests. Provider/container doubles are test-only."""
import asyncio
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

TEST_ROOT = Path(tempfile.mkdtemp(prefix='maestro-live-tests-'))
os.environ['DATABASE_URL'] = 'sqlite:///' + str(TEST_ROOT / 'db.sqlite')
os.environ['MAESTRO_WORKSPACE_ROOT'] = str(TEST_ROOT / 'projects')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.models.governance import User
from app.live import engine
from app.ai.providers.gemini import GeminiProvider
from app.core.config import settings

client = TestClient(app)


@pytest.fixture()
def user_headers():
    with SessionLocal() as db:
        if not db.get(User, 'alice'):
            db.add(User(id='alice', username='alice', email='alice@example.test', full_name='Alice', password_hash=hash_password('Testing-password-12'), is_active=True))
            db.add(User(id='bob', username='bob', email='bob@example.test', full_name='Bob', password_hash=hash_password('Different-password-12'), is_active=True))
            db.commit()
    return {'Authorization': 'Bearer ' + create_access_token('alice', 'alice@example.test', 'DEVELOPER')}


def project(headers):
    response = client.post('/api/projects', headers=headers, json={'name': 'Verification project', 'description': 'A test-owned project, not seeded application data.'})
    assert response.status_code == 201, response.text
    return response.json()['id']


@pytest.mark.parametrize('path', ['../secret', '/etc/passwd', 'x/../../secret', '.env', 'folder/.env.local', 'C:\\secret', 'node_modules/a.js'])
def test_paths_cannot_escape_or_read_secrets(path):
    with pytest.raises(ValueError):
        engine.source_path('path-check', path)


def test_symlink_escape_is_rejected():
    base = engine.directory('symlink-check') / 'source'
    base.mkdir(exist_ok=True)
    try:
        (base / 'outside').symlink_to(TEST_ROOT, target_is_directory=True)
    except OSError:
        pytest.skip("Symlink creation requires elevated privileges on Windows")
    with pytest.raises(ValueError):
        engine.source_path('symlink-check', 'outside/db.sqlite')


def test_authentication_and_project_isolation(user_headers):
    assert client.get('/api/projects').status_code == 401
    pid = project(user_headers)
    bob = {'Authorization': 'Bearer ' + create_access_token('bob', 'bob@example.test', 'DEVELOPER')}
    assert client.get('/api/projects/' + pid, headers=bob).status_code == 404
    assert client.get('/api/projects/' + pid + '/live', headers=bob).status_code == 404
    assert pid not in [p['id'] for p in client.get('/api/projects', headers=bob).json()]
    assert client.get('/api/projects/' + pid + '/live', headers=user_headers).json()['files'] == []


def test_login_validation_and_session(user_headers):
    bad = client.post('/api/auth/login', json={'email': 'alice@example.test', 'password': 'wrong'})
    assert bad.status_code == 401
    good = client.post('/api/auth/login', json={'email': 'alice@example.test', 'password': 'Testing-password-12'})
    assert good.status_code == 200
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer ' + good.json()['token']}).status_code == 200
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer invalid'}).status_code == 401


def test_files_persist_and_invalidate_test_evidence(user_headers):
    pid = project(user_headers)
    url = '/api/projects/' + pid + '/live'
    response = client.put(url + '/file', headers=user_headers, json={'path': 'src/main.py', 'content': 'print(1)'})
    assert response.status_code == 200
    assert client.get(url + '/file', params={'path': 'src/main.py'}, headers=user_headers).json()['content'] == 'print(1)'
    assert 'src/main.py' in client.get(url, headers=user_headers).json()['files']
    assert client.put(url + '/file', headers=user_headers, json={'path': '../outside', 'content': 'bad'}).status_code == 400
    assert client.post(url + '/preview/restart', headers=user_headers).status_code == 409


def test_missing_provider_does_not_generate_fake_code(monkeypatch, user_headers):
    monkeypatch.setattr(settings, 'GEMINI_API_KEY', None)
    pid = project(user_headers)
    url = '/api/projects/' + pid + '/live'
    assert client.post(url + '/chat', headers=user_headers, json={'message': 'Build the application'}).status_code == 200
    state = client.get(url, headers=user_headers).json()
    assert state['status'] == 'BLOCKED'
    assert 'GEMINI_API_KEY' in state['error']
    assert state['files'] == []
    assert pid not in engine.BUSY


def test_provider_never_falls_back_to_mock():
    with pytest.raises(ValueError, match='not configured'):
        asyncio.run(GeminiProvider(api_key=None).generate('test', 'test'))


def test_duplicate_runs_and_write_during_run_rejected(user_headers):
    pid = project(user_headers)
    engine.reserve(pid)
    try:
        url = '/api/projects/' + pid + '/live'
        assert client.post(url + '/chat', headers=user_headers, json={'message': 'Build'}).status_code == 409
        assert client.put(url + '/file', headers=user_headers, json={'path': 'a', 'content': 'b'}).status_code == 409
    finally:
        engine.BUSY.discard(pid)


@pytest.mark.parametrize('output,code,count,passed', [
    ('Ran 0 tests in 0.00s\nOK', 0, 0, False),
    ('Ran 2 tests in 0.01s\nOK', 0, 2, True),
    ('Ran 2 tests in 0.01s\nFAILED (failures=1)', 1, 2, False),
    ('No tests observed', 0, 0, False),
    ('Ran 2 tests in 0.01s\nOK (skipped=2)', 0, 2, False),
])
def test_actual_runner_evidence_required(monkeypatch, output, code, count, passed):
    monkeypatch.setattr(engine, 'docker', lambda *args, **kw: {'exit_code': code, 'output': output, 'truncated': False})
    result = engine.run_tests('runner-test', 'python')
    assert result['test_count'] == count
    assert result['passed'] is passed


def test_no_host_fallback_without_docker(monkeypatch):
    monkeypatch.setattr(engine.shutil, 'which', lambda name: None)
    with pytest.raises(engine.Blocked, match='Docker is required'):
        engine.docker(['info'])


def test_tester_cannot_modify_application():
    with pytest.raises(ValueError, match='Tester may only'):
        engine.write_files('test-boundary', [engine.SourceFile(path='app.py', content='bad')], tests_only=True)


def test_cancel_checkpoint_retains_completed_files():
    pid = 'cancel-check'
    engine.write_files(pid, [engine.SourceFile(path='app.py', content='print(1)')])
    (engine.directory(pid) / 'cancel.requested').touch()
    with pytest.raises(engine.Cancelled):
        engine.write_files(pid, [engine.SourceFile(path='app.py', content='print(2)')])
    assert engine.snapshot(pid)['app.py'] == 'print(1)'


def test_real_file_and_retest_cycle_with_test_only_provider_double(monkeypatch):
    """Exercise orchestration with actual disk writes and actual unittest subprocesses.
    The provider and Docker adapter are explicit doubles; this is NOT live-LLM/Docker proof.
    """
    pid = 'cycle-proof'
    plan = engine.Plan(summary='Addition', acceptance=['Adds two numbers'], tasks=['Implement', 'Test'], runtime='python', architecture='Importable module')
    state = engine.load(pid)
    state.update(plan=plan.model_dump(), approved=True)
    engine.save(pid, state)
    test_source = 'import unittest\nfrom app import add\nclass Checks(unittest.TestCase):\n def test_add(self): self.assertEqual(add(2,3),5)\n'
    async def fake_ask(role, objective, context, schema):
        if role == 'DEVELOPER': return engine.Files(summary='Initial test fixture', files=[engine.SourceFile(path='app.py', content='def add(a,b): return a-b\n')])
        if role == 'TESTER': return engine.Files(summary='Actual test fixture', files=[engine.SourceFile(path='tests/test_app.py', content=test_source)])
        if role == 'DEBUGGER': return engine.Files(summary='Correct addition', files=[engine.SourceFile(path='app.py', content='def add(a,b): return a+b\n')])
        return engine.Finding(summary='Test-only review', blocking=False, findings=[])
    original_tests = engine.run_tests
    def local_test_adapter(project_id, runtime):
        def observed_docker(args, **kwargs):
            result = subprocess.run([sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'tests', '-v'], cwd=engine.directory(pid) / 'source', capture_output=True, text=True, timeout=10)
            return {'exit_code': result.returncode, 'output': result.stdout + result.stderr, 'truncated': False}
        with monkeypatch.context() as local:
            local.setattr(engine, 'docker', observed_docker)
            return original_tests(project_id, runtime)
    monkeypatch.setattr(engine, 'ask', fake_ask)
    monkeypatch.setattr(engine, 'run_tests', local_test_adapter)
    monkeypatch.setattr(engine, 'start_preview', lambda *args: {'status': 'TEST_DOUBLE'})
    asyncio.run(engine.build(pid, state, 'test-owned fixture'))
    test_events = [e for e in state['events'] if e['agent'] == 'TESTER' and 'evidence' in e]
    assert [e['evidence']['passed'] for e in test_events] == [False, True]
    assert engine.snapshot(pid)['app.py'] == 'def add(a,b): return a+b\n'
    assert engine.snapshot(pid)['tests/test_app.py'] == test_source
    assert state['status'] == 'READY'
    assert state['lessons'][0]['status'] == 'PROPOSED'


def test_legacy_simulation_api_disabled(user_headers):
    assert client.get('/api/agents', headers=user_headers).status_code == 410


def test_startup_failure_uses_incident_analysis_correction_and_retest(monkeypatch):
    pid = 'runtime-recovery'
    state = engine.load(pid)
    state['plan'] = engine.Plan(summary='App', acceptance=['Responds'], tasks=['Build'], runtime='python', architecture='HTTP server').model_dump()
    roles = []
    async def fake_ask(role, objective, context, schema):
        roles.append(role)
        if role == 'DEVELOPER':
            return engine.Files(summary='test fixture', files=[engine.SourceFile(path='app.py', content='print(1)')])
        if role == 'TESTER':
            return engine.Files(summary='test fixture', files=[engine.SourceFile(path='tests/test_app.py', content='# test fixture')])
        if role == 'DEBUGGER':
            return engine.Files(summary='runtime correction fixture', files=[engine.SourceFile(path='app.py', content='print(2)')])
        return engine.Finding(summary='test-only analysis', blocking=False, findings=[])
    monkeypatch.setattr(engine, 'ask', fake_ask)
    monkeypatch.setattr(engine, 'run_tests', lambda *args: {'passed': True, 'test_count': 1, 'exit_code': 0, 'output': 'test double', 'code_version': engine.revision(pid)})
    attempts = []
    def preview(*args):
        attempts.append(1)
        if len(attempts) == 1:
            raise engine.Blocked('Observed startup failure fixture')
        return {'status': 'TEST_DOUBLE'}
    monkeypatch.setattr(engine, 'start_preview', preview)
    asyncio.run(engine.build(pid, state, 'test fixture'))
    assert state['status'] == 'READY'
    assert 'INCIDENT_ANALYST' in roles
    assert 'DEBUGGER' in roles
    assert state['agents']['INCIDENT_RESPONSE'] == 'COMPLETED'
    assert len(attempts) == 2
    assert len([e for e in state['events'] if e['agent'] == 'TESTER' and 'evidence' in e]) == 2


def test_latest_dashboard_architect_route_fails_closed(monkeypatch, user_headers):
    monkeypatch.setattr(settings, 'GEMINI_API_KEY', None)
    pid = project(user_headers)
    response = client.post('/api/projects/' + pid + '/architect-plan', headers=user_headers, json={})
    assert response.status_code == 503
    assert 'GEMINI_API_KEY' in response.json()['detail']
    assert engine.snapshot(pid) == {}


def test_latest_dashboard_plan_and_scope_bridge(monkeypatch, user_headers):
    pid = project(user_headers)
    async def plan_only(*args, **kwargs):
        return engine.Plan(summary='Requested application', acceptance=['User requirement verified'], tasks=['Implement requested behaviour'], runtime='python', architecture='Actual provider output fixture')
    monkeypatch.setattr(engine, 'ask', plan_only)
    base = '/api/projects/' + pid
    response = client.post(base + '/architect-plan', headers=user_headers, json={})
    assert response.status_code == 200, response.text
    plan = response.json()
    assert plan['is_live_ai'] is True
    assert plan['scope'] == 'Requested application'
    assert client.post(base + '/approve-plan', headers=user_headers, json={'plan_data': plan}).status_code == 409
    assert client.post(base + '/permissions', headers=user_headers, json={'permissions': ['INSTALL_PACKAGES']}).status_code == 422
    assert client.post(base + '/permissions', headers=user_headers, json={'permissions': ['FILES_READ_WRITE', 'RUN_CODE_TESTS']}).status_code == 200
    changed = dict(plan, scope='Silently changed scope')
    assert client.post(base + '/approve-plan', headers=user_headers, json={'plan_data': changed}).status_code == 409


def test_latest_workspace_diff_and_manual_test_scope(user_headers):
    pid = project(user_headers)
    base = '/api/projects/' + pid + '/live'
    assert client.post(base + '/tests', headers=user_headers).status_code == 409
    assert client.get(base + '/preview/status', headers=user_headers).json()['status'] == 'NOT_STARTED'
    client.put(base + '/file', headers=user_headers, json={'path': 'app.py', 'content': 'print(1)\n'})
    diff = client.get(base + '/diff', headers=user_headers).json()
    assert '+print(1)' in diff['diff']
    assert diff['has_git'] is False


def test_configuration_reports_missing_dependencies_honestly(monkeypatch, user_headers):
    monkeypatch.setattr(settings, 'GEMINI_API_KEY', None)
    monkeypatch.setattr(engine.shutil, 'which', lambda name: None)
    pid = project(user_headers)
    result = client.get('/api/projects/' + pid + '/live/configuration', headers=user_headers)
    assert result.status_code == 200
    assert result.json()['provider_configured'] is False
    assert result.json()['docker_health']['ready'] is False

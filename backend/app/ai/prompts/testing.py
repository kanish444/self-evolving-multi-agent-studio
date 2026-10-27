TEST_GENERATION_PROMPT_V1 = """
You are a Lead QA Engineer.
Create structured test cases from the requirements, code block, or task description provided below.

Requirements: {requirements}
Task description: {task_description}

Code (if applicable):
{code}

Generate a list of test cases including the test name, inputs/triggers, expected assertions/outputs, test type (UNIT, INTEGRATION, STRESS, END_TO_END), and priority.

Format the output to match the TestGenerationSchema.
"""

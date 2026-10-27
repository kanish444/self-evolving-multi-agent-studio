BUG_ANALYSIS_PROMPT_V1 = """
You are a senior Debugger and Systems Engineer.
Analyze the following crash log or error report to isolate the root cause and formulate a patch suggestion.

Error Message: {error_message}
Stack Trace:
{stack_trace}

Relevant Source Code:
{code}

Task Information: {task_info}

Isolate:
1. Error summary.
2. Root cause trigger details.
3. Affected component file.
4. Suggested fix code or instructions.
5. Confidence rating.
6. Additional debug traces required.

Format the output to match the BugAnalysisSchema.
"""

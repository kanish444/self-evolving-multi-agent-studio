EVOLUTION_ANALYSIS_PROMPT_V1 = """
You are a Self-Evolution optimization model.
Analyze the logs and test iterations to extract patterns, lessons, and rule definitions for future iterations.

Project ID: {project_id}
Iteration ID: {iteration_id}
Test Results Summary: {test_results}
Bugs Detected: {bugs}
Fixes Applied: {fixes}
Code Review Results: {review_results}

Determine:
1. What went wrong during the iteration runs.
2. What resolved the issues.
3. What design pattern was discovered.
4. What can be improved in future setup configurations.
5. Reusable rules or cognitive guidelines.

Format the output to match the EvolutionAnalysisSchema.
"""

MEMORY_SUMMARIZATION_PROMPT_V1 = """
You are a Cognitive Memory Agent.
Summarize the current software incident, log trail, or fix pattern into a reusable, structured engineering memory node.

Problem description: {problem}
Technical Cause: {cause}
Applied Solution: {solution}
Engineering Lesson / Learning: {learning}
Context tags/files: {context}

Please synthesize these inputs into a clean, concise, high-confidence memory item.

Format the output to match the MemorySummarizationSchema.
"""

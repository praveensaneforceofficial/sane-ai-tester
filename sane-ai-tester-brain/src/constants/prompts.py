# AI Prompt Templates

TEST_CASE_GENERATION = """
You are an expert QA engineer. Generate comprehensive test cases for the following requirement:

Requirement: {requirement}
Priority: {priority}
Project: {project_name}

Special Instructions for UI Flow:
1. Admin Login & Division Selection: After login, the division selection screen has a default radio button selected. The user only needs to hit 'Enter' to proceed.
2. Menu Navigation: Clicking any main menu opens a popup. The user must click the sub-menu item inside this popup to navigate.
Please ensure the generated test cases accurately reflect these interactions.

Generate test cases with:
1. Test case ID (format: TC-{project_code}-001)
2. Test scenario description
3. Preconditions
4. Steps to execute (numbered)
5. Expected results (numbered)
6. Test data needed
7. Postconditions

Format as JSON array.
"""

TEST_IMPROVEMENT = """
Analyze the following failed test case and suggest improvements:

Original Test Case: 
{test_case}

Error Message: 
{error}

Screenshot Available: {has_screenshot}

Please provide:
1. Root cause analysis
2. Improved test steps
3. Additional validation points
4. Suggested fixes for the application code
5. Edge cases to consider

Respond in markdown format.
"""

BUG_ANALYSIS = """
Analyze this bug report and provide actionable insights:

Bug Description: {description}
Error Log: {error_log}
Stack Trace: {stack_trace}
Test Environment: {environment}

Provide:
1. Severity assessment (Critical/High/Medium/Low)
2. Root cause analysis
3. Recommended fix
4. Prevention measures for future
5. Related areas that might be affected
"""

TEST_SUMMARY = """
Generate a comprehensive summary report for the following test results:

Project: {project_name}
Execution Date: {date}
Total Tests: {total}
Passed: {passed}
Failed: {failed}
Skipped: {skipped}
Execution Time: {duration} seconds

Failed Test Details:
{failed_tests_details}

Provide:
1. Overall status (PASS/FAIL/WARNING)
2. Critical issues summary
3. Recommendations for improvement
4. Risk assessment for release
5. Areas needing retesting
"""

RAG_QUERY = """
Based on the following historical test cases and results, suggest improvements for the new test case:

Historical Data:
{similar_cases}

New Test Case:
{new_case}

Please suggest:
1. Missing test scenarios
2. Potential edge cases
3. Common failure patterns to check
4. Best practices to apply
"""
import pytest
from unittest.mock import patch, Mock
from ai.agents.testPlanner import test_planner

@pytest.mark.asyncio
async def test_generate_test_plan():
    """Test test plan generation"""
    requirements = [
        {"description": "Login functionality", "priority": "High", "project": "TestApp"}
    ]
    
    with patch.object(test_planner, '_generate_test_cases') as mock_generate:
        mock_generate.return_value = [{"id": "TC001", "name": "Test Login"}]
        result = await test_planner.generate_test_plan(requirements)
        
        assert len(result) == 1
        assert result[0]["id"] == "TC001"

@pytest.mark.asyncio
async def test_prioritize_test_cases():
    """Test test case prioritization"""
    test_cases = [
        {"priority": "Low", "name": "Test A"},
        {"priority": "High", "name": "Test B"},
        {"priority": "Medium", "name": "Test C"}
    ]
    
    result = await test_planner.prioritize_test_cases(test_cases)
    assert result[0]["priority"] == "High"
    assert result[1]["priority"] == "Medium"
    assert result[2]["priority"] == "Low"
#!/usr/bin/env python3
"""Seed test data for development"""

import sys
import asyncio
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logger import get_logger
from ai.rag.vector_store import vector_store

logger = get_logger(__name__)

async def seed_test_cases():
    """Seed sample test cases"""
    
    test_cases = [
        {
            "id": "TC001",
            "name": "Login Functionality",
            "description": "Verify user can login with valid credentials",
            "steps": "1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login",
            "expected": "User redirected to dashboard",
            "priority": "High"
        },
        {
            "id": "TC002",
            "name": "Password Reset",
            "description": "Verify password reset flow",
            "steps": "1. Click forgot password\n2. Enter email\n3. Check email for reset link\n4. Set new password",
            "expected": "Password reset successfully",
            "priority": "Medium"
        },
        {
            "id": "TC003",
            "name": "Search Functionality",
            "description": "Verify search returns relevant results",
            "steps": "1. Enter search term\n2. Click search\n3. Verify results",
            "expected": "Relevant results displayed",
            "priority": "Medium"
        }
    ]
    
    for test_case in test_cases:
        doc_id = f"testcase_{test_case['id']}"
        text = f"""
        Test Case: {test_case['name']}
        Description: {test_case['description']}
        Steps: {test_case['steps']}
        Expected: {test_case['expected']}
        Priority: {test_case['priority']}
        """
        
        metadata = {
            "type": "test_case",
            "test_id": test_case['id'],
            "name": test_case['name'],
            "priority": test_case['priority'],
            "created_at": datetime.now().isoformat()
        }
        
        await vector_store.add_document(doc_id, text, metadata)
        logger.info(f"Seeded test case: {test_case['name']}")
    
    logger.info(f"✅ Seeded {len(test_cases)} test cases")

async def main():
    logger.info("🌱 Seeding test data...")
    await seed_test_cases()
    logger.info("✅ Seeding complete!")

if __name__ == "__main__":
    asyncio.run(main())
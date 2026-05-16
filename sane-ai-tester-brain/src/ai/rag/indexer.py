from typing import Dict, Any
from datetime import datetime
from ai.rag.vector_store import vector_store
from utils.logger import get_logger

logger = get_logger(__name__)

class RAGIndexer:
    """Index documents into vector store"""
    
    async def index_test_case(self, test_case: Dict[str, Any]):
        """Index a test case"""
        doc_id = f"testcase_{test_case.get('id', datetime.now().timestamp())}"
        
        # Create searchable text
        text = f"""
        Test Case: {test_case.get('name', '')}
        Description: {test_case.get('description', '')}
        Steps: {test_case.get('steps', '')}
        Expected Results: {test_case.get('expected_results', '')}
        Priority: {test_case.get('priority', '')}
        Status: {test_case.get('status', '')}
        """
        
        metadata = {
            "type": "test_case",
            "test_id": test_case.get('id'),
            "name": test_case.get('name'),
            "priority": test_case.get('priority'),
            "status": test_case.get('status'),
            "created_at": datetime.now().isoformat()
        }
        
        await vector_store.add_document(doc_id, text, metadata)
        logger.info(f"Indexed test case: {test_case.get('name')}")
    
    async def index_test_report(self, report: Dict[str, Any]):
        """Index a test report"""
        doc_id = f"report_{report.get('report_id', datetime.now().timestamp())}"
        
        text = f"""
        Report: {report.get('name', '')}
        Summary: {report.get('summary', '')}
        Total Tests: {report.get('total_tests', 0)}
        Passed: {report.get('passed', 0)}
        Failed: {report.get('failed', 0)}
        Errors: {report.get('errors', [])}
        """
        
        metadata = {
            "type": "report",
            "report_id": report.get('report_id'),
            "name": report.get('name'),
            "project": report.get('project'),
            "created_at": datetime.now().isoformat()
        }
        
        await vector_store.add_document(doc_id, text, metadata)
        logger.info(f"Indexed report: {report.get('name')}")
    
    async def index_error_log(self, error: Dict[str, Any]):
        """Index an error log"""
        doc_id = f"error_{datetime.now().timestamp()}"
        
        text = f"""
        Error: {error.get('error_message', '')}
        Stack Trace: {error.get('stack_trace', '')}
        Context: {error.get('context', '')}
        Resolution: {error.get('resolution', '')}
        """
        
        metadata = {
            "type": "error",
            "worker_id": error.get('worker_id'),
            "task_id": error.get('task_id'),
            "severity": error.get('severity', 'medium'),
            "created_at": datetime.now().isoformat()
        }
        
        await vector_store.add_document(doc_id, text, metadata)
        logger.info(f"Indexed error from worker: {error.get('worker_id')}")

# Singleton instance
rag_indexer = RAGIndexer()
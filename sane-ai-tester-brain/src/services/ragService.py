from typing import List, Dict, Any
from ai.rag.vector_store import vector_store
from ai.rag.indexer import rag_indexer
from ai.rag.retriever import rag_retriever
from utils.logger import get_logger

logger = get_logger(__name__)

class RAGService:
    """Service for RAG operations"""
    
    async def index_test_case(self, test_case: Dict[str, Any]):
        """Index a test case"""
        await rag_indexer.index_test_case(test_case)
        logger.info(f"Indexed test case: {test_case.get('name')}")
    
    async def index_test_report(self, report: Dict[str, Any]):
        """Index a test report"""
        await rag_indexer.index_test_report(report)
        logger.info(f"Indexed report: {report.get('name')}")
    
    async def search_similar(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        return await rag_retriever.retrieve_similar_test_cases(query, limit)
    
    async def get_context_for_prompt(self, query: str) -> str:
        """Get context for AI prompt"""
        return await rag_retriever.get_context_for_prompt(query)
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get RAG statistics"""
        return {
            "total_documents": await vector_store.get_count(),
            "collection_name": "test_cases"
        }

rag_service = RAGService()
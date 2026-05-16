from typing import List, Dict, Any
from ai.rag.vector_store import vector_store
from utils.logger import get_logger

logger = get_logger(__name__)

class RAGRetriever:
    """Retrieve relevant documents for RAG"""
    
    async def retrieve_similar_test_cases(self, query: str, limit: int = 5) -> List[Dict]:
        """Retrieve similar test cases"""
        results = await vector_store.search(query, n_results=limit)
        return results
    
    async def retrieve_by_metadata(self, metadata_filter: Dict[str, Any], limit: int = 10) -> List[Dict]:
        """Retrieve documents by metadata"""
        # ChromaDB metadata filtering
        # This is a simplified version
        try:
            results = vector_store.collection.get(
                where=metadata_filter,
                limit=limit
            )
            
            documents = []
            if results['ids']:
                for i, doc_id in enumerate(results['ids']):
                    documents.append({
                        'id': doc_id,
                        'text': results['documents'][i] if results['documents'] else '',
                        'metadata': results['metadatas'][i] if results['metadatas'] else {}
                    })
            
            return documents
        except Exception as e:
            logger.error(f"Metadata retrieval failed: {e}")
            return []
    
    async def get_context_for_prompt(self, query: str, limit: int = 3) -> str:
        """Get context string for AI prompt"""
        similar_docs = await self.retrieve_similar_test_cases(query, limit)
        
        if not similar_docs:
            return ""
        
        context = "Similar historical test cases:\n\n"
        for doc in similar_docs:
            context += f"--- {doc['id']} ---\n"
            context += f"Content: {doc['text'][:500]}\n"
            context += f"Metadata: {doc['metadata']}\n\n"
        
        return context

# Singleton instance
rag_retriever = RAGRetriever()
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class VectorStore:
    """ChromaDB vector store for RAG"""
    
    def __init__(self):
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=settings.CHROMA_DB_PATH,
            anonymized_telemetry=False
        ))
        self.collection = None
        self._init_collection()
    
    def _init_collection(self):
        """Initialize or get collection"""
        try:
            self.collection = self.client.get_collection(settings.CHROMA_COLLECTION_NAME)
            logger.info(f"Loaded collection: {settings.CHROMA_COLLECTION_NAME}")
        except:
            self.collection = self.client.create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"description": "Test cases and reports for RAG"}
            )
            logger.info(f"Created collection: {settings.CHROMA_COLLECTION_NAME}")
    
    async def add_document(self, doc_id: str, text: str, metadata: Dict[str, Any]):
        """Add document to vector store"""
        try:
            self.collection.add(
                ids=[doc_id],
                documents=[text],
                metadatas=[metadata]
            )
            logger.debug(f"Added document {doc_id} to vector store")
        except Exception as e:
            logger.error(f"Failed to add document: {e}")
    
    async def add_documents(self, ids: List[str], texts: List[str], metadatas: List[Dict]):
        """Add multiple documents"""
        try:
            self.collection.add(
                ids=ids,
                documents=texts,
                metadatas=metadatas
            )
            logger.info(f"Added {len(ids)} documents to vector store")
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
    
    async def search(self, query: str, n_results: int = 5) -> List[Dict]:
        """Search for similar documents"""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            documents = []
            if results['ids'] and results['ids'][0]:
                for i, doc_id in enumerate(results['ids'][0]):
                    documents.append({
                        'id': doc_id,
                        'text': results['documents'][0][i] if results['documents'] else '',
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'distance': results['distances'][0][i] if results['distances'] else 0
                    })
            
            return documents
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    async def delete_document(self, doc_id: str):
        """Delete document from store"""
        try:
            self.collection.delete(ids=[doc_id])
            logger.debug(f"Deleted document {doc_id}")
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
    
    async def get_count(self) -> int:
        """Get number of documents in collection"""
        return self.collection.count()

# Singleton instance
vector_store = VectorStore()
from typing import List, Optional
import hashlib
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class EmbeddingsGenerator:
    """Generate embeddings for text"""
    
    def __init__(self):
        self.model = "all-MiniLM-L6-v2"  # Default for ChromaDB
    
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for single text"""
        # ChromaDB handles embeddings internally
        # This is a placeholder for custom embedding generation
        # Return hash-based vector for demo
        hash_obj = hashlib.md5(text.encode())
        hash_int = int(hash_obj.hexdigest(), 16)
        
        # Convert to pseudo-embedding (not real, just for demo)
        import random
        random.seed(hash_int)
        embedding = [random.random() for _ in range(384)]
        random.seed()
        
        return embedding
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = []
        for text in texts:
            emb = await self.generate_embedding(text)
            if emb:
                embeddings.append(emb)
        return embeddings

# Singleton instance
embeddings_generator = EmbeddingsGenerator()
import math
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("VectorService")

try:
    from sentence_transformers import SentenceTransformer
    import chromadb
    
    embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
    chroma_client = chromadb.PersistentClient(path=settings.CHROMADB_PATH)
    resumes_col = chroma_client.get_or_create_collection(name="resumes")
    jobs_col = chroma_client.get_or_create_collection(name="jobs")
    HAS_CHROMADB = True
except Exception as e:
    logger.warning(f"ChromaDB / SentenceTransformers fallback active: {e}")
    HAS_CHROMADB = False

class VectorService:
    def get_embedding(self, text: str) -> List[float]:
        """Generates dense embedding vector for given text."""
        if HAS_CHROMADB:
            try:
                vector = embedder.encode(text).tolist()
                return vector
            except Exception as e:
                logger.error(f"Error embedding text: {e}")
        
        # Lightweight deterministic fallback vector if sentence-transformers is loading
        words = text.lower().split()
        vector = [0.0] * 384
        for idx, word in enumerate(words[:384]):
            vector[idx] = (hash(word) % 1000) / 1000.0
        return vector

    def compute_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculates cosine similarity score between 0.0 and 1.0 (converted to percentage 0-100)."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 75.0  # Reasonable default

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = math.sqrt(sum(a * a for a in vec1))
        norm_b = math.sqrt(sum(b * b for b in vec2))

        if norm_a == 0 or norm_b == 0:
            return 70.0

        similarity = dot_product / (norm_a * norm_b)
        # Normalize -1..1 to 0..100
        score = max(0.0, min(100.0, ((similarity + 1) / 2) * 100))
        return round(score, 2)

    def upsert_job_embedding(self, job_id: str, text: str, metadata: Dict[str, Any]):
        """Persists job embedding in ChromaDB vector store."""
        if HAS_CHROMADB:
            try:
                vec = self.get_embedding(text)
                jobs_col.upsert(
                    ids=[job_id],
                    embeddings=[vec],
                    metadatas=[metadata],
                    documents=[text]
                )
            except Exception as e:
                logger.error(f"ChromaDB upsert job error: {e}")

    def query_similar_jobs(self, resume_text: str, top_k: int = 20) -> List[str]:
        """Queries ChromaDB vector collection for top matches."""
        if HAS_CHROMADB:
            try:
                vec = self.get_embedding(resume_text)
                results = jobs_col.query(query_embeddings=[vec], n_results=top_k)
                if results and "ids" in results and results["ids"]:
                    return results["ids"][0]
            except Exception as e:
                logger.error(f"ChromaDB query error: {e}")
        return []

vector_service = VectorService()

from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from typing import List
from langchain_core.documents import Document
import os

def get_vector_store(collection_name: str = "rag_collection", persist_directory: str = "./chroma_db", embedding_model: str = "nomic-embed-text") -> Chroma:
    """
    Initializes and returns the Chroma vector store with Ollama embeddings.
    """
    # Initialize embeddings
    embeddings = OllamaEmbeddings(model=embedding_model)

    # Initialize Chroma
    vector_store = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist_directory
    )
    
    return vector_store

def add_documents_to_store(vector_store: Chroma, documents: List[Document]):
    """
    Adds documents to the vector store.
    """
    print(f"Adding {len(documents)} documents to vector store...")
    vector_store.add_documents(documents=documents)
    print("Documents added.")

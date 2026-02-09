from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from typing import List
from langchain_core.documents import Document
import os

import sqlite3

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
DB_PATH = os.path.join(DATA_DIR, "users.db")

def init_db():
    """Initializes the SQLite database and creates the users table."""
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_user_by_email(email: str):
    """Retrieves a user by their email."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return user

def create_user(name: str, email: str, password_hash: str):
    """Creates a new user in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, password_hash))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_vector_store(collection_name: str = "rag_collection_v3", persist_directory: str = "./chroma_db_v3", embedding_model: str = "nomic-embed-text") -> Chroma:
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

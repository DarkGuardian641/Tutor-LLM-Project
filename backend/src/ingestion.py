from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
from langchain_core.documents import Document
import os

def load_document(file_path: str) -> List[Document]:
    """
    Loads a document based on its file extension.
    Supports PDF, TXT, DOCX.
    """
    ext = os.path.splitext(file_path)[1].lower()
    print(f"Loading document from: {file_path} (Type: {ext})")
    
    if ext == '.pdf':
        loader = PyPDFLoader(file_path)
    elif ext == '.txt':
        loader = TextLoader(file_path)
    elif ext == '.docx':
        loader = Docx2txtLoader(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    docs = loader.load()
    print(f"Loaded {len(docs)} document(s)")
    if docs:
        print(f"Content preview: {docs[0].page_content[:500]!r}")
    return docs

def split_documents(docs: List[Document], chunk_size: int = 1000, chunk_overlap: int = 200) -> List[Document]:
    """
    Splits documents into chunks using RecursiveCharacterTextSplitter.
    """
    print("Splitting documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    splits = text_splitter.split_documents(docs)
    print(f"Created {len(splits)} chunks")
    return splits



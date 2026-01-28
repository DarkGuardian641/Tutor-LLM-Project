from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
from langchain_core.documents import Document

def load_pdf(file_path: str) -> List[Document]:
    """
    Loads a PDF file using PyPDFLoader.
    """
    print(f"Loading PDF from: {file_path}")
    loader = PyPDFLoader(file_path)
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



from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader, CSVLoader, UnstructuredExcelLoader
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
    
    # Map of extensions to loaders
    code_extensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.java', '.cpp', '.c', '.h', '.json', '.md', '.sql', '.sh', '.bat', '.txt']
    
    if ext == '.pdf':
        loader = PyPDFLoader(file_path)
    elif ext == '.docx':
        loader = Docx2txtLoader(file_path)
    elif ext == '.csv':
        loader = CSVLoader(file_path)
    elif ext in ['.xlsx', '.xls']:
        loader = UnstructuredExcelLoader(file_path)
    elif ext in code_extensions:
        # Treat code/text files as text
        loader = TextLoader(file_path, encoding='utf-8')
    else:
        # Fallback to TextLoader for unknown text-based files, or raise error
        # Trying TextLoader as a fallback for potential other code files
        try:
            loader = TextLoader(file_path, encoding='utf-8')
        except:
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



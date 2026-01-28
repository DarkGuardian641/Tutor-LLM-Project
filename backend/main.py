import os
import argparse
from src.ingestion import load_pdf, split_documents
from src.database import get_vector_store, add_documents_to_store
from src.rag import get_rag_chain
from src.flashcards import get_flashcard_chain

def main():
    parser = argparse.ArgumentParser(description="Local RAG Pipeline")
    parser.add_argument("--ingest", help="Path to PDF file to ingest")
    parser.add_argument("--query", help="Question to ask")
    parser.add_argument("--flashcards", help="Topic for flashcards")
    
    args = parser.parse_args()

    # Initialize Vector Store
    vector_store = get_vector_store()

    if args.ingest:
        file_path = args.ingest
        # Check if file exists as is
        if not os.path.exists(file_path):
            # Check in data directory
            data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", file_path)
            if os.path.exists(data_path):
                file_path = data_path
            else:
                 print(f"File not found: {args.ingest}")
                 return
        
        docs = load_pdf(file_path)
        splits = split_documents(docs)
        add_documents_to_store(vector_store, splits)
        print("Ingestion complete.")

    if args.query:
        print(f"Question: {args.query}")
        rag_chain = get_rag_chain(vector_store)
        response = rag_chain.invoke(args.query)
        print("Response:")
        print(response)

    if args.flashcards:
        print(f"Generating flashcards for topic: {args.flashcards}")
        flashcard_chain = get_flashcard_chain(vector_store)
        response = flashcard_chain.invoke(args.flashcards)
        print("Flashcards:")
        print(response)

if __name__ == "__main__":
    main()

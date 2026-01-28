from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import shutil
import os
from typing import Optional

from src.ingestion import load_pdf, split_documents
from src.database import get_vector_store, add_documents_to_store
from src.rag import get_rag_chain
from src.flashcards import get_flashcard_chain

app = FastAPI(title="Tutor LLM API")

# Initialize Vector Store on startup (or lazily)
vector_store = get_vector_store()

class QueryRequest(BaseModel):
    question: str

class FlashcardRequest(BaseModel):
    topic: str

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Tutor LLM API is running"}

@app.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    try:
        # Define storage path
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        file_path = os.path.join(data_dir, file.filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Trigger ingestion
        docs = load_pdf(file_path)
        splits = split_documents(docs)
        add_documents_to_store(vector_store, splits)
        
        return {"message": "Ingestion complete", "filename": file.filename, "chunks": len(splits)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def query_rag(request: QueryRequest):
    try:
        rag_chain = get_rag_chain(vector_store)
        response = rag_chain.invoke(request.question)
        return {"question": request.question, "answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/flashcards")
def generate_flashcards(request: FlashcardRequest):
    try:
        flashcard_chain = get_flashcard_chain(vector_store)
        response = flashcard_chain.invoke(request.topic)
        return {"topic": request.topic, "flashcards": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

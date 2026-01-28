from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from typing import Optional, List
import datetime

from src.ingestion import load_document, split_documents
from src.database import get_vector_store, add_documents_to_store
from src.rag import get_smart_response_chain
from src.flashcards import get_flashcard_chain
from src.quiz import get_quiz_chain

app = FastAPI(title="Tutor LLM API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Vector Store on startup (or lazily)
vector_store = get_vector_store()

class QueryRequest(BaseModel):
    question: str

class FlashcardRequest(BaseModel):
    topic: str

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Tutor LLM API is running"}

@app.get("/files")
def list_files():
    """List all files in the data directory."""
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    if not os.path.exists(data_dir):
        return []
    
    files = []
    for filename in os.listdir(data_dir):
        file_path = os.path.join(data_dir, filename)
        if os.path.isfile(file_path):
            stats = os.stat(file_path)
            # Simple metadata
            files.append({
                "name": filename,
                "size": stats.st_size,
                "modified": datetime.datetime.fromtimestamp(stats.st_mtime).isoformat()
            })
    return files

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
        docs = load_document(file_path)
        splits = split_documents(docs)
        add_documents_to_store(vector_store, splits)
        
        return {"message": "Ingestion complete", "filename": file.filename, "chunks": len(splits)}
    except Exception as e:
        print(f"Error during ingestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_rag(request: QueryRequest):
    try:
        # Get chains
        chains = get_smart_response_chain(vector_store)
        
        # 1. Classify Intent
        intent = chains["classifier"].invoke({"question": request.question})
        print(f"Detected Intent: {intent.strip()}")
        
        # 2. Select Chain
        if "GREETING" in intent.strip() or "GENERAL" in intent.strip():
             selected_chain = chains["general"]
             # For general chat, we pass just the question
             input_data = {"question": request.question}
        else:
             # Default to RAG for TEXTBOOK or uncertain cases
             selected_chain = chains["rag"]
             input_data = request.question # RAG chain expects string input for RunnablePassthrough usually, or dict

        # 3. Stream Response
        async def generate():
            # RAG chain in rag.py expects simple string input because of RunnablePassthrough for question
            # General chain also expects dict with "question" key.
            # Let's standardize inputs.
            
            if selected_chain == chains["rag"]:
                 # The rag_chain defined in rag.py uses RunnablePassthrough for 'question', so it expects a string input?
                 # Looking at rag.py: {"question": RunnablePassthrough()} | prompt...
                 # Yes, it expects the input string directly.
                 stream_input = request.question
            else:
                 # General chain: prompt | llm. Prompt expects "question".
                 stream_input = {"question": request.question}

            for chunk in selected_chain.stream(stream_input):
                yield chunk

        return StreamingResponse(generate(), media_type="text/plain")
    except Exception as e:
        print(f"Error during query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/flashcards")
def generate_flashcards(request: FlashcardRequest):
    try:
        flashcard_chain = get_flashcard_chain(vector_store)
        # The chain input is just the topic string because of RunnablePassthrough assigned to "topic"
        response = flashcard_chain.invoke(request.topic)
        return {"topic": request.topic, "flashcards": response["flashcards"] if "flashcards" in response else response}
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class QuizRequest(BaseModel):
    topic: str
    count: int = 5
    difficulty: str = "Medium"

@app.post("/generate_quiz")
def generate_quiz(request: QuizRequest):
    try:
        quiz_func = get_quiz_chain(vector_store)
        result = quiz_func({
            "topic": request.topic,
            "count": request.count,
            "difficulty": request.difficulty
        })
        return result
    except Exception as e:
        print(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

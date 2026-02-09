from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import sys
import os

# Add the current directory to sys.path to ensure src imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from typing import Optional, List
import datetime

from src.ingestion import load_document, split_documents
from src.database import get_vector_store, add_documents_to_store, init_db
from src.rag import get_smart_response_chain
from src.flashcards import get_flashcard_chain
from src.quiz import get_quiz_chain

from src.auth import router as auth_router
from src.chat_history import save_message, get_user_chats, get_chat_history, create_chat, delete_chat

app = FastAPI(title="Tutor LLM API")

# Include authentication router
app.include_router(auth_router)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
try:
    init_db()
    print("Database initialized successfully.")
except Exception as e:
    print(f"Error initializing database: {e}")

# Initialize Vector Store on startup (or lazily)
vector_store = get_vector_store()

class QueryRequest(BaseModel):
    question: str
    user_email: Optional[str] = None
    chat_id: Optional[str] = None

class ChatRequest(BaseModel):
    user_email: str
    title: Optional[str] = None

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

@app.get("/chats")
def list_user_chats(user_email: str):
    """List all chats for a user."""
    return get_user_chats(user_email)

@app.get("/chats/{chat_id}")
def get_chat_details(chat_id: str, user_email: str):
    """Get messages for a specific chat."""
    chat = get_chat_history(user_email, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@app.post("/chats")
def create_new_chat(request: ChatRequest):
    """Create a new chat session."""
    chat_id = create_chat(request.user_email, request.title or "New Chat")
    return {"chat_id": chat_id}

@app.delete("/chats/{chat_id}")
def delete_user_chat(chat_id: str, user_email: str):
    """Delete a chat session."""
    delete_chat(user_email, chat_id)
    return {"message": "Chat deleted"}

@app.post("/ingest")
async def ingest_document(
    file: UploadFile = File(...),
    user_email: Optional[str] = Form(None),
    chat_id: Optional[str] = Form(None)
):
    try:
        # Define storage path
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        file_path = os.path.join(data_dir, file.filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Log USER message "Uploaded: [filename]"
        if user_email and chat_id:
             save_message(user_email, chat_id, "user", f" Uploaded: {file.filename}")

        # Trigger ingestion
        docs = load_document(file_path)
        splits = split_documents(docs)
        add_documents_to_store(vector_store, splits)
        
        # Log bot message if context provided
        if user_email and chat_id:
            save_message(user_email, chat_id, "bot", f"📄 Document processed: **{file.filename}**")

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
            full_response = ""
            # Save user message if tracking is enabled
            if request.user_email and request.chat_id:
                save_message(request.user_email, request.chat_id, "user", request.question)

            stream_input = request.question if selected_chain == chains["rag"] else {"question": request.question}

            for chunk in selected_chain.stream(stream_input):
                full_response += str(chunk)
                yield chunk
            
            # Save bot response if tracking is enabled
            if request.user_email and request.chat_id:
                save_message(request.user_email, request.chat_id, "bot", full_response)

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

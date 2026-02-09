import json
import os
import uuid
import datetime
from typing import List, Dict, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
CHATS_DIR = os.path.join(DATA_DIR, "chats")

def _get_user_chat_dir(user_email: str) -> str:
    """Get the directory for a specific user's chats."""
    # Sanitize email to be safe for filesystem
    safe_email = user_email.replace("@", "_at_").replace(".", "_dot_")
    user_dir = os.path.join(CHATS_DIR, safe_email)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

def save_message(user_email: str, chat_id: str, role: str, content: str, title: str = None):
    """Save a message to a specific chat session."""
    user_dir = _get_user_chat_dir(user_email)
    chat_file = os.path.join(user_dir, f"{chat_id}.json")
    
    timestamp = datetime.datetime.now().isoformat()
    
    chat_data = {
        "id": chat_id,
        "title": "New Chat",
        "created_at": timestamp,
        "updated_at": timestamp,
        "messages": []
    }
    
    if os.path.exists(chat_file):
        with open(chat_file, "r") as f:
            try:
                chat_data = json.load(f)
            except json.JSONDecodeError:
                pass # Corrupt file, overwrite or handle? Overwriting for now to self-heal
    
    # Update title if provided and it's the first user message or checking validity
    if title:
        chat_data["title"] = title
    elif len(chat_data["messages"]) == 0 and role == "user":
        # Auto-generate title from first message (first 30 chars)
        chat_data["title"] = content[:30] + "..." if len(content) > 30 else content
        
    chat_data["updated_at"] = timestamp
    chat_data["messages"].append({
        "role": role,
        "content": content,
        "timestamp": timestamp
    })
    
    with open(chat_file, "w") as f:
        json.dump(chat_data, f, indent=2)

def get_user_chats(user_email: str) -> List[Dict]:
    """Get a list of all chat sessions for a user."""
    user_dir = _get_user_chat_dir(user_email)
    chats = []
    
    if not os.path.exists(user_dir):
        return []
        
    for filename in os.listdir(user_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(user_dir, filename)
            try:
                with open(file_path, "r") as f:
                    data = json.load(f)
                    chats.append({
                        "id": data.get("id"),
                        "title": data.get("title", "Untitled Chat"),
                        "updated_at": data.get("updated_at"),
                        "preview": data["messages"][-1]["content"][:50] if data.get("messages") else ""
                    })
            except Exception as e:
                print(f"Error reading chat file {filename}: {e}")
                
    # Sort by updated_at desc
    chats.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return chats

def get_chat_history(user_email: str, chat_id: str) -> Optional[Dict]:
    """Get full history for a specific chat."""
    user_dir = _get_user_chat_dir(user_email)
    chat_file = os.path.join(user_dir, f"{chat_id}.json")
    
    if not os.path.exists(chat_file):
        return None
        
    with open(chat_file, "r") as f:
        return json.load(f)

def create_chat(user_email: str, title: str = "New Chat") -> str:
    """Create a new chat session and return its ID."""
    chat_id = str(uuid.uuid4())
    save_message(user_email, chat_id, "system", "Chat initialized", title=title)
    # Remove the system message so it doesn't show up in UI, just to init the file? 
    # Actually, save_message appends. We can just init the file manually or pass empty content?
    # Let's just use save_message but maybe filter system messages in frontend if needed.
    # actually better to just initialize the file structure without a message
    
    user_dir = _get_user_chat_dir(user_email)
    chat_file = os.path.join(user_dir, f"{chat_id}.json")
    
    timestamp = datetime.datetime.now().isoformat()
    chat_data = {
        "id": chat_id,
        "title": title,
        "created_at": timestamp,
        "updated_at": timestamp,
        "messages": []
    }
    
    with open(chat_file, "w") as f:
        json.dump(chat_data, f, indent=2)
        
    return chat_id

def delete_chat(user_email: str, chat_id: str):
    """Delete a chat session."""
    user_dir = _get_user_chat_dir(user_email)
    chat_file = os.path.join(user_dir, f"{chat_id}.json")
    if os.path.exists(chat_file):
        os.remove(chat_file)

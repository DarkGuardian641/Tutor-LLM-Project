# TutorLLM: Your AI-Powered Study Companion 🎓

**TutorLLM** is an advanced educational platform that transforms your study materials into interactive learning experiences. Using Retrieval-Augmented Generation (RAG) and state-of-the-art LLMs, it provides a document-aware chatbot, automated flashcards, and dynamic quizzes to help students master their subjects.

---

## ✨ Key Features

- **📄 Document-Aware Chat (RAG)**: Upload PDFs or text files and have a conversation with your documents. The AI provides cited, context-aware answers.
- **🗂️ Auto-Flashcards**: Instantly generate conceptual flashcards from your study materials for active recall.
- **📝 Dynamic Quizzes**: Create custom Multiple Choice Questions (MCQs) with varying difficulty levels and detailed explanations.
- **🔐 Secure Multi-Tenant Architecture**: Individual data isolation ensures your chats and documents are private and secure.
- **🌐 Dual Authentication**: Sign in seamlessly with Google OAuth 2.0 or use a secure local email/password account.

---

## 🏗️ System Architecture

- **Frontend**: React 19 + Vite + Lucide Icons + Tailwind-inspired Vanilla CSS.
- **Backend**: FastAPI (Python) + LangChain.
- **AI Engine**: Ollama (supporting models like `gpt-oss` or `llama3`).
- **Vector Database**: ChromaDB for semantic search and document retrieval.
- **Database**: SQLite for user profiles and account metadata.

---

## 🚀 Getting Started

### Prerequisites

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js & npm](https://nodejs.org/)
- [Ollama](https://ollama.com/) (installed and running locally)

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure your environment variables in a `.env` file:
    ```env
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
    FRONTEND_URL=http://localhost:5173
    JWT_SECRET_KEY=your_secret_key
    OLLAMA_API_KEY=your_optional_key
    ```
5.  Run the server:
    ```bash
    python server.py
    ```

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

- `/backend`: FastAPI source code, AI chains, and API endpoints.
- `/frontend`: React application, components, and pages.
- `/data`: Local storage for user documents, SQLite database, and chat sessions.
- `/chroma_db_v3`: Persistent vector store for document embeddings.

---

## 🛡️ Security & Privacy

- **Password Hashing**: Uses `bcrypt` for secure storage.
- **Session Security**: Protected by JSON Web Tokens (JWT).
- **Data Isolation**: Every user’s chats and documents are siloed in private directory structures.

---

## 🚀 Future Roadmap

- Support for Word, PowerPoint, and Excel files.
- Collaborative study groups.
- Advanced analytics for student progress tracking.

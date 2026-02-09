import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, Folder, Clock, Send, Paperclip, Mic, Upload, File, Video, Link as LinkIcon, Plus, Loader } from 'lucide-react';
import '../styles/Chatbot.css';

const API_BASE_URL = 'http://localhost:8000';

const Chatbot = ({ user }) => {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: "Hello! I'm your study assistant. Ask me anything about your documents or any general subject you're working on."
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    
    const [chatId, setChatId] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatTitle, setChatTitle] = useState("New Chat");

    // Auto-scroll to bottom of chat
    const chatContentRef = useRef(null);

    useEffect(() => {
        if (chatContentRef.current) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
    }, [messages]);

    // Fetch chat history on mount/user change
    useEffect(() => {
        if (user?.email) {
            fetchChatHistory();
        }
    }, [user]);

    const fetchChatHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chats?user_email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setChatHistory(data);
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    };

    const loadChat = async (id) => {
        if (id === chatId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/chats/${id}?user_email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                // Transform messages to match frontend format
                const formattedMessages = data.messages.map(m => ({
                    type: m.role === 'user' ? 'user' : 'bot',
                    text: m.content
                }));
                setMessages(formattedMessages);
                setChatId(id);
                setChatTitle(data.title || "New Chat");
            }
        } catch (error) {
            console.error("Error loading chat:", error);
        }
    };

    const startNewChat = () => {
        setChatId(null);
        setChatTitle("New Chat");
        setMessages([{
            type: 'bot',
            text: "Hello! I'm your study assistant. Ask me anything about your documents or any general subject you're working on."
        }]);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { type: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Add a placeholder bot message
        setMessages(prev => [...prev, { type: 'bot', text: '' }]);

        let currentChatId = chatId;

        // Lazy create chat if not exists
        if (!currentChatId && user?.email) {
            try {
                const newTitle = inputValue.substring(0, 30) + (inputValue.length > 30 ? "..." : "");
                const createRes = await fetch(`${API_BASE_URL}/chats`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ user_email: user.email, title: newTitle })
                });
                if (createRes.ok) {
                    const data = await createRes.json();
                    currentChatId = data.chat_id;
                    setChatId(currentChatId);
                    setChatTitle(newTitle);
                    fetchChatHistory(); // Refresh list to show new chat
                }
            } catch (error) {
                console.error("Error creating chat:", error);
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    question: userMessage.text,
                    user_email: user?.email,
                    chat_id: currentChatId
                }),
            });

            if (!response.ok) {
                if (response.status === 500) throw new Error("Server error");
                 // Handle other errors if necessary
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    const lastMessage = { ...newMessages[lastIndex] };
                    lastMessage.text += chunk;
                    newMessages[lastIndex] = lastMessage;
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Error querying backend:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                // Remove the empty bot message if it failed immediately, or append error
                // Simplest is to replace/append error text
                 if(newMessages[newMessages.length - 1].type === 'bot'){
                    newMessages[newMessages.length - 1].text = "Sorry, I can't reach the server right now.";
                 } else {
                     newMessages.push({ type: 'bot', text: "Sorry, I can't reach the server right now." });
                 }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
            if (user?.email) fetchChatHistory(); // Refresh history to update preview/timestamp
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (user?.email) formData.append('user_email', user.email);
        if (chatId) formData.append('chat_id', chatId);

        setIsUploading(true);
        // Add user message for uploading
        const tempUserId = Date.now();
        
        setMessages(prev => [
            ...prev, 
            { type: 'user', text: `📂 Uploading ${file.name}...`, id: tempUserId }
        ]);

        try {
            const response = await fetch(`${API_BASE_URL}/ingest`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Update user message to distinct "Uploaded" state
                setMessages(prev => {
                    const updated = prev.map(msg => {
                        if (msg.id === tempUserId) {
                            return { ...msg, text: `📂 Uploaded: ${file.name}` };
                        }
                        return msg;
                    });
                    // Add bot confirmation
                    return [...updated, { type: 'bot', text: `✅ Document processed successfully: ${file.name}` }];
                });
            } else {
                 setMessages(prev => prev.map(msg => {
                    if (msg.id === tempUserId) return { ...msg, text: `❌ Failed to upload: ${file.name}` };
                    return msg;
                }));
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessages(prev => {
                const updated = prev.map(msg => {
                     if (msg.id === tempUserId) return { ...msg, text: `❌ Error uploading: ${file.name}` };
                     return msg;
                });
                return [...updated, { type: 'bot', text: `❌ Server error during upload.` }];
            });
            alert("Error uploading file.");
        } finally {
            setIsUploading(false);
            if (user?.email) fetchChatHistory();
        }
    };

    const triggerFileInput = () => {
        document.getElementById('file-upload-input').click();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="chatbot-content">
            {/* Main Chat Area */}
            <div className="chat-section">
                <header className="chat-header">
                    <h2>{chatTitle}</h2>
                    <div className="header-actions">
                    </div>
                </header>

                <div className="chat-content" ref={chatContentRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={msg.type === 'bot' ? 'bot-message' : 'user-message-container'}>
                             {msg.type === 'bot' ? (
                                <>
                                    <div className="bot-avatar">
                                        <div className="bot-icon">🎓</div>
                                    </div>
                                    <div className="message-content">
                                        <div className="message-text">
                                            {msg.type === 'uploading' ? (
                                                <div className="uploading-message">
                                                    <Loader className="spin" size={16} /> 
                                                    <span>{msg.text}</span>
                                                </div>
                                            ) : (
                                                msg.text ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown> : (isLoading && index === messages.length - 1 && <span className="thinking">Thinking...</span>)
                                            )}
                                        </div>
                                    </div>
                                </>
                             ) : (
                                <>
                                    <div className="user-message">
                                        {msg.text}
                                    </div>
                                    <div className="user-avatar">
                                        {user?.picture ? <img src={user.picture} alt="User" referrerPolicy="no-referrer" /> : "👤"}
                                    </div>
                                </>
                             )}
                        </div>
                    ))}
                    

                </div>

                <div className="chat-input-area">
                    <div className="chat-input-wrapper">
                        <button className="icon-btn" onClick={triggerFileInput}>
                            <Paperclip className="chat-upload-icon" size={20} />
                        </button>

                        <input 
                            type="text" 
                            placeholder="Type your question here..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button className="send-btn" onClick={handleSendMessage} disabled={isLoading}>
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="disclaimer">TutorLLM AI CAN MAKE MISTAKES. VERIFY YOUR FACTS.</div>
                </div>
            </div>

            {/* Right Panel: Chat History */}
            <div className="knowledge-base-panel">
                <div className="kb-header">
                    <h3>CHAT HISTORY</h3>
                    <div className="new-chat-btn" onClick={startNewChat} style={{cursor: 'pointer', color: 'var(--accent-orange)', fontSize: '0.8rem'}}>
                        <Plus size={16} /> New
                    </div>
                </div>

                <div className="file-list">
                    {chatHistory.length === 0 ? (
                        <div style={{color: '#666', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px'}}>No previous chats.</div>
                    ) : (
                        chatHistory.map((chat) => (
                            <div 
                                key={chat.id} 
                                className={`file-item ${chatId === chat.id ? 'active' : ''}`}
                                onClick={() => loadChat(chat.id)}
                            >
                                <div className="file-icon" style={{backgroundColor: '#333'}}>
                                    <Clock size={20} />
                                </div>
                                <div className="file-info">
                                    <div className="file-name" title={chat.title}>{chat.title || "Untitled Chat"}</div>
                                    <div className="file-meta">
                                        {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString() : ""}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* Hidden file input for uploads */}
                <input 
                    type="file" 
                    id="file-upload-input" 
                    style={{display: 'none'}} 
                    onChange={handleFileUpload} 
                    accept="*"
                />
            </div>
        </div>
    );
};

export default Chatbot;

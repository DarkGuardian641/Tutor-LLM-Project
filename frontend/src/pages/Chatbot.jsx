import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, Folder, Clock, Send, Paperclip, Mic, Upload, File, Video, Link as LinkIcon, Plus, Loader } from 'lucide-react';
import '../styles/Chatbot.css';

const API_BASE_URL = 'http://localhost:8000';

const Chatbot = () => {
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
    
    // Auto-scroll to bottom of chat
    const chatContentRef = useRef(null);

    useEffect(() => {
        if (chatContentRef.current) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
    }, [messages]);

    // Fetch files on mount
    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/files`);
            if (response.ok) {
                const data = await response.json();
                setFiles(data);
            }
        } catch (error) {
            console.error("Error fetching files:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { type: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Add a placeholder bot message
        setMessages(prev => [...prev, { type: 'bot', text: '' }]);

        try {
            const response = await fetch(`${API_BASE_URL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: userMessage.text }),
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
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/ingest`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Refresh file list
                fetchFiles();
                alert("File uploaded and ingested successfully!");
            } else {
                alert("Failed to upload file.");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Error uploading file.");
        } finally {
            setIsUploading(false);
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
                    <h2>Chat & Knowledge Base</h2>
                    <div className="header-actions">
                        <Search className="header-icon" />
                        <button className="folders-btn"><Folder size={16} /> Folders</button>
                        <Clock className="header-icon" />
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
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                        </div>
                                    </div>
                                </>
                             ) : (
                                <>
                                    <div className="user-message">
                                        {msg.text}
                                    </div>
                                    <div className="user-avatar">👤</div>
                                </>
                             )}
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="bot-message">
                             <div className="bot-avatar"><div className="bot-icon">🎓</div></div>
                             <div className="message-text">Thinking...</div>
                        </div>
                    )}
                </div>

                <div className="chat-input-area">
                    <div className="input-wrapper">
                        <button className="icon-btn" onClick={triggerFileInput}>
                            <Paperclip className="input-icon" size={20} />
                        </button>
                        <div className="image-icon-wrapper"><div className="image-icon">🖼️</div></div>
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

            {/* Right Panel: Knowledge Base */}
            <div className="knowledge-base-panel">
                <div className="kb-header">
                    <h3>KNOWLEDGE BASE</h3>
                    <a href="#" className="view-all">View all</a>
                </div>

                <div className="kb-actions">
                    <input 
                        type="file" 
                        id="file-upload-input" 
                        style={{display: 'none'}} 
                        onChange={handleFileUpload} 
                        accept=".pdf,.doc,.docx,.txt"
                    />
                    <div className="action-btn upload" onClick={triggerFileInput}>
                        {isUploading ? <Loader className="spin" size={20} /> : <Upload size={20} />}
                        <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    </div>
                </div>

                <div className="file-list">
                    {files.length === 0 ? (
                        <div style={{color: '#666', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px'}}>No files uploaded yet.</div>
                    ) : (
                        files.map((file, index) => (
                            <div key={index} className="file-item">
                                <div className="file-icon pdf"><File size={20} /></div>
                                <div className="file-info">
                                    <div className="file-name" title={file.name}>{file.name}</div>
                                    <div className="file-meta">{formatFileSize(file.size)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chatbot;

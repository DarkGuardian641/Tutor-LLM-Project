import React, { useState } from 'react';
import '../styles/Flashcards.css';
import { Sparkles, ChevronLeft, ChevronRight, RotateCw, Loader, Upload } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const Flashcards = () => {
    const [topic, setTopic] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, active
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setStatus('loading');
        setTopic(`File: ${file.name}`); // Set topic for UI context

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Ingest
            const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
                method: 'POST',
                body: formData,
            });

            if (uploadResponse.ok) {
                setUploadedFile(file.name);
                // 2. Generate immediately using filename as topic/context hint
                // Actually, passing the filename as "topic" usually works well if RAG retrieves by filename or content
                // Let's call the flashcard endpoint now
                
                const response = await fetch(`${API_BASE_URL}/flashcards`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: `Key concepts from ${file.name}` })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.flashcards && data.flashcards.length > 0) {
                        setCards(data.flashcards);
                        setCurrentIndex(0);
                        setIsFlipped(false);
                        setStatus('active');
                    } else {
                        alert("No flashcards generated from file.");
                        setStatus('idle');
                    }
                } else {
                    alert("Failed to generate flashcards.");
                    setStatus('idle');
                }
            } else {
                alert("Upload failed.");
                setStatus('idle');
            }
        } catch (error) {
            console.error("Upload/Gen error:", error);
            setStatus('idle');
        } finally {
            setIsUploading(false);
        }
    };

    const generateFlashcards = async () => {
        if (!topic.trim()) return;
        setStatus('loading');
        try {
            const response = await fetch(`${API_BASE_URL}/flashcards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Flashcards:", data);
                if (data.flashcards && data.flashcards.length > 0) {
                    setCards(data.flashcards);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setStatus('active');
                } else {
                    alert("No flashcards generated. Try a different topic.");
                    setStatus('idle');
                }
            } else {
                alert("Failed to generate flashcards.");
                setStatus('idle');
            }
        } catch (error) {
            console.error("Flashcard gen error:", error);
            setStatus('idle');
        }
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150); // Slight delay for flip reset
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const reset = () => {
        setStatus('idle');
        setCards([]);
        setTopic('');
    };

    if (status === 'loading') {
        return (
            <div className="flashcards-container loading">
                 <Loader className="spin" size={48} color="var(--accent-orange)" />
                 <p>Generating flashcards for "{topic}"...</p>
                 <span style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>This might take a moment.</span>
            </div>
        );
    }

    if (status === 'active') {
        const currentCard = cards[currentIndex];
        const progress = ((currentIndex + 1) / cards.length) * 100;

        return (
            <div className="flashcards-container active-view">
                <header className="fc-header">
                    <button className="back-btn" onClick={reset}>
                        <ChevronLeft size={20} />
                        Back to Topics
                    </button>
                    <h2>{topic}</h2>
                    <div className="progress-wrapper">
                        <span className="progress-text">{currentIndex + 1} / {cards.length}</span>
                    </div>
                </header>

                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="card-stage">
                    <div 
                        className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
                        onClick={handleFlip}
                    >
                        <div className="card-front">
                            <span className="card-label">QUESTION</span>
                            <p className="card-content">{currentCard.question}</p>
                            <span className="tap-hint">Click to flip card</span>
                        </div>
                        <div className="card-back">
                            <span className="card-label">ANSWER</span>
                            <p className="card-content">{currentCard.answer}</p>
                            <span className="tap-hint">Click to flip back</span>
                        </div>
                    </div>
                </div>

                <div className="fc-controls">
                    <button className="nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>
                        <ChevronLeft size={24} />
                    </button>
                    
                    <button className="nav-btn" onClick={handleNext} disabled={currentIndex === cards.length - 1}>
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        );
    }

    // Idle / Config View
    return (
        <div className="flashcards-container config">
            <div className="fc-welcome">
                <h1>Flashcard Generator</h1>
                <p>Master any topic with AI-generated study cards.</p>
                
                <div className="fc-input-group">
                    <input 
                        type="text" 
                        placeholder="Enter a topic (e.g., 'Photosynthesis', 'World War II')" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                    />
                    <button onClick={generateFlashcards} disabled={!topic.trim()}>
                        <Sparkles size={20} />
                        Generate
                    </button>
                </div>
                
                <div className="fc-divider">
                    <span>OR</span>
                </div>

                <div className="fc-upload-section">
                     <input 
                        type="file" 
                        id="fc-file-upload" 
                        style={{display: 'none'}} 
                        onChange={handleFileUpload}
                     />
                    <button className="upload-generate-btn" onClick={() => document.getElementById('fc-file-upload').click()}>
                        {isUploading ? <Loader className="spin" size={20}/> : <Upload size={20} />}
                        {uploadedFile ? `Generatng from ${uploadedFile}...` : "Upload File & Generate"}
                    </button>
                    <p className="upload-hint">Upload a PDF or Text file to auto-generate flashcards.</p>
                </div>
            </div>
        </div>
    );
};

export default Flashcards;

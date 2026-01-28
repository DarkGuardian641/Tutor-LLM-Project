import React, { useState } from 'react';
import '../styles/Quizzes.css';
import { Sparkles, Folder, FileText, CheckCircle, ChevronRight, Play, RefreshCw, Upload, Loader } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const Quizzes = () => {
    // idle, loading, ready, results
    const [status, setStatus] = useState('idle'); 
    const [step, setStep] = useState(1);
    
    // Config State
    const [source, setSource] = useState('kb'); // kb or file
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState('Medium');
    const [topic, setTopic] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Quiz Data
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(0);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/ingest`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setUploadedFile(file.name);
                alert("File uploaded!");
            } else {
                alert("Upload failed.");
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const generateQuiz = async () => {
        setStatus('loading');
        try {
            const response = await fetch(`${API_BASE_URL}/generate_quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic, // If empty, backend handles it
                    count: numQuestions,
                    difficulty: difficulty
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Quiz Data:", data);
                // Ensure data.questions exists, fallback if raw list
                const qList = data.questions || data; 
                setQuestions(qList);
                setStatus('ready');
                setUserAnswers({});
            } else {
                alert("Failed to generate quiz.");
                setStatus('idle');
            }
        } catch (error) {
            console.error("Quiz gen error:", error);
            setStatus('idle');
        }
    };

    const handleAnswerSelect = (qIndex, option) => {
        setUserAnswers(prev => ({
            ...prev,
            [qIndex]: option
        }));
    };

    const submitQuiz = () => {
        let sc = 0;
        questions.forEach((q, idx) => {
            // Check if answer matches (Assuming answer is "A" or "Option Text" - Backend instruction was "A")
            // Ideally backend returns full text or index. Let's assume letter matching for now if options are lettered, 
            // or full text matching.
            // My prompt said: options: ["A", "B"...], answer: "A". 
            // BUT options list usually is just text: ["Photosynthesis is...", "Respiration is..."].
            // If answer is "A", it means index 0. Let's verify prompt logic. 
            // In quiz.py: options: List[str]. answer: "A".
            // So if user selects option 0, that corresponds to "A".
            
            const selectedLetter = String.fromCharCode(65 + questions[idx].options.indexOf(userAnswers[idx]));
            // Actually it's easier to just compare indices or map letter back.
            // Let's rely on index.
            
            // Wait, if backend says answer="A", and user selected the text of option A (index 0).
            const answerIndex = q.answer.charCodeAt(0) - 65; 
            if (questions[idx].options[answerIndex] === userAnswers[idx]) {
                sc++;
            }
        });
        setScore(sc);
        setStatus('results');
    };

    const resetQuiz = () => {
        setStatus('idle');
        setStep(1);
        setQuestions([]);
        setUserAnswers({});
        setScore(0);
    };

    if (status === 'loading') {
        return (
            <div className="quiz-container loading">
                <Loader className="spin" size={48} color="var(--accent-orange)" />
                <p>Generating your custom quiz...</p>
                <span className="sub-text">Analyzing documents and crafting questions...</span>
            </div>
        );
    }

    if (status === 'ready') {
        return (
            <div className="quiz-container taking">
                <header className="quiz-header centered">
                    <h2>Topic: {topic || "General Knowledge"}</h2>
                    <div className="quiz-meta">
                        <span>{questions.length} Questions</span>
                    </div>
                </header>
                
                <div className="questions-list centered-list">
                    {questions.map((q, idx) => (
                        <div key={idx} className="question-card">
                            <span className="q-num">Question {idx + 1}</span>
                            <p className="q-text">{q.question}</p>
                            <div className="options-grid">
                                {q.options.map((opt, oIdx) => (
                                    <div 
                                        key={oIdx} 
                                        className={`option-item ${userAnswers[idx] === opt ? 'selected' : ''}`}
                                        onClick={() => handleAnswerSelect(idx, opt)}
                                    >
                                        <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                                        <span className="opt-text">{opt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="quiz-actions centered-actions">
                    <button className="submit-btn" onClick={submitQuiz}>Submit Quiz</button>
                </div>
            </div>
        );
    }

    if (status === 'results') {
        return (
            <div className="quiz-container results">
                <div className="score-summary centered">
                    <h1>Quiz Results</h1>
                    <div className="score-display-small">
                        <span className="score-val">{score}</span>
                        <span className="score-sep">/</span>
                        <span className="score-total">{questions.length}</span>
                    </div>
                </div>

                <div className="review-list centered-list">
                    {questions.map((q, idx) => {
                        const isCorrect = userAnswers[idx] === questions[idx].answer; // Assuming answer logic holds
                        // Re-verify answer logic:
                        // Backend sends answer="A". We need to match option index.
                        // Wait, my previous submission logic assumed we match text or index.
                        // Let's refine valid comparison here and in submit.
                        // Let's assume logic: q.answer is "A". 
                        const correctIndex = q.answer.charCodeAt(0) - 65;
                        const correctText = q.options[correctIndex];
                        const userText = userAnswers[idx];
                        const userCorrect = userText === correctText;

                        return (
                            <div key={idx} className={`review-card ${userCorrect ? 'correct' : 'wrong'}`}>
                                <div className="review-header">
                                    <span className="q-num">Question {idx + 1}</span>
                                    {userCorrect ? <CheckCircle size={20} color="#4caf50"/> : <div className="icon-wrong">✖</div>}
                                </div>
                                <p className="q-text">{q.question}</p>
                                
                                <div className="review-answers">
                                    <div className={`review-opt user-opt ${userCorrect ? 'correct' : 'wrong'}`}>
                                        <span className="label">You Answered:</span>
                                        <span className="val">{userText || "Skipped"}</span>
                                    </div>
                                    {!userCorrect && (
                                        <div className="review-opt correct-opt">
                                            <span className="label">Correct Answer:</span>
                                            <span className="val">{correctText}</span>
                                        </div>
                                    )}
                                </div>

                                {!userCorrect && q.explanation && (
                                    <div className="explanation-box">
                                        <strong>Explanation:</strong> {q.explanation}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="quiz-actions centered-actions">
                    <button className="restart-btn" onClick={resetQuiz}>Create New Quiz</button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-container config">
            <header className="wizard-header">
                <h1>Quiz Generator</h1>
                <p>Create custom practice tests from your uploaded materials.</p>
            </header>

            <div className="wizard-step">
                <div className="step-label">
                    <span className="step-num">1</span>
                    <h3>Select Knowledge Source</h3>
                </div>
                <div className="source-cards">
                    <div 
                        className={`source-card ${source === 'kb' ? 'active' : ''}`}
                        onClick={() => setSource('kb')}
                    >
                        <Folder size={24} />
                        <div className="sc-info">
                            <h4>Knowledge Base</h4>
                            <p>Use all your uploaded documents and notes</p>
                        </div>
                        {source === 'kb' && <CheckCircle className="check-icon" size={20} />}
                    </div>

                    <div 
                        className={`source-card ${source === 'file' ? 'active' : ''}`}
                        onClick={() => setSource('file')}
                    >
                        <FileText size={24} />
                        <div className="sc-info">
                            <h4>Specific Files</h4>
                            <p>Select individual PDFs or text documents</p>
                        </div>
                        {source === 'file' && <CheckCircle className="check-icon" size={20} />}
                    </div>
                </div>

                {source === 'file' && (
                     <div className="file-upload-inline">
                        <input 
                            type="file" 
                            id="quiz-file-input" 
                            style={{display: 'none'}} 
                            onChange={handleFileUpload}
                        />
                        <button className="upload-btn" onClick={() => document.getElementById('quiz-file-input').click()}>
                            {isUploading ? <Loader className="spin" size={16}/> : <Upload size={16} />}
                            {uploadedFile ? uploadedFile : "Upload File"}
                        </button>
                     </div>
                )}
            </div>

            <div className="wizard-step">
                <div className="step-label">
                    <span className="step-num">2</span>
                    <h3>Configure Settings</h3>
                </div>
                
                <div className="settings-grid">
                    <div className="setting-group">
                        <label>Question Type</label>
                        <select className="std-select" disabled>
                            <option>Multiple Choice (MCQ)</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>Question Count: {numQuestions}</label>
                        <input 
                            type="range" 
                            min="3" 
                            max="15" 
                            value={numQuestions} 
                            onChange={(e) => setNumQuestions(e.target.value)} 
                            className="std-range"
                        />
                    </div>

                    <div className="setting-group">
                        <label>Difficulty Level</label>
                        <div className="difficulty-pills">
                            {['Easy', 'Medium', 'Hard'].map(lvl => (
                                <button 
                                    key={lvl} 
                                    className={`pill ${difficulty === lvl ? 'active' : ''}`}
                                    onClick={() => setDifficulty(lvl)}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="wizard-step">
                <div className="step-label">
                    <span className="step-num">3</span>
                    <h3>Focus Area (Optional)</h3>
                </div>
                <input 
                    type="text" 
                    className="std-input" 
                    placeholder="E.g. Focus on Chapter 4: Photosynthesis..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
            </div>

            <div className="wizard-actions">
                <button className="generate-btn" onClick={generateQuiz}>
                    <Sparkles size={20} />
                    Generate Quiz
                </button>
            </div>
        </div>
    );
};

export default Quizzes;

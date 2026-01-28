import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Chatbot from './pages/Chatbot';
import Quizzes from './pages/Quizzes';
import Flashcards from './pages/Flashcards';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chatbot');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-main">
        {activeTab === 'chatbot' && <Chatbot />}
        {activeTab === 'quizzes' && <Quizzes />}
        {activeTab === 'flashcards' && <Flashcards />}
      </main>
    </div>
  );
}

export default App;

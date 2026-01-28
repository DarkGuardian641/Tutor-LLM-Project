import React from 'react';
import { LayoutGrid, Layers, FileText, Smartphone, User, GraduationCap } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange }) => {
    return (
        <div className="sidebar">
            <div className="logo-container">
                <GraduationCap className="logo-icon" size={28} />
                <span className="logo-text">Tutor LLM</span>
            </div>

            <nav className="nav-menu">
                <div 
                    className={`nav-item ${activeTab === 'chatbot' ? 'active' : ''}`}
                    onClick={() => onTabChange('chatbot')}
                >
                    <Layers size={20} />
                    <span>Chatbot</span>
                </div>
                
                <div 
                    className={`nav-item ${activeTab === 'flashcards' ? 'active' : ''}`}
                    onClick={() => onTabChange('flashcards')}
                >
                    <LayoutGrid size={20} />
                    <span>Flash Cards</span>
                </div>
                
                <div 
                    className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => onTabChange('quizzes')}
                >
                    <FileText size={20} />
                    <span>Quizzes</span>
                </div>
                
                <div className="nav-item">
                    <Smartphone size={20} />
                    <span>App</span>
                </div>
            </nav>

            <div className="user-profile">
                <div className="avatar">
                    <User size={20} />
                </div>
                <span>Sign in</span>
            </div>
        </div>
    );
};

export default Sidebar;

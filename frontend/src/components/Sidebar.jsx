import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Layers, FileText, Smartphone, User, GraduationCap, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange, user, onLogout }) => {
    const [showPopup, setShowPopup] = useState(false);
    const popupRef = useRef(null);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

            <div className="user-profile-container" ref={popupRef}>
                {showPopup && (
                    <div className="user-popup">
                        <button onClick={onLogout} className="logout-btn">
                            <LogOut size={18} />
                            <span>Sign out</span>
                        </button>
                    </div>
                )}
                <div 
                    className={`user-profile ${showPopup ? 'active' : ''}`} 
                    onClick={() => setShowPopup(!showPopup)} 
                    title={user?.name || 'User'}
                >
                    <div className="avatar">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                        ) : (
                            user?.name ? <span style={{fontWeight: 'bold', color: 'var(--text-primary)'}}>{user.name.charAt(0).toUpperCase()}</span> : <User size={20} />
                        )}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'User'}</span>
                        {user?.email && <span className="user-email" title={user.email}>{user.email}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

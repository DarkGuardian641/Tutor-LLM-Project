import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chatbot from './pages/Chatbot';
import Quizzes from './pages/Quizzes';
import Flashcards from './pages/Flashcards';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './styles/App.css';

// Auth Callback Component (handles OAuth redirect)
function AuthCallback({ onAuthSuccess }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const picture = searchParams.get('picture');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth Error:', error);
      navigate('/');
      return;
    }

    if (token) {
      // Store the auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userName', name || '');
      localStorage.setItem('userEmail', email || '');
      if (picture) localStorage.setItem('userPicture', picture);
      
      // Notify parent component of successful auth
      if (onAuthSuccess) {
        onAuthSuccess({ token, name, email, picture });
      }
      navigate('/');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, onAuthSuccess]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#121212',
      color: '#ffffff'
    }}>
      <p>Completing sign in...</p>
    </div>
  );
}

// MainApp Component
function MainApp({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user}
        onLogout={onLogout}
      />
      <main className="app-main">
        {activeTab === 'chatbot' && <Chatbot user={user} />}
        {activeTab === 'quizzes' && <Quizzes />}
        {activeTab === 'flashcards' && <Flashcards />}
      </main>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('chatbot');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      setUser({
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        picture: localStorage.getItem('userPicture') // Assuming we store this later or use simple fallback
      });
    }
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setUser({
      name: localStorage.getItem('userName'),
      email: localStorage.getItem('userEmail'),
      picture: localStorage.getItem('userPicture')
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPicture');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Routes>
      <Route 
        path="/auth/callback" 
        element={<AuthCallback onAuthSuccess={handleAuthSuccess} />} 
      />
      <Route 
        path="/*" 
        element={
          isAuthenticated ? (
            <MainApp 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            authMode === 'login' ? (
              <Login 
                onSwitchToSignup={() => setAuthMode('signup')}
                onLoginSuccess={handleAuthSuccess}
              />
            ) : (
              <Signup 
                onSwitchToLogin={() => setAuthMode('login')}
                onSignupSuccess={handleAuthSuccess}
              />
            )
          )
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

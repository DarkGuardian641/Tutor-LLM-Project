import React from 'react';
import { LayoutGrid, Layers, FileText, Smartphone, User, GraduationCap } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="logo-container">
                <GraduationCap className="logo-icon" size={28} />
                <span className="logo-text">TutorLLM</span>
            </div>

            <nav className="nav-menu">
                <div className="nav-item">
                    <LayoutGrid size={20} />
                    <span>Study Sets</span>
                </div>
                <div className="nav-item active">
                    <Layers size={20} />
                    <span>Solve</span>
                </div>
                <div className="nav-item">
                    <FileText size={20} />
                    <span>Paper Grader</span>
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

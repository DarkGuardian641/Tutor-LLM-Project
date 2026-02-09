import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import '../styles/Auth.css';

// Custom Google Icon Component
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

// Custom Graduation Cap Icon
const GraduationCapIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
);

const Signup = ({ onSwitchToLogin, onSignupSuccess }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const API_BASE_URL = 'http://localhost:8000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        setIsLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: formData.fullName, 
                    email: formData.email, 
                    password: formData.password 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Account created successfully! Please sign in.");
                onSwitchToLogin();
            } else {
                console.error("Signup error:", data.detail || "Signup failed");
                alert(data.detail || "An error occurred during signup");
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("An error occurred during signup");
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength checker
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '' };
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        return { strength, label: labels[strength] };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="auth-container">
            {/* Background Effects */}
            <div className="auth-bg-effects">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="auth-card signup-card">
                {/* Logo Section */}
                <div className="auth-logo">
                    <div className="logo-icon-wrapper">
                    <GraduationCapIcon />
                    </div>
                    <h1>Tutor LLM</h1>
                </div>

                {/* Welcome Text */}
                <div className="auth-header">
                    <h2>Create your account</h2>
                    <p>Start your personalized learning experience</p>
                </div>

                {/* Social Login */}
                <div className="social-login">
                    <button 
                        className="social-btn google" 
                        type="button"
                        onClick={() => window.location.href = 'http://localhost:8000/auth/google/login'}
                    >
                        <GoogleIcon />
                        <span>Sign up with Google</span>
                    </button>
                </div>

                <div className="divider">
                    <span>or sign up with email</span>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label htmlFor="fullName">Full Name</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="signup-email">Email Address</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                id="signup-email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="signup-password">Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="signup-password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div 
                                        className={`strength-fill strength-${passwordStrength.strength}`}
                                        style={{ width: `${passwordStrength.strength * 25}%` }}
                                    ></div>
                                </div>
                                <span className={`strength-label strength-${passwordStrength.strength}`}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <CheckCircle size={18} className="match-icon" />
                            )}
                        </div>
                    </div>


                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            <div className="btn-loader"></div>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Switch to Login */}
                <p className="auth-switch">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="switch-btn">
                        Sign in
                    </button>
                </p>
            </div>

            {/* Footer */}
            <div className="auth-footer">
                {/* <p>© 2026 Tutor LLM. All rights reserved.</p> */}
            </div>
        </div>
    );
};

export default Signup;

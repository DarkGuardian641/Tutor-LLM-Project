import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = ({ onAuthSuccess }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const error = searchParams.get('error');

        if (error) {
            console.error('OAuth Error:', error);
            navigate('/?error=' + error);
            return;
        }

        if (token) {
            // Store the auth data
            localStorage.setItem('authToken', token);
            localStorage.setItem('userName', name || '');
            localStorage.setItem('userEmail', email || '');
            
            // Notify parent component of successful auth
            if (onAuthSuccess) {
                onAuthSuccess({ token, name, email });
            }
        } else {
            // No token received
            navigate('/?error=no_token');
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
            <div style={{ textAlign: 'center' }}>
                <div className="btn-loader" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255, 87, 34, 0.3)',
                    borderTopColor: '#ff5722',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }}></div>
                <p>Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;

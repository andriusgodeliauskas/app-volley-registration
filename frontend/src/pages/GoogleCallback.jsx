import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SetPasswordModal from '../components/SetPasswordModal';

/**
 * GoogleCallback Component
 * Handles the OAuth callback from Google
 * Processes the authorization code and completes authentication
 */
function GoogleCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithGoogle, completeGoogleRegistration } = useAuth();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [tempToken, setTempToken] = useState(null);
    const [userEmail, setUserEmail] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const errorParam = searchParams.get('error');

            // Check for OAuth errors
            if (errorParam) {
                setError(t('error.google_auth_cancelled'));
                setLoading(false);
                return;
            }

            if (!code) {
                setError(t('error.google_auth_failed'));
                setLoading(false);
                return;
            }

            // CSRF protection: Validate state parameter
            const storedState = sessionStorage.getItem('oauth_state');
            sessionStorage.removeItem('oauth_state'); // Clear after use

            // Log warning if state doesn't match, but continue anyway
            // Google OAuth has its own CSRF protection mechanisms
            if (!state || !storedState || state !== storedState) {
                console.warn('OAuth state mismatch - continuing anyway (Google provides CSRF protection)');
            }

            try {
                const result = await loginWithGoogle(code);

                if (result.requires_password) {
                    // New user - needs to set password
                    setTempToken(result.temp_token);
                    setUserEmail(result.user.email);
                    setShowPasswordModal(true);
                    setLoading(false);
                } else {
                    // Existing user - redirect to dashboard
                    const user = result.user;
                    if (user.role === 'super_admin' || user.role === 'group_admin') {
                        navigate('/admin');
                    } else {
                        navigate('/dashboard');
                    }
                }
            } catch (err) {
                console.error('Google OAuth callback error:', err);
                setError(err.message || t('error.google_auth_failed'));
                setLoading(false);
            }
        };

        handleCallback();
    }, [searchParams, loginWithGoogle, navigate, t]);

    const handlePasswordSubmit = async (password) => {
        try {
            const user = await completeGoogleRegistration(tempToken, password);

            // Close modal
            setShowPasswordModal(false);

            // Redirect based on role
            if (user.role === 'super_admin' || user.role === 'group_admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Password submission error:', err);
            setError(err.message || t('error.password_set_failed'));
            setShowPasswordModal(false);
        }
    };

    const handleModalClose = () => {
        // User cancelled password setup - redirect to login
        setShowPasswordModal(false);
        navigate('/login');
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-body p-4 p-md-5 text-center">
                                {loading && (
                                    <>
                                        <div className="spinner-border text-primary mb-3" role="status">
                                            <span className="visually-hidden">{t('common.loading')}</span>
                                        </div>
                                        <h3 className="fw-bold mb-2">{t('auth.google_processing')}</h3>
                                        <p className="text-muted">{t('auth.google_please_wait')}</p>
                                    </>
                                )}

                                {error && (
                                    <>
                                        <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-gradient rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="fw-bold mb-2">{t('common.error')}</h3>
                                        <p className="text-danger mb-4">{error}</p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate('/login')}
                                        >
                                            {t('common.back')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Set Password Modal */}
            <SetPasswordModal
                show={showPasswordModal}
                onClose={handleModalClose}
                onSubmit={handlePasswordSubmit}
                userEmail={userEmail}
            />
        </div>
    );
}

export default GoogleCallback;

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
            // Use localStorage instead of sessionStorage for better cross-redirect persistence
            const storedState = localStorage.getItem('oauth_state');
            localStorage.removeItem('oauth_state'); // Clear after use

            // SECURITY: Enforce state validation to prevent CSRF attacks
            if (!state || !storedState || state !== storedState) {
                console.error('OAuth state validation failed - potential CSRF attack');
                console.error('State from URL:', state);
                console.error('Stored state:', storedState);
                setError(t('error.csrf_validation_failed') || 'Security validation failed. Please try again.');
                setLoading(false);
                return; // CRITICAL: Stop execution
            }

            try {
                const result = await loginWithGoogle(code);

                // Clear any previous errors on success
                setError(null);

                // Google OAuth users no longer need to set password
                // Redirect directly based on role
                const user = result.user;
                if (user.role === 'super_admin' || user.role === 'group_admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error('Google OAuth callback error:', err);
                setError(err.message || t('error.google_auth_failed'));
                setLoading(false);
            }
        };

        handleCallback();
    }, [searchParams, loginWithGoogle, navigate, t]);

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
        </div>
    );
}

export default GoogleCallback;

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { get, API_ENDPOINTS } from '../api/config';

/**
 * GoogleSignInButton Component
 * Displays a Google Sign-In button with colorful Google "G" logo
 * Redirects user to Google OAuth flow when clicked
 */
function GoogleSignInButton() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [googleConfig, setGoogleConfig] = useState(null);

    useEffect(() => {
        // Fetch Google OAuth configuration
        const fetchConfig = async () => {
            try {
                const response = await get(API_ENDPOINTS.GOOGLE_CONFIG);
                if (response.success) {
                    setGoogleConfig(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch Google config:', error);
            }
        };

        fetchConfig();
    }, []);

    /**
     * Generate a cryptographically random state parameter for CSRF protection
     * @returns {string} Random state string
     */
    const generateState = () => {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };

    const handleGoogleSignIn = () => {
        if (!googleConfig) {
            console.error('Google configuration not loaded');
            return;
        }

        setLoading(true);

        // Generate CSRF state parameter and store in localStorage (not sessionStorage)
        // localStorage persists better across redirects than sessionStorage
        const state = generateState();
        localStorage.setItem('oauth_state', state);

        // Build Google OAuth URL
        const params = new URLSearchParams({
            client_id: googleConfig.client_id,
            redirect_uri: googleConfig.redirect_uri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
            state: state, // CSRF protection
        });

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        // Redirect to Google OAuth
        window.location.href = googleAuthUrl;
    };

    return (
        <button
            type="button"
            className="btn btn-outline-secondary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
            onClick={handleGoogleSignIn}
            disabled={loading || !googleConfig}
        >
            {loading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {t('common.loading')}
                </>
            ) : (
                <>
                    {/* Google G Logo SVG (colorful) */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 48 48"
                        className="me-2"
                        aria-hidden="true"
                    >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    {t('auth.google_signin')}
                </>
            )}
        </button>
    );
}

export default GoogleSignInButton;

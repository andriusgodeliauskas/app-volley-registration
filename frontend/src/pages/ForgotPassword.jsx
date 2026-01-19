import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, post } from '../api/config';
import LanguageSwitcher from '../components/LanguageSwitcher';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [localError, setLocalError] = useState(null);
    const { t } = useLanguage();

    // Auto-dismiss local error after 10 seconds
    useEffect(() => {
        if (localError) {
            const timer = setTimeout(() => {
                setLocalError(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [localError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSubmitting || success) {
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setLocalError(t('validation.email_invalid'));
            return;
        }

        setLocalError(null);
        setIsSubmitting(true);

        try {
            const response = await post(API_ENDPOINTS.FORGOT_PASSWORD, { email });

            if (response.success) {
                setSuccess(true);
            } else {
                setLocalError(response.message || t('common.error'));
            }
        } catch (err) {
            console.error('Forgot password error:', err);

            // Handle specific error messages
            const errorMsg = err.message || t('common.error');
            if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('too many')) {
                setLocalError(t('error.rate_limit_password_reset'));
            } else {
                setLocalError(errorMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            {/* Language Switcher - Top Right */}
            <div className="position-absolute top-0 end-0 m-3">
                <LanguageSwitcher />
            </div>

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">

                        {/* Card */}
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-body p-4 p-md-5">

                                {!success ? (
                                    <>
                                        {/* Header */}
                                        <div className="text-center mb-4">
                                            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-gradient rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                                                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
                                                </svg>
                                            </div>
                                            <h2 className="fw-bold mb-1">{t('auth.forgot_password_title')}</h2>
                                            <p className="text-muted mb-0">{t('auth.forgot_password_description')}</p>
                                        </div>

                                        {/* Error Alert */}
                                        {localError && (
                                            <div className="alert alert-danger d-flex align-items-center py-2 fade show" role="alert">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2 flex-shrink-0" viewBox="0 0 16 16">
                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                                                </svg>
                                                <span className="flex-grow-1">{localError}</span>
                                                <button type="button" className="btn-close m-0 p-0" onClick={() => setLocalError(null)} aria-label="Close"></button>
                                            </div>
                                        )}

                                        {/* Form */}
                                        <form onSubmit={handleSubmit} action="javascript:void(0)">
                                            {/* Email Field */}
                                            <div className="mb-4">
                                                <label htmlFor="email" className="form-label fw-medium">{t('auth.email')}</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="email"
                                                        className="form-control border-start-0 ps-0"
                                                        id="email"
                                                        placeholder={t('placeholder.email')}
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        autoComplete="email"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100 py-2 fw-semibold mb-3"
                                                disabled={isSubmitting}
                                                style={{ minHeight: '44px' }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        {t('common.loading')}
                                                    </>
                                                ) : (
                                                    t('auth.send_reset_link')
                                                )}
                                            </button>

                                            {/* Back to Login Link */}
                                            <div className="text-center">
                                                <Link to="/login" className="text-decoration-none small">
                                                    {t('auth.back_to_login')}
                                                </Link>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        {/* Success State */}
                                        <div className="text-center">
                                            <div className="d-inline-flex align-items-center justify-content-center bg-success bg-gradient rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                                                </svg>
                                            </div>
                                            <h3 className="fw-bold mb-3">{t('auth.forgot_password_success_title')}</h3>
                                            <p className="text-muted mb-4">{t('auth.forgot_password_success_message')}</p>
                                            <Link to="/login" className="btn btn-primary w-100 py-2 fw-semibold" style={{ minHeight: '44px' }}>
                                                {t('auth.back_to_login')}
                                            </Link>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-muted small mt-4">
                            {t('footer.copyright')}
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;

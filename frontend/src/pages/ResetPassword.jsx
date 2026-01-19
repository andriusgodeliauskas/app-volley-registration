import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, post } from '../api/config';
import LanguageSwitcher from '../components/LanguageSwitcher';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [countdown, setCountdown] = useState(3);

    // Auto-dismiss local error after 10 seconds
    useEffect(() => {
        if (localError) {
            const timer = setTimeout(() => {
                setLocalError(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [localError]);

    // Countdown and redirect after success
    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            navigate('/login');
        }
    }, [success, countdown, navigate]);

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setLocalError(t('error.invalid_reset_link'));
        }
    }, [token, t]);

    const validatePassword = (pwd) => {
        // Minimum 12 characters, at least one uppercase, one lowercase, one digit
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;
        return regex.test(pwd);
    };

    const handlePasswordBlur = () => {
        const errors = {};
        if (password && !validatePassword(password)) {
            errors.password = t('error.password_requirements');
        }
        setFieldErrors(errors);
    };

    const handleConfirmPasswordBlur = () => {
        const errors = { ...fieldErrors };
        if (confirmPassword && password !== confirmPassword) {
            errors.confirmPassword = t('validation.passwords_mismatch');
        } else {
            delete errors.confirmPassword;
        }
        setFieldErrors(errors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSubmitting || success || !token) {
            return;
        }

        // Validation
        const errors = {};

        if (!validatePassword(password)) {
            errors.password = t('error.password_requirements');
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = t('validation.passwords_mismatch');
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLocalError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const response = await post(API_ENDPOINTS.RESET_PASSWORD, {
                token,
                password
            });

            if (response.success) {
                setSuccess(true);
            } else {
                setLocalError(response.message || t('common.error'));
            }
        } catch (err) {
            console.error('Reset password error:', err);

            // Handle specific error messages
            const errorMsg = err.message || t('common.error');
            if (errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid')) {
                setLocalError(t('error.reset_link_expired'));
            } else if (errorMsg.toLowerCase().includes('rate limit')) {
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
                                            <h2 className="fw-bold mb-1">{t('auth.reset_password_title')}</h2>
                                            <p className="text-muted mb-0">{t('auth.reset_password_description')}</p>
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
                                            {/* New Password Field */}
                                            <div className="mb-3">
                                                <label htmlFor="password" className="form-label fw-medium">{t('auth.new_password')}</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className={`form-control border-start-0 border-end-0 ps-0 ${fieldErrors.password ? 'is-invalid' : ''}`}
                                                        id="password"
                                                        placeholder={t('placeholder.password')}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        onBlur={handlePasswordBlur}
                                                        required
                                                        autoComplete="new-password"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        className="input-group-text bg-light border-start-0"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        tabIndex={-1}
                                                    >
                                                        {showPassword ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                                                                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                                                                <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                                                                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {fieldErrors.password && (
                                                    <div className="text-danger small mt-1">{fieldErrors.password}</div>
                                                )}
                                                <div className="text-muted small mt-1">{t('validation.password_requirements')}</div>
                                            </div>

                                            {/* Confirm Password Field */}
                                            <div className="mb-4">
                                                <label htmlFor="confirmPassword" className="form-label fw-medium">{t('auth.confirm_password')}</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        className={`form-control border-start-0 border-end-0 ps-0 ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                                                        id="confirmPassword"
                                                        placeholder={t('placeholder.confirm_password')}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        onBlur={handleConfirmPasswordBlur}
                                                        required
                                                        autoComplete="new-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="input-group-text bg-light border-start-0"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        tabIndex={-1}
                                                    >
                                                        {showConfirmPassword ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                                                                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                                                                <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                                                                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {fieldErrors.confirmPassword && (
                                                    <div className="text-danger small mt-1">{fieldErrors.confirmPassword}</div>
                                                )}
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100 py-2 fw-semibold mb-3"
                                                disabled={isSubmitting || !token}
                                                style={{ minHeight: '44px' }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        {t('common.loading')}
                                                    </>
                                                ) : (
                                                    t('auth.reset_password_button')
                                                )}
                                            </button>

                                            {/* Links */}
                                            <div className="text-center">
                                                <Link to="/login" className="text-decoration-none small me-3">
                                                    {t('auth.back_to_login')}
                                                </Link>
                                                <Link to="/forgot-password" className="text-decoration-none small">
                                                    {t('auth.request_new_link')}
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
                                            <h3 className="fw-bold mb-3">{t('auth.reset_password_success_title')}</h3>
                                            <p className="text-muted mb-3">{t('auth.reset_password_success_message')}</p>
                                            <p className="text-muted small mb-4">{t('auth.redirecting_to_login')}</p>
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

export default ResetPassword;

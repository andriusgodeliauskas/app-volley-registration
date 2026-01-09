import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Register() {
    const { t } = useLanguage();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [localError, setLocalError] = useState(null);

    const { register } = useAuth();
    const navigate = useNavigate();

    // Map backend error messages to translation keys
    const translateError = (errorMessage) => {
        const msg = errorMessage.toLowerCase();

        if (msg.includes('email') && (msg.includes('already') || msg.includes('exist'))) {
            return t('validation.email_exists');
        }
        if (msg.includes('too many attempts') || msg.includes('blocked')) {
            return t('error.rate_limit');
        }

        // Return original message if no match
        return errorMessage;
    };

    // Auto-dismiss local error after 10 seconds
    useEffect(() => {
        if (localError) {
            const timer = setTimeout(() => {
                setLocalError(null);
            }, 10000); // 10 seconds

            // Cleanup timer if component unmounts or error changes
            return () => clearTimeout(timer);
        }
    }, [localError]);

    const validateForm = () => {
        const errors = {};

        if (firstName.trim().length < 2) {
            errors.firstName = t('validation.name_min');
        }

        if (lastName.trim().length < 2) {
            errors.lastName = t('validation.surname_min');
        }

        if (!email.includes('@')) {
            errors.email = t('validation.email_invalid');
        }

        // Password strength validation (12+ chars, uppercase, lowercase, number, special char)
        if (password.length < 12) {
            errors.password = t('validation.password_min');
        } else {
            const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
            if (!passwordPattern.test(password)) {
                errors.password = t('validation.password_strength');
            }
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = t('validation.passwords_mismatch');
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent submit if already submitting or if there's an active error
        if (isSubmitting || localError) {
            return;
        }

        setLocalError(null); // Clear previous errors

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Pass firstName and lastName separately
            await register(firstName, lastName, email, password);

            // Show success and redirect to login
            navigate('/login', {
                state: { message: t('register.success') }
            });
        } catch (err) {
            // Set local error that will persist for 10 seconds
            const errorMsg = err.message || 'Registration failed';
            const translatedError = translateError(errorMsg);
            setLocalError(translatedError);
            console.error('Registration failed:', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">

                        {/* Card */}
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-body p-4 p-md-5">

                                {/* Logo / Header */}
                                <div className="text-center mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-success bg-gradient rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                                            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                                            <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
                                        </svg>
                                    </div>
                                    <h2 className="fw-bold mb-1">{t('auth.register_title')}</h2>
                                    <p className="text-muted mb-0">{t('auth.register_subtitle')}</p>
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

                                {/* Register Form */}
                                <form onSubmit={handleSubmit} action="javascript:void(0)">

                                    {/* Name Field */}
                                    <div className="mb-3">
                                        <label htmlFor="firstName" className="form-label fw-medium">{t('auth.name')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                className={`form-control border-start-0 ps-0 ${validationErrors.firstName ? 'is-invalid' : ''}`}
                                                id="firstName"
                                                placeholder={t('placeholder.first_name')}
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                                autoComplete="given-name"
                                            />
                                        </div>
                                        {validationErrors.firstName && (
                                            <div className="text-danger small mt-1">{validationErrors.firstName}</div>
                                        )}
                                    </div>

                                    {/* Surname Field */}
                                    <div className="mb-3">
                                        <label htmlFor="lastName" className="form-label fw-medium">{t('auth.surname')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                className={`form-control border-start-0 ps-0 ${validationErrors.lastName ? 'is-invalid' : ''}`}
                                                id="lastName"
                                                placeholder={t('placeholder.last_name')}
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                required
                                                autoComplete="family-name"
                                            />
                                        </div>
                                        {validationErrors.lastName && (
                                            <div className="text-danger small mt-1">{validationErrors.lastName}</div>
                                        )}
                                    </div>

                                    {/* Email Field */}
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label fw-medium">{t('auth.email')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
                                                </svg>
                                            </span>
                                            <input
                                                type="email"
                                                className={`form-control border-start-0 ps-0 ${validationErrors.email ? 'is-invalid' : ''}`}
                                                id="email"
                                                placeholder={t('placeholder.email')}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                            />
                                        </div>
                                        {validationErrors.email && (
                                            <div className="text-danger small mt-1">{validationErrors.email}</div>
                                        )}
                                    </div>

                                    {/* Password Field */}
                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label fw-medium">{t('auth.password')}</label>
                                        <div className="text-muted small mb-2">
                                            {t('validation.password_requirements')}
                                        </div>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
                                                </svg>
                                            </span>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className={`form-control border-start-0 border-end-0 ps-0 ${validationErrors.password ? 'is-invalid' : ''}`}
                                                id="password"
                                                placeholder={t('placeholder.password')}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoComplete="new-password"
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
                                        {validationErrors.password && (
                                            <div className="text-danger small mt-1">{validationErrors.password}</div>
                                        )}
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="mb-4">
                                        <label htmlFor="confirmPassword" className="form-label fw-medium">{t('auth.confirm_password')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
                                                </svg>
                                            </span>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className={`form-control border-start-0 ps-0 ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                                                id="confirmPassword"
                                                placeholder={t('placeholder.confirm_password')}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        {validationErrors.confirmPassword && (
                                            <div className="text-danger small mt-1">{validationErrors.confirmPassword}</div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="btn btn-success w-100 py-2 fw-semibold"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {t('register.creating')}
                                            </>
                                        ) : (
                                            t('auth.register_button')
                                        )}
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="d-flex align-items-center my-4">
                                    <hr className="flex-grow-1" />
                                    <span className="px-3 text-muted small">{t('register.divider')}</span>
                                    <hr className="flex-grow-1" />
                                </div>

                                {/* Login Link */}
                                <p className="text-center mb-0">
                                    <Link to="/login" className="fw-semibold text-decoration-none">
                                        {t('auth.login_link')}
                                    </Link>
                                </p>

                            </div>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-muted small mt-4">
                            {t('register.terms')}
                        </p>

                    </div>
                </div>
            </div>
        </div >
    );
}

export default Register;

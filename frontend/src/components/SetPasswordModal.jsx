import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * SetPasswordModal Component
 * Modal dialog for new Google OAuth users to set their password
 *
 * @param {boolean} show - Whether to show the modal
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onSubmit - Callback when password is submitted (receives password)
 * @param {string} userEmail - Email of the user (for display)
 */
function SetPasswordModal({ show, onClose, onSubmit, userEmail }) {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Reset state when modal is shown
    useEffect(() => {
        if (show) {
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setValidationErrors({});
        }
    }, [show]);

    const validatePassword = () => {
        const errors = {};

        // Password strength validation (12+ chars, uppercase, lowercase, number)
        if (password.length < 12) {
            errors.password = t('validation.password_min');
        } else {
            const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;
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

        if (isSubmitting) {
            return;
        }

        if (!validatePassword()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(password);
        } catch (error) {
            console.error('Password submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) {
        return null;
    }

    return (
        <>
            {/* Bootstrap Modal Backdrop */}
            <div className="modal-backdrop fade show"></div>

            {/* Bootstrap Modal */}
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="setPasswordModalLabel"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        {/* Modal Header */}
                        <div className="modal-header">
                            <h5 className="modal-title" id="setPasswordModalLabel">
                                {t('auth.set_password_title')}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                disabled={isSubmitting}
                                aria-label="Close"
                            ></button>
                        </div>

                        {/* Modal Body */}
                        <div className="modal-body">
                            <p className="text-muted mb-4">
                                {t('auth.set_password_description')}
                                <br />
                                <strong>{userEmail}</strong>
                            </p>

                            <form onSubmit={handleSubmit} id="setPasswordForm">
                                {/* Password Field */}
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label fw-medium">
                                        {t('auth.password')}
                                    </label>
                                    <div className="text-muted small mb-2">
                                        {t('validation.password_requirements')}
                                    </div>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                fill="currentColor"
                                                className="text-muted"
                                                viewBox="0 0 16 16"
                                            >
                                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
                                            </svg>
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className={`form-control border-start-0 border-end-0 ps-0 ${
                                                validationErrors.password ? 'is-invalid' : ''
                                            }`}
                                            id="newPassword"
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
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="18"
                                                    height="18"
                                                    fill="currentColor"
                                                    className="text-muted"
                                                    viewBox="0 0 16 16"
                                                >
                                                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                                                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                                                    <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="18"
                                                    height="18"
                                                    fill="currentColor"
                                                    className="text-muted"
                                                    viewBox="0 0 16 16"
                                                >
                                                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {validationErrors.password && (
                                        <div className="text-danger small mt-1">
                                            {validationErrors.password}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="mb-3">
                                    <label htmlFor="confirmNewPassword" className="form-label fw-medium">
                                        {t('auth.confirm_password')}
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                fill="currentColor"
                                                className="text-muted"
                                                viewBox="0 0 16 16"
                                            >
                                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
                                            </svg>
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className={`form-control border-start-0 ps-0 ${
                                                validationErrors.confirmPassword ? 'is-invalid' : ''
                                            }`}
                                            id="confirmNewPassword"
                                            placeholder={t('placeholder.confirm_password')}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    {validationErrors.confirmPassword && (
                                        <div className="text-danger small mt-1">
                                            {validationErrors.confirmPassword}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                form="setPasswordForm"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    t('auth.set_password_button')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SetPasswordModal;

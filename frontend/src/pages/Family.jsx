import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { get, post, put, del, API_ENDPOINTS } from '../api/config';
import Navbar from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';

export default function Family() {
    const { user } = useAuth();
    const { t } = useLanguage();

    // Map backend error messages to translation keys
    const mapErrorToTranslation = (errorMessage) => {
        const errorMap = {
            'Target user account is inactive': 'family.error_user_inactive',
            'User with this email does not exist': 'family.error_user_not_found',
            'Cannot send family permission request to yourself': 'family.error_request_to_self',
            'You already have a pending request to this user': 'family.error_already_pending',
            'You already have an active family permission with this user': 'family.error_already_active',
        };

        const translationKey = errorMap[errorMessage];
        return translationKey ? t(translationKey) : errorMessage;
    };

    // State
    const [loading, setLoading] = useState(true);
    const [sentRequests, setSentRequests] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [email, setEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-dismiss messages
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchData = async () => {
        try {
            const response = await get(API_ENDPOINTS.FAMILY_PERMISSIONS);
            if (response.success && response.data) {
                setSentRequests(response.data.sent_requests || []);
                setReceivedRequests(response.data.received_requests || []);
            }
        } catch (err) {
            console.error('Failed to fetch family data:', err);
            setError(mapErrorToTranslation(err.message) || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = () => {
        if (!email || !email.trim()) {
            setError(t('validation.email_invalid'));
            return;
        }

        setConfirmAction({
            type: 'send',
            message: t('family.confirm_send'),
            data: { email: email.trim() }
        });
        setShowConfirm(true);
    };

    const handleAccept = (permissionId) => {
        setConfirmAction({
            type: 'accept',
            message: t('family.confirm_accept'),
            data: { permission_id: permissionId }
        });
        setShowConfirm(true);
    };

    const handleReject = (permissionId) => {
        setConfirmAction({
            type: 'reject',
            message: t('family.confirm_reject'),
            data: { permission_id: permissionId }
        });
        setShowConfirm(true);
    };

    const handleCancel = (permissionId) => {
        setConfirmAction({
            type: 'cancel',
            message: t('family.confirm_remove'),
            data: { permission_id: permissionId }
        });
        setShowConfirm(true);
    };

    const handleRemove = (permissionId) => {
        setConfirmAction({
            type: 'remove',
            message: t('family.confirm_remove'),
            data: { permission_id: permissionId }
        });
        setShowConfirm(true);
    };

    const executeAction = async () => {
        if (!confirmAction) return;

        setShowConfirm(false);
        setProcessing(true);
        setError(null);
        setSuccessMessage('');

        try {
            let response;

            switch (confirmAction.type) {
                case 'send':
                    response = await post(API_ENDPOINTS.FAMILY_PERMISSIONS, {
                        target_email: confirmAction.data.email
                    });
                    if (response.success) {
                        setSuccessMessage(t('family.request_sent'));
                        setEmail(''); // Clear input
                    }
                    break;

                case 'accept':
                    response = await put(API_ENDPOINTS.FAMILY_PERMISSIONS, {
                        permission_id: confirmAction.data.permission_id,
                        action: 'accept'
                    });
                    if (response.success) {
                        setSuccessMessage(t('family.request_accepted'));
                    }
                    break;

                case 'reject':
                    response = await put(API_ENDPOINTS.FAMILY_PERMISSIONS, {
                        permission_id: confirmAction.data.permission_id,
                        action: 'reject'
                    });
                    if (response.success) {
                        setSuccessMessage(t('family.request_rejected'));
                    }
                    break;

                case 'cancel':
                case 'remove':
                    response = await del(`${API_ENDPOINTS.FAMILY_PERMISSIONS}?permission_id=${confirmAction.data.permission_id}`);
                    if (response.success) {
                        setSuccessMessage(t('family.permission_canceled'));
                    }
                    break;

                default:
                    throw new Error('Unknown action');
            }

            if (!response.success) {
                setError(mapErrorToTranslation(response.message) || t('common.error'));
            } else {
                // Refresh data
                fetchData();
            }
        } catch (err) {
            console.error('Action failed:', err);
            setError(mapErrorToTranslation(err.message) || t('common.error'));
        } finally {
            setProcessing(false);
            setConfirmAction(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('lt-LT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { class: 'bg-warning', text: t('family.status_pending') },
            accepted: { class: 'bg-success', text: t('family.status_accepted') },
            rejected: { class: 'bg-danger', text: t('family.status_rejected') },
            canceled: { class: 'bg-secondary', text: t('family.status_canceled') }
        };
        const config = statusMap[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100">
            <Navbar />

            <div className="main-container">
                <Breadcrumb items={[
                    { label: t('nav.home'), path: '/dashboard' },
                    { label: t('nav.family'), path: '/family' }
                ]} />

                {/* Alerts */}
                {successMessage && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {successMessage}
                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                {/* Info Text - simple paragraph */}
                <p className="text-muted mb-4">{t('family.info_description')}</p>

                {/* Send Request Form */}
                <div className="section mb-4">
                    <div className="section-header mb-3">
                        <div className="section-title">
                            <i className="bi bi-send me-2 text-primary"></i>
                            {t('family.send_invite')}
                        </div>
                    </div>
                    <div className="row g-3">
                        <div className="col-md-8">
                            <input
                                type="email"
                                className="form-control"
                                placeholder={t('family.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={processing}
                                aria-label={t('family.invite_email')}
                            />
                        </div>
                        <div className="col-md-4">
                            <button
                                className="btn btn-primary w-100"
                                onClick={handleSendRequest}
                                disabled={processing || !email.trim()}
                            >
                                <i className="bi bi-send me-2"></i>
                                {processing ? t('common.loading') : t('family.send_invite')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Received Requests - Full Width, First */}
                <div className="section mb-4">
                    <div className="section-header">
                        <div className="section-title">
                            <i className="bi bi-arrow-down-circle me-2 text-success"></i>
                            {t('family.received_requests')}
                        </div>
                    </div>
                    <div className="p-0">
                        {receivedRequests.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-inbox fs-1 opacity-25"></i>
                                <p className="mt-2">{t('family.no_received_requests')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="table-responsive d-none d-md-block">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 ps-4">{t('common.name')}</th>
                                                <th className="border-0">{t('common.email')}</th>
                                                <th className="border-0">{t('common.status')}</th>
                                                <th className="border-0">{t('family.requested_at')}</th>
                                                <th className="border-0">{t('family.responded_at')}</th>
                                                <th className="border-0 text-end pe-4">{t('common.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {receivedRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td className="ps-4 fw-semibold">{request.requester_name}</td>
                                                    <td className="text-muted small">{request.requester_email}</td>
                                                    <td>{getStatusBadge(request.status)}</td>
                                                    <td className="text-muted small">{formatDate(request.requested_at)}</td>
                                                    <td className="text-muted small">{formatDate(request.responded_at)}</td>
                                                    <td className="text-end pe-4">
                                                        {request.status === 'pending' && (
                                                            <div className="btn-group">
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => handleAccept(request.id)}
                                                                    disabled={processing}
                                                                >
                                                                    {t('family.accept')}
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleReject(request.id)}
                                                                    disabled={processing}
                                                                >
                                                                    {t('family.reject')}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {request.status === 'accepted' && (
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleRemove(request.id)}
                                                                disabled={processing}
                                                            >
                                                                {t('family.remove')}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="d-md-none">
                                    {receivedRequests.map((request) => (
                                        <div key={request.id} className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <div className="fw-semibold">{request.requester_name}</div>
                                                    <div className="small text-muted">{request.requester_email}</div>
                                                </div>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="small text-muted mb-2">
                                                <div>{t('family.requested_at')}: {formatDate(request.requested_at)}</div>
                                                {request.responded_at && (
                                                    <div>{t('family.responded_at')}: {formatDate(request.responded_at)}</div>
                                                )}
                                            </div>
                                            {request.status === 'pending' && (
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-success flex-fill"
                                                        onClick={() => handleAccept(request.id)}
                                                        disabled={processing}
                                                    >
                                                        {t('family.accept')}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger flex-fill"
                                                        onClick={() => handleReject(request.id)}
                                                        disabled={processing}
                                                    >
                                                        {t('family.reject')}
                                                    </button>
                                                </div>
                                            )}
                                            {request.status === 'accepted' && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger w-100"
                                                    onClick={() => handleRemove(request.id)}
                                                    disabled={processing}
                                                >
                                                    {t('family.remove')}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Sent Requests - Full Width */}
                <div className="section mb-4">
                    <div className="section-header">
                        <div className="section-title">
                            <i className="bi bi-arrow-up-circle me-2 text-primary"></i>
                            {t('family.sent_requests')}
                        </div>
                    </div>
                    <div className="p-0">
                        {sentRequests.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-inbox fs-1 opacity-25"></i>
                                <p className="mt-2">{t('family.no_sent_requests')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="table-responsive d-none d-md-block">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 ps-4">{t('common.name')}</th>
                                                <th className="border-0">{t('common.email')}</th>
                                                <th className="border-0">{t('common.status')}</th>
                                                <th className="border-0">{t('family.requested_at')}</th>
                                                <th className="border-0">{t('family.responded_at')}</th>
                                                <th className="border-0 text-end pe-4">{t('common.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sentRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td className="ps-4 fw-semibold">{request.target_name}</td>
                                                    <td className="text-muted small">{request.target_email}</td>
                                                    <td>{getStatusBadge(request.status)}</td>
                                                    <td className="text-muted small">{formatDate(request.requested_at)}</td>
                                                    <td className="text-muted small">{formatDate(request.responded_at)}</td>
                                                    <td className="text-end pe-4">
                                                        {request.status === 'pending' && (
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleCancel(request.id)}
                                                                disabled={processing}
                                                            >
                                                                {t('family.cancel')}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="d-md-none">
                                    {sentRequests.map((request) => (
                                        <div key={request.id} className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <div className="fw-semibold">{request.target_name}</div>
                                                    <div className="small text-muted">{request.target_email}</div>
                                                </div>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="small text-muted mb-2">
                                                <div>{t('family.requested_at')}: {formatDate(request.requested_at)}</div>
                                                {request.responded_at && (
                                                    <div>{t('family.responded_at')}: {formatDate(request.responded_at)}</div>
                                                )}
                                            </div>
                                            {request.status === 'pending' && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger w-100"
                                                    onClick={() => handleCancel(request.id)}
                                                    disabled={processing}
                                                >
                                                    {t('family.cancel')}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && confirmAction && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('common.confirm')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={processing}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>{confirmAction.message}</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={processing}
                                >
                                    {t('common.no')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={executeAction}
                                    disabled={processing}
                                >
                                    {processing ? t('common.loading') : t('common.yes')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

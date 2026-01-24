import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { get, post } from '../../api/config';
import AdminNavbar from '../../components/AdminNavbar';
import Breadcrumb from '../../components/Breadcrumb';

export default function Messages() {
    const { t } = useLanguage();

    // State
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        email_type: '',
        search: '',
        page: 1
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        per_page: 50,
        total_pages: 1
    });
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [resending, setResending] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Bulk email sending state
    const [showDebtModal, setShowDebtModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [usersForEmail, setUsersForEmail] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [sendingBulk, setSendingBulk] = useState(false);

    // Fetch emails
    useEffect(() => {
        fetchEmails();
    }, [filters.page, filters.email_type]);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: filters.page,
                per_page: 50
            });

            if (filters.email_type) {
                params.append('email_type', filters.email_type);
            }

            const response = await get(`/api/admin/email-logs.php?${params}`);

            if (response.success) {
                setEmails(response.data.emails || []);
                setPagination({
                    total: response.data.total,
                    page: response.data.page,
                    per_page: response.data.per_page,
                    total_pages: response.data.total_pages
                });
            }
        } catch (error) {
            console.error('Failed to fetch emails:', error);
            setErrorMessage(t('admin.error_loading_emails'));
        } finally {
            setLoading(false);
        }
    };

    // Resend email
    const handleResend = async (email) => {
        if (!confirm(t('admin.confirm_resend_email'))) {
            return;
        }

        setResending(email.id);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await post('/api/admin/send-email.php', {
                user_id: email.user_id,
                email_type: email.email_type
            });

            if (response.success) {
                setSuccessMessage(t('admin.email_sent_successfully'));
                fetchEmails(); // Refresh list
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                setErrorMessage(response.message || t('admin.email_send_failed'));
            }
        } catch (error) {
            setErrorMessage(error.message || t('admin.email_send_failed'));
        } finally {
            setResending(null);
        }
    };

    // Fetch users for bulk email
    const fetchUsersForEmail = async (type) => {
        setLoadingUsers(true);
        try {
            const response = await get('/api/users.php');
            if (response.success && response.data?.users) {
                let filteredUsers = [];
                if (type === 'debt') {
                    // Users with negative balance
                    filteredUsers = response.data.users.filter(u => u.balance < 0);
                } else if (type === 'registration') {
                    // Inactive users
                    filteredUsers = response.data.users.filter(u => !u.is_active);
                }
                setUsersForEmail(filteredUsers);
                setSelectedUsers([]);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setErrorMessage(t('admin.error_loading_emails'));
        } finally {
            setLoadingUsers(false);
        }
    };

    // Open debt email modal
    const handleOpenDebtModal = async () => {
        setShowDebtModal(true);
        await fetchUsersForEmail('debt');
    };

    // Open registration email modal
    const handleOpenRegistrationModal = async () => {
        setShowRegistrationModal(true);
        await fetchUsersForEmail('registration');
    };

    // Toggle user selection
    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Toggle all users
    const toggleAllUsers = () => {
        if (selectedUsers.length === usersForEmail.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(usersForEmail.map(u => u.id));
        }
    };

    // Send bulk emails
    const handleSendBulkEmails = async (emailType) => {
        if (selectedUsers.length === 0) {
            setErrorMessage(t('admin.select_at_least_one'));
            return;
        }

        if (!confirm(t('admin.confirm_send_emails').replace('{count}', selectedUsers.length))) {
            return;
        }

        setSendingBulk(true);
        setErrorMessage('');
        setSuccessMessage('');

        let successCount = 0;
        let failCount = 0;

        for (const userId of selectedUsers) {
            try {
                const response = await post('/api/admin/send-email.php', {
                    user_id: userId,
                    email_type: emailType
                });

                if (response.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
        }

        setSendingBulk(false);
        setShowDebtModal(false);
        setShowRegistrationModal(false);

        const summary = t('admin.emails_sent_summary')
            .replace('{success}', successCount)
            .replace('{failed}', failCount);

        if (successCount > 0) {
            setSuccessMessage(summary);
            fetchEmails(); // Refresh email list
            setTimeout(() => setSuccessMessage(''), 5000);
        } else {
            setErrorMessage(summary);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('lt-LT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get email type badge
    const getEmailTypeBadge = (type) => {
        const badges = {
            'account_activation': { color: 'success', text: t('admin.email_type_activation') },
            'password_reset': { color: 'primary', text: t('admin.email_type_password_reset') },
            'negative_balance': { color: 'warning', text: t('admin.email_type_negative_balance') }
        };
        const badge = badges[type] || { color: 'secondary', text: type };
        return <span className={`badge bg-${badge.color}`}>{badge.text}</span>;
    };

    // Get status badge
    const getStatusBadge = (status) => {
        return status === 'sent'
            ? <span className="badge bg-success">✓ {t('admin.email_status_sent')}</span>
            : <span className="badge bg-danger">✗ {t('admin.email_status_failed')}</span>;
    };

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <Breadcrumb items={[
                    { label: t('nav.admin'), path: '/admin' },
                    { label: t('admin.nav_messages'), path: '/admin/messages' }
                ]} />

                {/* Header */}
                <div className="section">
                    <div className="section-header mb-4">
                        <div>
                            <div className="section-title">
                                <i className="bi bi-envelope me-2"></i>
                                {t('admin.messages_title')}
                            </div>
                            <div className="section-subtitle">{t('admin.messages_subtitle')}</div>
                        </div>
                    </div>

                    {/* Alerts */}
                    {successMessage && (
                        <div className="alert alert-success alert-dismissible fade show">
                            {successMessage}
                            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                        </div>
                    )}
                    {errorMessage && (
                        <div className="alert alert-danger alert-dismissible fade show">
                            {errorMessage}
                            <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
                        </div>
                    )}

                    {/* Bulk Email Sending Section */}
                    <div className="mb-4">
                        <div className="section-subtitle mb-3">
                            <i className="bi bi-send me-2"></i>
                            {t('admin.send_emails_section')}
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                className="btn btn-warning"
                                onClick={handleOpenDebtModal}
                            >
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {t('admin.send_debt_emails')}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleOpenRegistrationModal}
                            >
                                <i className="bi bi-envelope me-2"></i>
                                {t('admin.send_registration_emails')}
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <select
                                className="form-select"
                                value={filters.email_type}
                                onChange={(e) => setFilters({ ...filters, email_type: e.target.value, page: 1 })}
                            >
                                <option value="">{t('admin.filter_all_types')}</option>
                                <option value="account_activation">{t('admin.email_type_activation')}</option>
                                <option value="password_reset">{t('admin.email_type_password_reset')}</option>
                                <option value="negative_balance">{t('admin.email_type_negative_balance')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Email Table */}
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-envelope fs-1 opacity-25"></i>
                            <p className="mt-2">{t('admin.no_emails_found')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>{t('admin.email_recipient')}</th>
                                            <th>{t('admin.email_type')}</th>
                                            <th>{t('admin.email_subject')}</th>
                                            <th>{t('admin.email_sent_at')}</th>
                                            <th>{t('admin.email_status')}</th>
                                            <th className="text-end">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emails.map((email) => (
                                            <tr key={email.id}>
                                                <td className="text-muted">#{email.id}</td>
                                                <td>
                                                    <div className="fw-semibold">{email.user_name} {email.user_surname}</div>
                                                    <div className="text-muted small">{email.recipient_email}</div>
                                                </td>
                                                <td>{getEmailTypeBadge(email.email_type)}</td>
                                                <td>{email.subject}</td>
                                                <td className="text-muted small">{formatDate(email.sent_at)}</td>
                                                <td>{getStatusBadge(email.status)}</td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => setSelectedEmail(email)}
                                                        title={t('admin.email_preview')}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-success"
                                                        onClick={() => handleResend(email)}
                                                        disabled={resending === email.id}
                                                        title={t('admin.email_resend')}
                                                    >
                                                        {resending === email.id ? (
                                                            <span className="spinner-border spinner-border-sm"></span>
                                                        ) : (
                                                            <i className="bi bi-arrow-repeat"></i>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.total_pages > 1 && (
                                <nav className="mt-4">
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                                                disabled={pagination.page === 1}
                                            >
                                                {t('common.previous')}
                                            </button>
                                        </li>
                                        <li className="page-item active">
                                            <span className="page-link">
                                                {pagination.page} / {pagination.total_pages}
                                            </span>
                                        </li>
                                        <li className={`page-item ${pagination.page === pagination.total_pages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                                                disabled={pagination.page === pagination.total_pages}
                                            >
                                                {t('common.next')}
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Email Preview Modal */}
            {selectedEmail && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('admin.email_preview')}</h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedEmail(null)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <strong>{t('admin.email_recipient')}:</strong> {selectedEmail.recipient_email}
                                </div>
                                <div className="mb-3">
                                    <strong>{t('admin.email_subject')}:</strong> {selectedEmail.subject}
                                </div>
                                <div className="mb-3">
                                    <strong>{t('admin.email_type')}:</strong> {getEmailTypeBadge(selectedEmail.email_type)}
                                </div>
                                <div className="mb-3">
                                    <strong>{t('admin.email_sent_at')}:</strong> {formatDate(selectedEmail.sent_at)}
                                </div>
                                {selectedEmail.admin_name && (
                                    <div className="mb-3">
                                        <strong>{t('admin.sent_by')}:</strong> {selectedEmail.admin_name} {selectedEmail.admin_surname}
                                    </div>
                                )}
                                <div className="mb-3">
                                    <strong>{t('admin.email_preview')}:</strong>
                                    <div className="border rounded p-3 mt-2 bg-light">
                                        {selectedEmail.body_preview}...
                                    </div>
                                </div>
                                {selectedEmail.error_message && (
                                    <div className="alert alert-danger">
                                        <strong>{t('common.error')}:</strong> {selectedEmail.error_message}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEmail(null)}>
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Debt Email Modal */}
            {showDebtModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                                    {t('admin.users_with_debt')}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowDebtModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {loadingUsers ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary"></div>
                                    </div>
                                ) : usersForEmail.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <i className="bi bi-check-circle fs-1 opacity-25"></i>
                                        <p className="mt-2">{t('admin.no_users_to_email')}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="selectAll"
                                                    checked={selectedUsers.length === usersForEmail.length}
                                                    onChange={toggleAllUsers}
                                                />
                                                <label className="form-check-label fw-bold" htmlFor="selectAll">
                                                    {t('admin.select_users')} ({selectedUsers.length}/{usersForEmail.length})
                                                </label>
                                            </div>
                                        </div>
                                        <div className="list-group">
                                            {usersForEmail.map(user => (
                                                <label key={user.id} className="list-group-item list-group-item-action">
                                                    <div className="d-flex align-items-center">
                                                        <input
                                                            className="form-check-input me-3"
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={() => toggleUserSelection(user.id)}
                                                        />
                                                        <div className="flex-grow-1">
                                                            <div className="fw-semibold">{user.name} {user.surname}</div>
                                                            <div className="text-muted small">{user.email}</div>
                                                        </div>
                                                        <span className="badge bg-danger">
                                                            €{user.balance.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDebtModal(false)}>
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={() => handleSendBulkEmails('negative_balance')}
                                    disabled={sendingBulk || selectedUsers.length === 0}
                                >
                                    {sendingBulk ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('admin.sending_emails')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2"></i>
                                            {t('admin.send_to_selected')} ({selectedUsers.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Email Modal */}
            {showRegistrationModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-envelope text-primary me-2"></i>
                                    {t('admin.inactive_users')}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowRegistrationModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {loadingUsers ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary"></div>
                                    </div>
                                ) : usersForEmail.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <i className="bi bi-check-circle fs-1 opacity-25"></i>
                                        <p className="mt-2">{t('admin.no_users_to_email')}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="selectAllReg"
                                                    checked={selectedUsers.length === usersForEmail.length}
                                                    onChange={toggleAllUsers}
                                                />
                                                <label className="form-check-label fw-bold" htmlFor="selectAllReg">
                                                    {t('admin.select_users')} ({selectedUsers.length}/{usersForEmail.length})
                                                </label>
                                            </div>
                                        </div>
                                        <div className="list-group">
                                            {usersForEmail.map(user => (
                                                <label key={user.id} className="list-group-item list-group-item-action">
                                                    <div className="d-flex align-items-center">
                                                        <input
                                                            className="form-check-input me-3"
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={() => toggleUserSelection(user.id)}
                                                        />
                                                        <div className="flex-grow-1">
                                                            <div className="fw-semibold">{user.name} {user.surname}</div>
                                                            <div className="text-muted small">{user.email}</div>
                                                        </div>
                                                        <span className="badge bg-secondary">
                                                            {t('admin.user_inactive')}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRegistrationModal(false)}>
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => handleSendBulkEmails('account_activation')}
                                    disabled={sendingBulk || selectedUsers.length === 0}
                                >
                                    {sendingBulk ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('admin.sending_emails')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2"></i>
                                            {t('admin.send_to_selected')} ({selectedUsers.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

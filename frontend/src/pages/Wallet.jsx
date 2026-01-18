import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { get, post, API_ENDPOINTS } from '../api/config';
import Navbar from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';
import CopyValue from '../components/CopyValue';

export default function Wallet() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Automatic top-up state
    const [topupAmount, setTopupAmount] = useState('33');
    const [topupLoading, setTopupLoading] = useState(false);
    const [topupError, setTopupError] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(true); // Pre-checked by default

    // Toast notification state
    const [toast, setToast] = useState({ show: false, type: '', message: '', amount: null });

    // Bank transfer section collapse state
    const [bankTransferCollapsed, setBankTransferCollapsed] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch fresh user data for balance and transactions
                const [userData, txData] = await Promise.all([
                    get(API_ENDPOINTS.USER),
                    get(API_ENDPOINTS.TRANSACTIONS)
                ]);

                // Handle different response structures if necessary
                // user.php usually returns the user object wrapped in a 'user' key
                const userBalance = userData.data?.user?.balance ?? userData.data?.balance ?? 0;
                setBalance(parseFloat(userBalance));

                // transactions.php returns array of transactions
                const txList = Array.isArray(txData) ? txData : (txData.data || []);
                setTransactions(txList);
            } catch (error) {
                console.error('Failed to fetch wallet data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Check for payment result in URL
        const params = new URLSearchParams(window.location.search);
        const paymentStatus = params.get('payment');
        const orderParam = params.get('order');

        if (paymentStatus === 'success') {
            // Extract amount from order ID if available
            let amount = null;
            if (orderParam) {
                // Order format: ag_12345
                // We'll get the amount from the latest transaction after refresh
                fetchData().then(() => {
                    // Get the most recent topup transaction
                    const latestTopup = transactions.find(tx => tx.type === 'topup');
                    if (latestTopup) {
                        amount = latestTopup.amount;
                    }
                    setToast({
                        show: true,
                        type: 'success',
                        message: t('wallet.topup_success'),
                        amount: amount
                    });
                });
            } else {
                setToast({
                    show: true,
                    type: 'success',
                    message: t('wallet.topup_success'),
                    amount: null
                });
            }

            // Clean URL
            window.history.replaceState({}, '', '/wallet');
        } else if (paymentStatus === 'cancelled') {
            setToast({
                show: true,
                type: 'error',
                message: t('wallet.payment_cancelled'),
                amount: null
            });
            window.history.replaceState({}, '', '/wallet');
        }
    }, [t, transactions]);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ ...toast, show: false });
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [toast.show, toast]);

    const handleAutoTopup = async () => {
        // Validate terms agreement
        if (!agreeToTerms) {
            setTopupError(t('wallet.must_agree_terms'));
            return;
        }

        // Validate amount
        const amount = parseFloat(topupAmount);
        if (isNaN(amount) || amount < 1 || amount > 1000) {
            setTopupError(t('wallet.invalid_amount'));
            return;
        }

        setTopupError('');
        setTopupLoading(true);

        try {
            const response = await post(API_ENDPOINTS.PAYSERA_CHECKOUT, { amount });

            if (response.success && response.data.redirect_url) {
                // Keep loading state until redirect happens
                window.location.href = response.data.redirect_url;
                // Don't set loading to false - page will redirect
            } else {
                setTopupError(t('wallet.topup_failed'));
                setTopupLoading(false);
            }
        } catch (error) {
            setTopupError(error.message || t('wallet.topup_failed'));
            setTopupLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('lt-LT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
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

            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show shadow-lg`}
                    style={{ zIndex: 9999, minWidth: '300px', maxWidth: '500px' }}
                    role="alert"
                >
                    <div className="d-flex align-items-center">
                        <i className={`bi bi-${toast.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2 fs-5`}></i>
                        <div className="flex-grow-1">
                            <strong>{toast.message}</strong>
                            {toast.amount && (
                                <div className="mt-1">
                                    {formatCurrency(toast.amount)}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setToast({ ...toast, show: false })}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            <div className="main-container">
                <Breadcrumb items={[
                    { label: t('nav.home'), path: '/dashboard' },
                    { label: t('nav.wallet'), path: '/wallet' }
                ]} />

                <div className="row g-4">
                    {/* Left Column: Balance & Top Up */}
                    <div className="col-lg-4">
                        {/* Balance Card */}
                        <div className="dash-card card-wallet mb-4">
                            <div className="dash-card-header">
                                <div className="dash-card-title">{t('wallet.balance')}</div>
                                <div className="dash-card-icon">💰</div>
                            </div>
                            <div className="dash-card-body">
                                <div className="balance-amount" style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1' }}>{formatCurrency(balance)}</div>
                            </div>
                        </div>

                        {/* Automatic Top-up Card */}
                        <div className="section mb-4">
                            <div className="section-header mb-3">
                                <div className="section-title">
                                    <i className="bi bi-credit-card me-2 text-primary"></i>
                                    {t('wallet.auto_topup_title')}
                                </div>
                            </div>
                            <div className="p-0">
                                <p className="text-muted small mb-3">
                                    {t('wallet.auto_topup_description')}
                                </p>

                                <div className="mb-3">
                                    <label className="form-label small text-muted text-uppercase fw-bold">
                                        {t('wallet.amount')}
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">€</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={topupAmount}
                                            onChange={(e) => setTopupAmount(e.target.value)}
                                            min="1"
                                            max="1000"
                                            step="1"
                                        />
                                    </div>
                                    <small className="text-muted">{t('wallet.amount_range')}</small>
                                </div>

                                {topupError && (
                                    <div className="alert alert-danger py-2 small" role="alert">
                                        {topupError}
                                    </div>
                                )}

                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="agreeToTerms"
                                        checked={agreeToTerms}
                                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                                    />
                                    <label className="form-check-label small" htmlFor="agreeToTerms">
                                        {t('wallet.agree_to')}{' '}
                                        <Link to="/topup-terms" className="text-decoration-none">
                                            {t('wallet.topup_terms_link')}
                                        </Link>
                                    </label>
                                </div>

                                <button
                                    className="btn btn-primary w-100"
                                    onClick={handleAutoTopup}
                                    disabled={topupLoading || !agreeToTerms}
                                >
                                    {topupLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            {t('wallet.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-credit-card me-2"></i>
                                            {t('wallet.topup_now')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mobile/Tablet spacing */}
                        <div className="d-lg-none mb-4"></div>

                        {/* Bank Transfer Instructions - Collapsible */}
                        <div className="section">
                            <div
                                className="section-header mb-3 d-flex justify-content-between align-items-center"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setBankTransferCollapsed(!bankTransferCollapsed)}
                            >
                                <div className="section-title">
                                    <i className="bi bi-bank me-2 text-primary"></i>
                                    {t('wallet.bank_topup_title')}
                                </div>
                                <i className={`bi bi-${bankTransferCollapsed ? 'plus' : 'dash'}-circle text-primary`} style={{ fontSize: '1.25rem' }}></i>
                            </div>

                            {!bankTransferCollapsed && (
                                <div className="p-0">
                                    <p className="text-muted small mb-4">
                                        {t('wallet.topup_instructions')}
                                    </p>

                                    <CopyValue label={t('wallet.iban')} value="LT447300010091739633" />
                                    <CopyValue label={t('wallet.receiver')} value="Andrius Godeliauskas" />

                                    <div className="mb-3">
                                        <CopyValue label={t('wallet.payment_purpose')} value={`${user?.name} ${user?.surname || ''} Top Up`} />
                                        <small className="text-muted d-block mt-1">
                                            {t('wallet.payment_note')}
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Transactions */}
                    <div className="col-lg-8">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">
                                    <i className="bi bi-clock-history me-2 text-primary"></i>
                                    {t('wallet.history')}
                                </div>
                            </div>
                            <div className="p-0">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-receipt fs-1 opacity-25"></i>
                                        <p className="mt-2">{t('wallet.no_transactions')}</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="table-responsive d-none d-md-block">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="border-0 ps-4">{t('wallet.date')}</th>
                                                        <th className="border-0">{t('wallet.desc')}</th>
                                                        <th className="border-0 text-end pe-4">{t('wallet.amount')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactions.map((tx, index) => (
                                                        <tr key={index}>
                                                            <td className="ps-4 small text-muted">{formatDate(tx.created_at)}</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className={`transaction-icon me-2 ${tx.amount > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                        <i className={`bi ${tx.amount > 0 ? 'bi-arrow-down' : 'bi-arrow-up'}`}></i>
                                                                    </div>
                                                                    <div>
                                                                        <div className="fw-medium">{tx.description}</div>
                                                                        {tx.event_name && (
                                                                            <small className="text-muted">{tx.event_name}</small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className={`pe-4 text-end fw-bold ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="d-md-none">
                                            {transactions.map((tx, index) => (
                                                <div key={index} className="card mb-2 border-0 shadow-sm">
                                                    <div className="card-body p-3">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div className="d-flex align-items-center">
                                                                <div className={`transaction-icon me-2 ${tx.amount > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                    <i className={`bi ${tx.amount > 0 ? 'bi-arrow-down' : 'bi-arrow-up'}`}></i>
                                                                </div>
                                                                <div>
                                                                    <div className="fw-medium">{tx.description}</div>
                                                                    {tx.event_name && (
                                                                        <small className="text-muted">{tx.event_name}</small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`fw-bold ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                            </div>
                                                        </div>
                                                        <small className="text-muted">{formatDate(tx.created_at)}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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

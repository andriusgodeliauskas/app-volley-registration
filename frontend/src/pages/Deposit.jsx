import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { get, post, API_ENDPOINTS } from '../api/config';
import Navbar from '../components/Navbar';

export default function Deposit() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDeposits();
    }, []);

    const fetchDeposits = async () => {
        try {
            const response = await get(API_ENDPOINTS.DEPOSITS);
            const deposits = response.data || response || [];
            setDeposits(deposits);
        } catch (error) {
            console.error('Failed to fetch deposits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayDeposit = () => {
        const depositAmount = 50.00;
        if (depositAmount > parseFloat(user?.balance || 0)) {
            alert(t('deposit.insufficient_balance'));
            return;
        }
        setShowConfirm(true);
    };

    const confirmPayment = async () => {
        setProcessing(true);
        try {
            const response = await post(API_ENDPOINTS.DEPOSIT_CREATE, {});

            if (response.success) {
                setShowConfirm(false);
                // Refresh deposits list and user balance
                fetchDeposits();
                window.location.reload(); // Reload to update balance in navbar
            } else {
                alert(response.message || t('deposit.payment_failed'));
            }
        } catch (error) {
            console.error('Deposit payment failed:', error);
            alert(t('deposit.payment_failed'));
        } finally {
            setProcessing(false);
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

    const hasActiveDeposit = deposits.some(d => d.status === 'active');

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
                <div className="row g-4">
                    {/* Left Column: Deposit Info & Payment */}
                    <div className="col-lg-5">
                        {/* Deposit Card */}
                        <div className="section">
                            <div className="section-header mb-3">
                                <div className="section-title">
                                    <i className="bi bi-shield-check me-2 text-success"></i>
                                    {t('deposit.title')}
                                </div>
                            </div>
                            <div className="p-0">
                                {/* Info Alert */}
                                <div className="alert alert-info d-flex align-items-start" role="alert">
                                    <i className="bi bi-info-circle-fill me-2 mt-1"></i>
                                    <div>
                                        <p className="mb-2 fw-semibold">{t('deposit.info_title')}</p>
                                        <p className="mb-0 small">{t('deposit.info_description')}</p>
                                    </div>
                                </div>

                                {/* Current Balance */}
                                <div className="dash-card card-wallet mb-4">
                                    <div className="dash-card-header">
                                        <div className="dash-card-title">{t('deposit.your_balance')}</div>
                                        <div className="dash-card-icon">💰</div>
                                    </div>
                                    <div className="dash-card-value">{formatCurrency(user?.balance || 0)}</div>
                                    <div className="dash-card-subtitle opacity-75">{t('wallet.available')}</div>
                                </div>

                                {/* Deposit Amount Display */}
                                <div className="mb-4">
                                    <div className="card border-primary">
                                        <div className="card-body text-center py-4">
                                            <div className="text-muted mb-2">{t('deposit.amount_label')}</div>
                                            <div className="display-5 fw-bold text-primary">€50</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pay Deposit Button */}
                                {hasActiveDeposit ? (
                                    <div className="alert alert-success" role="alert">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        {t('deposit.already_paid')}
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary w-100 py-3"
                                        onClick={handlePayDeposit}
                                        disabled={parseFloat(user?.balance || 0) < 50}
                                    >
                                        <i className="bi bi-credit-card me-2"></i>
                                        {t('deposit.pay_button')}
                                    </button>
                                )}

                                {parseFloat(user?.balance || 0) < 50 && !hasActiveDeposit && (
                                    <div className="alert alert-warning mt-3" role="alert">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        {t('deposit.insufficient_balance')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Deposit History */}
                    <div className="col-lg-7">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">
                                    <i className="bi bi-clock-history me-2 text-primary"></i>
                                    {t('deposit.history_title')}
                                </div>
                            </div>
                            <div className="p-0">
                                {deposits.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox fs-1 opacity-25"></i>
                                        <p className="mt-2">{t('deposit.no_deposits')}</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="border-0 ps-4">{t('deposit.date')}</th>
                                                    <th className="border-0 text-end">{t('deposit.amount')}</th>
                                                    <th className="border-0 text-end pe-4">{t('deposit.status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {deposits.map((deposit) => (
                                                    <tr key={deposit.id}>
                                                        <td className="ps-4">
                                                            <div className="fw-semibold text-dark">
                                                                {formatDate(deposit.created_at)}
                                                            </div>
                                                            {deposit.refunded_at && (
                                                                <div className="small text-muted">
                                                                    {t('deposit.refunded_at')}: {formatDate(deposit.refunded_at)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="text-end fw-bold text-primary">
                                                            {formatCurrency(deposit.amount)}
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            {deposit.status === 'active' ? (
                                                                <span className="badge bg-success">
                                                                    {t('deposit.status_active')}
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-secondary">
                                                                    {t('deposit.status_refunded')}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('deposit.confirm_title')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={processing}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>{t('deposit.confirm_message')}</p>
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
                                    onClick={confirmPayment}
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

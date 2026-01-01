import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { get, API_ENDPOINTS } from '../api/config';
import Navbar from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';

export default function Wallet() {
    const { t } = useLanguage();

    const CopyValue = ({ value, label }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = () => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        return (
            <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold">{label}</label>
                <div className="d-flex align-items-center justify-content-between">
                    <div className="fw-bold fs-6 text-break me-2">{value}</div>
                    <button
                        className="btn btn-link text-decoration-none p-0 text-muted"
                        onClick={handleCopy}
                        title={t('wallet.copy_tooltip')}
                        style={{ minWidth: '24px' }}
                    >
                        <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-copy'}`}></i>
                    </button>
                </div>
            </div>
        );
    };
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

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
    }, []);

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
                            <div className="dash-card-value">{formatCurrency(balance)}</div>
                            <div className="dash-card-subtitle opacity-75">{t('wallet.available')}</div>
                        </div>

                        {/* Top Up Instructions */}
                        <div className="section">
                            <div className="section-header mb-3">
                                <div className="section-title">
                                    <i className="bi bi-bank me-2 text-primary"></i>
                                    {t('wallet.topup_title')}
                                </div>
                            </div>
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
                                                    {transactions.map((tx) => (
                                                        <tr key={tx.id}>
                                                            <td className="ps-4 text-muted small" style={{ width: '25%' }}>
                                                                {formatDate(tx.created_at)}
                                                            </td>
                                                            <td>
                                                                <div className="fw-semibold text-dark">{tx.description}</div>
                                                                <div className="small text-muted text-capitalize">{tx.type}</div>
                                                            </td>
                                                            <td className={`text-end pe-4 fw-bold ${parseFloat(tx.amount) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                {parseFloat(tx.amount) >= 0 ? '+' : ''}
                                                                {formatCurrency(tx.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Block View */}
                                        <div className="d-md-none">
                                            {transactions.map((tx) => (
                                                <div key={tx.id} className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                                    <div className="text-muted small mb-2">
                                                        {formatDate(tx.created_at)}
                                                    </div>
                                                    <div className="mb-2">
                                                        <div className="fw-semibold text-dark">{tx.description}</div>
                                                        <div className="small text-muted text-capitalize">{tx.type}</div>
                                                    </div>
                                                    <div className={`fw-bold fs-5 ${parseFloat(tx.amount) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {parseFloat(tx.amount) >= 0 ? '+' : ''}
                                                        {formatCurrency(tx.amount)}
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

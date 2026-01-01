import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { get, API_ENDPOINTS } from '../api/config';

export default function Wallet() {

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
                        title="Copy to clipboard"
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
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
                <div className="container">
                    <Link className="navbar-brand fw-bold" to="/dashboard">🏐 Volley App</Link>
                    <div className="ms-auto">
                        <Link to="/dashboard" className="btn btn-outline-light btn-sm">
                            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="row g-4">
                    {/* Left Column: Balance & Top Up */}
                    <div className="col-lg-4">
                        {/* Balance Card */}
                        <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <div className="card-body text-white p-4 text-center">
                                <h6 className="text-uppercase opacity-75 mb-2">Current Balance</h6>
                                <h1 className="display-4 fw-bold mb-0">{formatCurrency(balance)}</h1>
                            </div>
                        </div>

                        {/* Top Up Instructions */}
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0 py-3">
                                <h5 className="mb-0 fw-bold">
                                    <i className="bi bi-bank me-2 text-primary"></i>
                                    Top Up Wallet
                                </h5>
                            </div>
                            <div className="card-body p-4">
                                <p className="text-muted small mb-4">
                                    To add funds to your wallet, please make a bank transfer with the following details.
                                    Funds will be credited manually by an administrator.
                                </p>

                                <CopyValue label="IBAN" value="LT447300010091739633" />
                                <CopyValue label="Receiver" value="Andrius Godeliauskas" />

                                <div className="mb-3">
                                    <CopyValue label="Payment Purpose" value={`${user?.name} ${user?.surname || ''} Top Up`} />
                                    <small className="text-muted d-block mt-1">
                                        * Please include your player name and surname exactly as registered.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Transactions */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="bi bi-clock-history me-2 text-primary"></i>
                                    Transaction History
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-receipt fs-1 opacity-25"></i>
                                        <p className="mt-2">No transactions yet.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="border-0 ps-4">Date</th>
                                                    <th className="border-0">Description</th>
                                                    <th className="border-0 text-end pe-4">Amount</th>
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { get, post, API_ENDPOINTS } from '../api/config';
import Navbar from '../components/Navbar';

export default function Support() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [amount, setAmount] = useState('1');
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            const response = await get(API_ENDPOINTS.DONATIONS);
            const donations = response.data?.donations || response.donations || [];
            setDonations(donations);
        } catch (error) {
            console.error('Failed to fetch donations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAmountSelect = (value) => {
        setAmount(value);
    };

    const handleCustomAmount = (e) => {
        const value = e.target.value;
        // Allow only numbers and decimals
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleDonate = () => {
        const donationAmount = parseFloat(amount);
        if (isNaN(donationAmount) || donationAmount <= 0) {
            alert(t('support.invalid_amount'));
            return;
        }
        if (donationAmount > parseFloat(user?.balance || 0)) {
            alert(t('support.insufficient_balance'));
            return;
        }
        setShowConfirm(true);
    };

    const confirmDonation = async () => {
        setProcessing(true);
        try {
            const donationAmount = parseFloat(amount);
            const response = await post(API_ENDPOINTS.DONATION_CREATE, {
                amount: donationAmount
            });

            if (response.success) {
                setShowConfirm(false);
                setAmount('1');
                // Refresh donations list and user balance
                fetchDonations();
                window.location.reload(); // Reload to update balance in navbar
            } else {
                alert(response.message || t('support.donation_failed'));
            }
        } catch (error) {
            console.error('Donation failed:', error);
            alert(t('support.donation_failed'));
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
                    {/* Left Column: Support Info & Donation */}
                    <div className="col-lg-5">
                        {/* Support Card */}
                        <div className="section">
                            <div className="section-header mb-3">
                                <div className="section-title">
                                    <i className="bi bi-heart-fill me-2 text-danger"></i>
                                    {t('support.title')}
                                </div>
                            </div>
                            <div className="p-0">
                                <p className="text-muted mb-4">
                                    {t('support.description')}
                                </p>

                                {/* Current Balance */}
                                <div className="dash-card card-wallet mb-4">
                                    <div className="dash-card-header">
                                        <div className="dash-card-title">{t('support.your_balance')}</div>
                                        <div className="dash-card-icon">💰</div>
                                    </div>
                                    <div className="dash-card-value">{formatCurrency(user?.balance || 0)}</div>
                                    <div className="dash-card-subtitle opacity-75">{t('wallet.available')}</div>
                                </div>

                                {/* Donation Amount Selection */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">{t('support.select_amount')}</label>
                                    <div className="d-flex gap-2 mb-3 flex-wrap">
                                        <button
                                            className={`btn ${amount === '1' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handleAmountSelect('1')}
                                        >
                                            €1
                                        </button>
                                        <button
                                            className={`btn ${amount === '5' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handleAmountSelect('5')}
                                        >
                                            €5
                                        </button>
                                        <button
                                            className={`btn ${amount === '20' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handleAmountSelect('20')}
                                        >
                                            €20
                                        </button>
                                    </div>

                                    <div className="input-group">
                                        <span className="input-group-text">€</span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={t('support.custom_amount')}
                                            value={amount}
                                            onChange={handleCustomAmount}
                                        />
                                    </div>
                                </div>

                                {/* Donate Button */}
                                <button
                                    className="btn btn-success w-100 py-3"
                                    onClick={handleDonate}
                                    disabled={!amount || parseFloat(amount) <= 0}
                                >
                                    <i className="bi bi-heart-fill me-2"></i>
                                    {t('support.donate_button')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Donation History */}
                    <div className="col-lg-7">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">
                                    <i className="bi bi-list-ul me-2 text-primary"></i>
                                    {t('support.donation_history')}
                                </div>
                            </div>
                            <div className="p-0">
                                {donations.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-heart fs-1 opacity-25"></i>
                                        <p className="mt-2">{t('support.no_donations')}</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="border-0 ps-4">{t('support.donor')}</th>
                                                    <th className="border-0">{t('support.date')}</th>
                                                    <th className="border-0 text-end pe-4">{t('support.amount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {donations.map((donation) => (
                                                    <tr key={donation.id}>
                                                        <td className="ps-4">
                                                            <div className="fw-semibold text-dark">
                                                                {donation.user_name} {donation.user_surname}
                                                            </div>
                                                        </td>
                                                        <td className="text-muted small">
                                                            {formatDate(donation.created_at)}
                                                        </td>
                                                        <td className="text-end pe-4 fw-bold text-success">
                                                            {formatCurrency(donation.amount)}
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
                                <h5 className="modal-title">{t('support.confirm_title')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={processing}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>{t('support.confirm_message').replace('{amount}', formatCurrency(parseFloat(amount)))}</p>
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
                                    className="btn btn-success"
                                    onClick={confirmDonation}
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

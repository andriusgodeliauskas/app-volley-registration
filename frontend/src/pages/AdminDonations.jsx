import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminDonations() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            const response = await get(API_ENDPOINTS.DONATIONS);
            const donationsList = response.data?.donations || response.donations || [];
            setDonations(donationsList);

            // Calculate total
            const total = donationsList.reduce((sum, d) => sum + parseFloat(d.amount), 0);
            setTotalAmount(total);
        } catch (err) {
            setError(err.message || 'Failed to fetch donations');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('lt-LT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.donations_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.donations_subtitle')}</p>
                    </div>
                </div>

                {/* Total Donations Card */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="dash-card card-wallet">
                            <div className="dash-card-header">
                                <div className="dash-card-title">{t('admin.total_donations')}</div>
                                <div className="dash-card-icon">❤️</div>
                            </div>
                            <div className="dash-card-value">{formatCurrency(totalAmount)}</div>
                            <div className="dash-card-subtitle opacity-75">
                                {donations.length} {donations.length === 1 ? t('admin.donation') : t('admin.donations')}
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error}</div>
                    </div>
                )}

                <div className="section">
                    <div className="section-header">
                        <div className="section-title">{t('admin.all_donations')}</div>
                    </div>
                    <div className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : donations.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-heart fs-1 opacity-25"></i>
                                <p className="mt-2">{t('admin.no_donations')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="table-responsive d-none d-md-block">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 px-4 py-3">#</th>
                                                <th className="border-0 px-4 py-3">{t('admin.donation_date')}</th>
                                                <th className="border-0 px-4 py-3">{t('admin.donation_user')}</th>
                                                <th className="border-0 px-4 py-3 text-end">{t('admin.donation_amount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {donations.map(donation => (
                                                <tr key={donation.id}>
                                                    <td className="px-4 text-muted small">#{donation.id}</td>
                                                    <td className="px-4">{formatDate(donation.created_at)}</td>
                                                    <td className="px-4">
                                                        <div className="fw-semibold">{donation.user_name} {donation.user_surname}</div>
                                                    </td>
                                                    <td className="px-4 fw-bold text-success text-end">{formatCurrency(donation.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-light">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-3 fw-bold text-end">{t('admin.total')}:</td>
                                                <td className="px-4 py-3 fw-bold text-success text-end fs-5">{formatCurrency(totalAmount)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Mobile Block View */}
                                <div className="d-md-none">
                                    {donations.map((donation) => (
                                        <div key={donation.id} className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <span className="text-muted small">#{donation.id}</span>
                                                <span className="fw-bold fs-5 text-success">
                                                    {formatCurrency(donation.amount)}
                                                </span>
                                            </div>
                                            <div className="text-muted small mb-2">
                                                {formatDate(donation.created_at)}
                                            </div>
                                            <div className="fw-semibold text-dark">
                                                {donation.user_name} {donation.user_surname}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Total Section for Mobile */}
                                    <div className="border-top pt-3 mt-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-bold">{t('admin.total')}:</span>
                                            <span className="fw-bold text-success fs-5">{formatCurrency(totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDonations;

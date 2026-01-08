import { useLanguage } from '../context/LanguageContext';
import AdminNavbar from '../components/AdminNavbar';

function AdminWallet() {
    const { t } = useLanguage();

    return (
        <div className="min-vh-100">
            <AdminNavbar />
            <div className="main-container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.wallet_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.wallet_subtitle')}</p>
                    </div>
                </div>

                <div className="section">
                    <div className="text-center py-5">
                        <div className="mb-4">
                            <span className="display-1 text-warning opacity-25">
                                <i className="bi bi-wallet2"></i>
                            </span>
                        </div>
                        <h2 className="h4 fw-bold mb-2">{t('admin.wallet_coming_soon')}</h2>
                        <p className="text-muted mb-0" style={{ maxWidth: '500px', margin: '0 auto' }}>
                            {t('admin.wallet_description')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminWallet;

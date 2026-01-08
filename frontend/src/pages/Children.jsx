import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

function Children() {
    const { t } = useLanguage();

    return (
        <div className="min-vh-100">
            <Navbar />
            <div className="main-container">
                <div className="section text-center py-5">
                    <h1>{t('children.title')}</h1>
                    <p className="lead text-muted">{t('children.coming_soon')}</p>
                    <Link to="/dashboard" className="btn-custom bg-primary text-white border-primary">{t('common.back')}</Link>
                </div>
            </div>
        </div>
    );
}

export default Children;

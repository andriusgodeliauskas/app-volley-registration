import { useLanguage } from '../context/LanguageContext';

/**
 * OrDivider Component
 * Displays a horizontal divider with "arba" (or) text in the middle
 * Used to separate authentication methods
 */
function OrDivider() {
    const { t } = useLanguage();

    return (
        <div className="d-flex align-items-center my-4">
            <hr className="flex-grow-1" />
            <span className="px-3 text-muted small">{t('auth.or')}</span>
            <hr className="flex-grow-1" />
        </div>
    );
}

export default OrDivider;

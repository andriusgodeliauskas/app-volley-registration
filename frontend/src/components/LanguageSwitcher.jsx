import { useLanguage } from '../context/LanguageContext';

function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="language-switcher ms-3">
            <div className="dropdown">
                <button
                    className="btn btn-sm btn-outline-light dropdown-toggle text-uppercase"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    {language}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 'auto' }}>
                    <li>
                        <button
                            className={`dropdown-item ${language === 'lt' ? 'active' : ''}`}
                            onClick={() => setLanguage('lt')}
                        >
                            🇱🇹 LT
                        </button>
                    </li>
                    <li>
                        <button
                            className={`dropdown-item ${language === 'en' ? 'active' : ''}`}
                            onClick={() => setLanguage('en')}
                        >
                            🇺🇸 EN
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default LanguageSwitcher;

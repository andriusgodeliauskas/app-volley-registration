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
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 p-1 mt-2" style={{ minWidth: '120px' }}>
                    <li>
                        <button
                            className={`dropdown-item rounded-2 py-2 ${language === 'lt' ? 'active' : ''}`}
                            onClick={() => setLanguage('lt')}
                        >
                            Lietuvių
                        </button>
                    </li>
                    <li>
                        <button
                            className={`dropdown-item rounded-2 py-2 ${language === 'en' ? 'active' : ''}`}
                            onClick={() => setLanguage('en')}
                        >
                            English
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default LanguageSwitcher;

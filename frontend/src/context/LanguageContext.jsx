import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    // Try to get language from localStorage, otherwise default to 'lt'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('app_language');
        // Default to 'lt' as requested by user
        return saved || 'lt';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
        // Update document language attribute
        document.documentElement.lang = language;
    }, [language]);

    const value = {
        language,
        setLanguage,
        t: (key) => {
            const keys = key.split('.');
            let value = translations[language];

            for (const k of keys) {
                if (value && value[k]) {
                    value = value[k];
                } else {
                    // Fallback to key or english if missing
                    return key;
                }
            }
            return value;
        }
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

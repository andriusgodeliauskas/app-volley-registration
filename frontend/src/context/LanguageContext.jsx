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
            // Direct key lookup since our keys already include dots (e.g., 'nav.dashboard')
            const translation = translations[language]?.[key];

            // Fallback to English if not found in current language
            if (translation) {
                return translation;
            }

            // Fallback to English
            const englishTranslation = translations['en']?.[key];
            if (englishTranslation) {
                return englishTranslation;
            }

            // Return key itself if no translation found
            return key;
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

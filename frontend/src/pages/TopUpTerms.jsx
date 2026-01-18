import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';

export default function TopUpTerms() {
    const { t, language } = useLanguage();

    return (
        <div className="min-vh-100">
            <Navbar />

            <div className="main-container">
                <Breadcrumb items={[
                    { label: t('nav.home'), path: '/dashboard' },
                    { label: t('nav.wallet'), path: '/wallet' },
                    { label: t('topup_terms.title'), path: '/topup-terms' }
                ]} />

                <div className="section">
                    <div className="section-header mb-4">
                        <div className="section-title">
                            <i className="bi bi-file-text me-2 text-primary"></i>
                            {t('topup_terms.title')}
                        </div>
                    </div>

                    <div className="p-4">
                        {language === 'lt' ? (
                            <>
                                <p>
                                    Informuojame, kad sąskaitos informacijos ir mokėjimo inicijavimo paslaugas Jums suteiks Paysera vadovaudamasi šių paslaugų teikimo{' '}
                                    <a
                                        href="https://www.paysera.com/v2/lt/legal/mokejimo-inicijavimo-ir-informacijos-apie-saskaitas-paslaugu-teikimo-taisykles"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        taisyklėmis
                                    </a>
                                    . Tęsdami apmokėjimą patvirtinate, kad sutinkate su šių paslaugų suteikimu ir jų teikimo sąlygomis.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    Please be informed that the account information and payment initiation services will be provided to you by Paysera in accordance with these{' '}
                                    <a
                                        href="https://www.paysera.com/v2/en/legal/rules-for-the-provision-of-the-payment-initiation-service"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        rules
                                    </a>
                                    . By proceeding with this payment, you agree to receive this service and the service terms and conditions.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

function Rules() {
    const { t, language } = useLanguage();

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    {/* Header */}
                    <div className="text-center mb-4">
                        <h2 className="fw-bold">{t('rules.title')}</h2>
                        <p className="text-muted small">{t('rules.last_updated')}: 2026-01-01</p>
                    </div>

                    {/* Content Card */}
                    <div className="card shadow-sm">
                        <div className="card-body p-4 p-md-5">
                            {language === 'lt' ? <RulesLT /> : <RulesEN />}
                        </div>
                    </div>

                    {/* Back Button */}
                    <div className="text-center mt-4">
                        <a href="/register" className="btn btn-outline-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
                            </svg>
                            {t('common.back')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Lithuanian Rules Content
function RulesLT() {
    return (
        <div className="rules-content" style={{ fontSize: '0.9rem' }}>
            <h5 className="fw-bold mb-3">1. Bendrosios nuostatos</h5>
            <p className="mb-2">1.1. Šios naudojimosi taisyklės (toliau – Taisyklės) reglamentuoja smėlio tinklinio aikštelių rezervavimo sistemos naudojimą.</p>
            <p className="mb-2">1.2. Registruodamasis ir naudodamasis sistema, Naudotojas patvirtina, kad susipažino su šiomis Taisyklėmis ir įsipareigoja jų laikytis.</p>
            <p className="mb-2">1.3. Administratorius pasilieka teisę bet kuriuo metu keisti šias Taisykles, apie tai iš anksto informuodamas Naudotojus sistemoje.</p>

            <h5 className="fw-bold mb-3 mt-4">2. Registracija ir paskyra</h5>
            <p>2.1. Norėdamas naudotis sistema, Naudotojas privalo užsiregistruoti ir sukurti asmeninę paskyrą.</p>
            <p>2.2. Registracijos metu Naudotojas įsipareigoja pateikti tikslią ir teisingą informaciją.</p>
            <p>2.3. Naudotojas yra atsakingas už savo paskyros saugumą ir slaptažodžio konfidencialumą.</p>
            <p>2.4. Naudotojas negali perleisti savo paskyros kitiems asmenims.</p>
            <p>2.5. Administratorius pasilieka teisę netvirtinti, sustabdyti arba deaktyvuoti Naudotojo paskyrą, jei:</p>
            <ul>
                <li>Naudotojas pažeidžia šias Taisykles</li>
                <li>Naudotojas sistemingai nedalyvauja užsiregistruotuose žaidimuose</li>
                <li>Naudotojas piktnaudžiauja sistema</li>
                <li>Naudotojo piniginėje yra neigiamas balansas ir jis nepapildo sąskaitos</li>
            </ul>

            <h5 className="fw-bold mb-3 mt-4">3. Žaidimų rezervacija</h5>
            <p>3.1. Naudotojas gali užsiregistruoti į atvirą žaidimą pagal nurodytą datą ir laiką.</p>
            <p>3.2. Užsiregistravęs Naudotojas įsipareigoja dalyvauti žaidime arba laiku atšaukti savo dalyvavimą.</p>
            <p>3.3. Naudotojas gali atšaukti savo dalyvavimą sistemoje pagal prie kiekvieno renginio nurodytą atšaukimo terminą.</p>
            <p>3.4. Sisteminis nedalyvavimas žaidime be išankstinio atšaukimo gali būti vertinamas kaip Taisyklių pažeidimas ir gali turėti įtakos galimybei registruotis į būsimus žaidimus.</p>

            <h5 className="fw-bold mb-3 mt-4">4. Piniginė ir mokėjimai</h5>
            <p>4.1. Kiekvienas Naudotojas turi virtualią piniginę sistemoje.</p>
            <p>4.2. Po kiekvieno žaidimo pasibaigus, už dalyvavimą automatiškai nuskaitoma nustatyta suma iš Naudotojo piniginės.</p>
            <p>4.3. Naudotojas gali papildyti savo piniginę sistemoje nurodytais būdais.</p>
            <p>4.4. Sistema leidžia nuskaityti lėšas į neigiamą balansą, tačiau Administratorius pasilieka teisę neleisti Naudotojui registruotis į sekančius žaidimus, kol neigiamas balansas nebus padengtas.</p>
            <p>4.5. Naudotojas įsipareigoja papildyti piniginę per 1 savaitę nuo neigiamo balanso atsiradimo.</p>

            <h5 className="fw-bold mb-3 mt-4">5. Depozitai</h5>
            <p>5.1. Kai Administratorius priima depozitus (paprastai sezono pradžioje), Naudotojas gali sumokėti nustatytą depozito sumą.</p>
            <p>5.2. Depozitas suteikia Naudotojui pirmumo teisę registruotis į žaidimus.</p>
            <p>5.3. Depozitas grąžinamas Naudotojui sezono pabaigoje, išskyrus atvejus, kai:</p>
            <ul>
                <li>Naudotojas turi nepadengtą neigiamą balansą piniginėje</li>
                <li>Naudotojas pažeidė Taisykles ir taikyta sankcija dėl depozito išskaitymo</li>
            </ul>
            <p>5.4. Depozito suma, priėmimo ir grąžinimo tvarka nurodoma sistemoje atitinkamu laikotarpiu.</p>

            <h5 className="fw-bold mb-3 mt-4">6. Parama organizatoriams</h5>
            <p>6.1. Naudotojas gali savanoriškai paremti organizatorius papildoma suma naudodamasis sistemoje esančia paramos funkcija.</p>
            <p>6.2. Parama yra savanoriška ir negrąžinama.</p>

            <h5 className="fw-bold mb-3 mt-4">7. Naudotojų elgesys</h5>
            <p>7.1. Naudotojai įsipareigoja gerbti kitus Naudotojus ir laikytis bendro mandagumo normų.</p>
            <p>7.2. Draudžiama skleisti neteisingą informaciją, įžeidinėti kitus Naudotojus ar kitaip piktnaudžiauti sistema.</p>
            <p>7.3. Draudžiama naudoti sistemą neteisėtiems tikslams.</p>

            <h5 className="fw-bold mb-3 mt-4">8. Atsakomybės apribojimas</h5>
            <p>8.1. Administratorius nėra atsakingas už Naudotojų tarpusavio santykius, ginčus ar sužalojimus žaidimų metu.</p>
            <p>8.2. Naudotojas žaidžia savo atsakomybe ir rizika.</p>
            <p>8.3. Administratorius nėra atsakingas už techninių trikdžių ar sistemos veiklos sutrikimų sukeltus nuostolius.</p>

            <h5 className="fw-bold mb-3 mt-4">9. Taisyklių pažeidimai ir sankcijos</h5>
            <p>9.1. Už Taisyklių pažeidimus Administratorius gali:</p>
            <ul>
                <li>Išsiųsti įspėjimą Naudotojui</li>
                <li>Netvirtinti Naudotojo paskyros</li>
                <li>Laikinai apriboti prieigą prie sistemos ir uždrausti registruotis į žaidimus</li>
                <li>Sustabdyti Naudotojo paskyros veikimą</li>
                <li>Visam laikui deaktyvuoti Naudotojo paskyrą</li>
            </ul>
            <p>9.2. Sprendimą dėl pažeidimo rimtumo ir taikomų sankcijų priima Administratorius.</p>
            <p>9.3. Naudotojas, nesutinkantis su Administratoriaus sprendimu, gali kreiptis nurodytais kontaktais.</p>

            <h5 className="fw-bold mb-3 mt-4">10. Asmens duomenų apsauga</h5>
            <p>10.1. Naudotojo asmens duomenys tvarkomi vadovaujantis Bendrojo duomenų apsaugos reglamento (BDAR) reikalavimais.</p>
            <p>10.2. Naudotojo duomenys naudojami tik sistemos funkcionalumui užtikrinti.</p>
            <p>10.3. Naudotojo duomenys nebus perduodami tretiesiems asmenims be Naudotojo sutikimo, išskyrus įstatymų numatytus atvejus.</p>

            <h5 className="fw-bold mb-3 mt-4">11. Kontaktai</h5>
            <p>Dėl klausimų, problemų ar pasiūlymų kreipkitės:</p>
            <p className="mb-1"><strong>Administratorius</strong></p>
            <p className="mb-1">Tel.: +370 601 27509</p>
            <p>El. paštas: andrius.godeliauskas@gmail.com</p>
        </div>
    );
}

// English Rules Content
function RulesEN() {
    return (
        <div className="rules-content" style={{ fontSize: '0.9rem' }}>
            <h5 className="fw-bold mb-3">1. General Provisions</h5>
            <p>1.1. These Terms of Use (hereinafter referred to as the "Terms") govern the use of the beach volleyball court reservation system.</p>
            <p>1.2. By registering and using the system, the User confirms that they have read these Terms and agrees to comply with them.</p>
            <p>1.3. The Administrator reserves the right to change these Terms at any time by notifying Users in advance through the system.</p>

            <h5 className="fw-bold mb-3 mt-4">2. Registration and Account</h5>
            <p>2.1. To use the system, the User must register and create a personal account.</p>
            <p>2.2. During registration, the User undertakes to provide accurate and correct information.</p>
            <p>2.3. The User is responsible for the security of their account and the confidentiality of their password.</p>
            <p>2.4. The User may not transfer their account to other persons.</p>
            <p>2.5. The Administrator reserves the right not to approve, suspend, or deactivate a User's account if:</p>
            <ul>
                <li>The User violates these Terms</li>
                <li>The User systematically fails to attend registered games</li>
                <li>The User abuses the system</li>
                <li>The User's wallet has a negative balance and they do not top up the account</li>
            </ul>

            <h5 className="fw-bold mb-3 mt-4">3. Game Reservations</h5>
            <p>3.1. The User can register for an available game according to the specified date and time.</p>
            <p>3.2. A registered User undertakes to participate in the game or cancel their participation on time.</p>
            <p>3.3. The User can cancel their participation in the system according to the cancellation deadline specified for each event.</p>
            <p>3.4. Systematic non-attendance at a game without prior cancellation may be considered a violation of the Terms and may affect the ability to register for future games.</p>

            <h5 className="fw-bold mb-3 mt-4">4. Wallet and Payments</h5>
            <p>4.1. Each User has a virtual wallet in the system.</p>
            <p>4.2. After each game ends, a fixed amount is automatically deducted from the User's wallet for participation.</p>
            <p>4.3. The User can top up their wallet using the methods specified in the system.</p>
            <p>4.4. The system allows deducting funds to a negative balance, however, the Administrator reserves the right to prevent the User from registering for subsequent games until the negative balance is covered.</p>
            <p>4.5. The User undertakes to top up the wallet within 1 week from the occurrence of a negative balance.</p>

            <h5 className="fw-bold mb-3 mt-4">5. Deposits</h5>
            <p>5.1. When the Administrator accepts deposits (usually at the beginning of the season), the User can pay a specified deposit amount.</p>
            <p>5.2. The deposit gives the User priority right to register for games.</p>
            <p>5.3. The deposit is returned to the User at the end of the season, except in cases where:</p>
            <ul>
                <li>The User has an uncovered negative balance in the wallet</li>
                <li>The User violated the Terms and a sanction regarding deposit deduction was applied</li>
            </ul>
            <p>5.4. The deposit amount, acceptance and refund procedure are indicated in the system during the relevant period.</p>

            <h5 className="fw-bold mb-3 mt-4">6. Support for Organizers</h5>
            <p>6.1. The User can voluntarily support the organizers with an additional amount using the support function available in the system.</p>
            <p>6.2. Support is voluntary and non-refundable.</p>

            <h5 className="fw-bold mb-3 mt-4">7. User Behavior</h5>
            <p>7.1. Users undertake to respect other Users and comply with general courtesy standards.</p>
            <p>7.2. It is prohibited to spread false information, insult other Users, or otherwise abuse the system.</p>
            <p>7.3. It is prohibited to use the system for illegal purposes.</p>

            <h5 className="fw-bold mb-3 mt-4">8. Limitation of Liability</h5>
            <p>8.1. The Administrator is not responsible for Users' mutual relations, disputes, or injuries during games.</p>
            <p>8.2. The User plays at their own responsibility and risk.</p>
            <p>8.3. The Administrator is not responsible for losses caused by technical failures or system malfunctions.</p>

            <h5 className="fw-bold mb-3 mt-4">9. Violations and Sanctions</h5>
            <p>9.1. For violations of the Terms, the Administrator may:</p>
            <ul>
                <li>Send a warning to the User</li>
                <li>Not approve the User's account</li>
                <li>Temporarily restrict access to the system and prohibit registration for games</li>
                <li>Suspend the User's account operation</li>
                <li>Permanently deactivate the User's account</li>
            </ul>
            <p>9.2. The decision regarding the severity of the violation and applicable sanctions is made by the Administrator.</p>
            <p>9.3. A User who disagrees with the Administrator's decision may contact using the provided contact details.</p>

            <h5 className="fw-bold mb-3 mt-4">10. Personal Data Protection</h5>
            <p>10.1. User's personal data is processed in accordance with the requirements of the General Data Protection Regulation (GDPR).</p>
            <p>10.2. User data is used only to ensure the functionality of the system.</p>
            <p>10.3. User data will not be transferred to third parties without the User's consent, except in cases provided by law.</p>

            <h5 className="fw-bold mb-3 mt-4">11. Contact</h5>
            <p>For questions, problems, or suggestions, please contact:</p>
            <p className="mb-1"><strong>Administrator</strong></p>
            <p className="mb-1">Phone: +370 601 27509</p>
            <p>Email: andrius.godeliauskas@gmail.com</p>
        </div>
    );
}

export default Rules;

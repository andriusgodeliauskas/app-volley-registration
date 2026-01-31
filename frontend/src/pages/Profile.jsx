import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { get, post, API_ENDPOINTS } from '../api/config';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';

// Avatar configurations - males first (26 total), then females (5)
const AVATARS = [
    // Default - simple smiling male
    { id: 'default', params: 'hair=short01&skinColor=f2d3b1&mouth=variant30&eyes=variant26&eyebrows=variant10' },
    // Males with short hair (10 options)
    { id: 'male1', params: 'hair=short01&skinColor=f2d3b1&mouth=variant01&eyes=variant01' },
    { id: 'male2', params: 'hair=short02&skinColor=ecad80&mouth=variant02&eyes=variant02' },
    { id: 'male3', params: 'hair=short03&skinColor=f9c9b6&mouth=variant03&eyes=variant03' },
    { id: 'male4', params: 'hair=short04&skinColor=f2d3b1&mouth=variant04&eyes=variant04' },
    { id: 'male5', params: 'hair=short05&skinColor=ecad80&mouth=variant05&eyes=variant05' },
    { id: 'male6', params: 'hair=short06&skinColor=f9c9b6&mouth=variant06&eyes=variant06' },
    { id: 'male7', params: 'hair=short07&skinColor=f2d3b1&mouth=variant07&eyes=variant07' },
    { id: 'male8', params: 'hair=short08&skinColor=ecad80&mouth=variant08&eyes=variant08' },
    { id: 'male9', params: 'hair=short09&skinColor=f9c9b6&mouth=variant09&eyes=variant09' },
    { id: 'male10', params: 'hair=short10&skinColor=f2d3b1&mouth=variant10&eyes=variant10' },
    // More males - different short styles
    { id: 'male11', params: 'hair=short11&skinColor=f2d3b1&mouth=variant11&eyes=variant11' },
    { id: 'male12', params: 'hair=short12&skinColor=ecad80&mouth=variant12&eyes=variant12' },
    { id: 'male13', params: 'hair=short13&skinColor=f9c9b6&mouth=variant13&eyes=variant13' },
    { id: 'male14', params: 'hair=short14&skinColor=f2d3b1&mouth=variant14&eyes=variant14' },
    { id: 'male15', params: 'hair=short15&skinColor=ecad80&mouth=variant15&eyes=variant15' },
    { id: 'male16', params: 'hair=short16&skinColor=f9c9b6&mouth=variant16&eyes=variant16' },
    { id: 'male17', params: 'hair=short17&skinColor=f2d3b1&mouth=variant17&eyes=variant17' },
    { id: 'male18', params: 'hair=short18&skinColor=ecad80&mouth=variant18&eyes=variant18' },
    { id: 'male19', params: 'hair=short19&skinColor=f9c9b6&mouth=variant19&eyes=variant19' },
    // Males with glasses/accessories
    { id: 'male20', params: 'hair=short01&skinColor=f2d3b1&mouth=variant20&eyes=variant20&glasses=variant01' },
    { id: 'male21', params: 'hair=short02&skinColor=ecad80&mouth=variant21&eyes=variant21&glasses=variant02' },
    { id: 'male22', params: 'hair=short03&skinColor=f9c9b6&mouth=variant22&eyes=variant22&glasses=variant03' },
    { id: 'male23', params: 'hair=short04&skinColor=f2d3b1&mouth=variant23&eyes=variant23&glasses=variant04' },
    { id: 'male24', params: 'hair=short05&skinColor=ecad80&mouth=variant24&eyes=variant24&glasses=variant05' },
    { id: 'male25', params: 'hair=short06&skinColor=f9c9b6&mouth=variant25&eyes=variant25&eyebrows=variant01' },
    // Females with long hair (5 options)
    { id: 'female1', params: 'hair=long01&skinColor=f2d3b1&mouth=variant01&eyes=variant01' },
    { id: 'female2', params: 'hair=long02&skinColor=ecad80&mouth=variant02&eyes=variant02' },
    { id: 'female3', params: 'hair=long03&skinColor=f9c9b6&mouth=variant03&eyes=variant03' },
    { id: 'female4', params: 'hair=long04&skinColor=f2d3b1&mouth=variant04&eyes=variant04' },
    { id: 'female5', params: 'hair=long05&skinColor=ecad80&mouth=variant05&eyes=variant05' },
];

const getAvatarUrl = (avatarId) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    if (avatar) {
        return `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarId}&${avatar.params}`;
    }
    // Fallback for old avatar seeds
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarId}&skinColor=f2d3b1`;
};

export default function Profile() {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        userEmail: '', // userEmail to avoid conflict with email input name if any
        avatar: 'default',
        preferred_language: 'lt'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await get(API_ENDPOINTS.USER);
                if (response.success) {
                    const userData = response.data?.user || response.data;
                    setFormData({
                        name: userData.name || '',
                        surname: userData.surname || '',
                        userEmail: userData.email || '',
                        avatar: userData.avatar || 'male1',
                        preferred_language: userData.preferred_language || 'lt'
                    });
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
                setError(t('profile.failed_load'));
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const response = await post(API_ENDPOINTS.USER_UPDATE, {
                name: formData.name,
                surname: formData.surname,
                avatar: formData.avatar,
                preferred_language: formData.preferred_language
            });

            if (response.success) {
                setMessage(t('profile.update_success'));
                // Update context
                if (response.data?.user) {
                    updateUser(response.data.user);
                }
            } else {
                setError(response.message || t('profile.update_failed'));
            }
        } catch (err) {
            setError(err.message || t('profile.error_occurred'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100">
            <Navbar />

            <div className="main-container">
                <Breadcrumb items={[
                    { label: t('nav.home'), path: '/dashboard' },
                    { label: t('nav.profile'), path: '/profile' }
                ]} />

                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="section">
                            <div className="section-header border-0 pb-0">
                                <div className="section-title">{t('profile.title')}</div>
                            </div>
                            <div className="p-3">
                                {message && (
                                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-3">
                                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                                        <div>{message}</div>
                                    </div>
                                )}
                                {error && (
                                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-3">
                                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                                        <div>{error}</div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="row mb-4">
                                        <div className="col-md-4 text-center mb-3 mb-md-0">
                                            <div className="mb-3">
                                                <img
                                                    src={getAvatarUrl(formData.avatar)}
                                                    alt="Avatar"
                                                    className="rounded-circle shadow-sm bg-gray-100"
                                                    style={{ width: '120px', height: '120px' }}
                                                />
                                            </div>
                                            <p className="text-muted small">{t('profile.select_avatar_below')}</p>
                                        </div>
                                        <div className="col-md-8">
                                            <div className="mb-3">
                                                <label className="form-label text-muted small fw-bold text-uppercase">{t('auth.email')}</label>
                                                <input
                                                    type="email"
                                                    className="form-control bg-light"
                                                    value={formData.userEmail}
                                                    disabled
                                                    readOnly
                                                />
                                                <div className="form-text">{t('profile.email_readonly')}</div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label text-muted small fw-bold text-uppercase">{t('auth.name')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label text-muted small fw-bold text-uppercase">{t('auth.surname')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.surname}
                                                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted small fw-bold text-uppercase">{t('profile.email_language')}</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.preferred_language}
                                                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                                                >
                                                    <option value="lt">{t('profile.language_lt')}</option>
                                                    <option value="en">{t('profile.language_en')}</option>
                                                </select>
                                                <div className="form-text">{t('profile.email_language_hint')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-muted small fw-bold text-uppercase mb-3">{t('profile.choose_avatar')}</label>
                                        <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                                            {AVATARS.map(avatar => (
                                                <button
                                                    key={avatar.id}
                                                    type="button"
                                                    className={`btn p-1 ${formData.avatar === avatar.id ? 'btn-primary' : 'btn-outline-light border-0'}`}
                                                    onClick={() => setFormData({ ...formData, avatar: avatar.id })}
                                                    style={{ width: '60px', height: '60px', overflow: 'hidden' }}
                                                >
                                                    <img
                                                        src={getAvatarUrl(avatar.id)}
                                                        alt={avatar.id}
                                                        style={{ width: '100%', height: '100%' }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end">
                                        <button
                                            type="submit"
                                            className="btn-custom bg-primary text-white border-primary px-4"
                                            disabled={saving}
                                        >
                                            {saving ? t('profile.saving') : t('common.save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

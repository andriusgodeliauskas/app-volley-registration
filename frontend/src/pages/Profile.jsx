import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { get, post, API_ENDPOINTS } from '../api/config';
import { Link } from 'react-router-dom';

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Zack', 'Midnight', 'Abby',
    'Bella', 'Buster', 'Coco', 'Daisy', 'Ginger',
    'Jack', 'Jasper', 'Lola', 'Lucky', 'Max',
    'Misty', 'Oliver', 'Oscar', 'Pepper', 'Rocky'
];

const getAvatarUrl = (seed) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;

export default function Profile() {
    const { user, login } = useAuth(); // login is used to update context user
    const [formData, setFormData] = useState({
        name: '',
        userEmail: '', // userEmail to avoid conflict with email input name if any
        avatar: 'Felix'
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
                        userEmail: userData.email || '',
                        avatar: userData.avatar || 'Felix'
                    });
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
                setError('Failed to load profile data');
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
                avatar: formData.avatar
            });

            if (response.success) {
                setMessage('Profile updated successfully');
                // Update local user context if needed, though usually App re-fetches or we update manually
                // We can't easily update AuthContext user without re-login or reload, 
                // but if AuthContext exposes a setter it would be good. 
                // For now, changes stick in DB.
            } else {
                setError(response.message || 'Failed to update profile');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
                <div className="container">
                    <Link className="navbar-brand fw-bold" to="/dashboard">🏐 Volley App</Link>
                    <div className="ms-auto">
                        <Link to="/dashboard" className="btn btn-outline-light btn-sm">
                            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0 py-3">
                                <h4 className="mb-0 fw-bold">My Profile</h4>
                            </div>
                            <div className="card-body p-4">
                                {message && <div className="alert alert-success">{message}</div>}
                                {error && <div className="alert alert-danger">{error}</div>}

                                <form onSubmit={handleSubmit}>
                                    <div className="row mb-4">
                                        <div className="col-md-4 text-center mb-3 mb-md-0">
                                            <div className="mb-3">
                                                <img
                                                    src={getAvatarUrl(formData.avatar)}
                                                    alt="Avatar"
                                                    className="rounded-circle shadow-sm bg-light"
                                                    style={{ width: '120px', height: '120px' }}
                                                />
                                            </div>
                                            <p className="text-muted small">Select an avatar below</p>
                                        </div>
                                        <div className="col-md-8">
                                            <div className="mb-3">
                                                <label className="form-label text-muted small fw-bold text-uppercase">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control bg-light"
                                                    value={formData.userEmail}
                                                    disabled
                                                    readOnly
                                                />
                                                <div className="form-text">Email cannot be changed.</div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted small fw-bold text-uppercase">Name & Surname</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-muted small fw-bold text-uppercase mb-3">Choose Avatar</label>
                                        <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                                            {AVATAR_SEEDS.map(seed => (
                                                <button
                                                    key={seed}
                                                    type="button"
                                                    className={`btn p-1 ${formData.avatar === seed ? 'btn-primary' : 'btn-outline-light border-0'}`}
                                                    onClick={() => setFormData({ ...formData, avatar: seed })}
                                                    style={{ width: '60px', height: '60px', overflow: 'hidden' }}
                                                >
                                                    <img
                                                        src={getAvatarUrl(seed)}
                                                        alt={seed}
                                                        style={{ width: '100%', height: '100%' }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end">
                                        <button
                                            type="submit"
                                            className="btn btn-primary px-4"
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminUsers() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await get(API_ENDPOINTS.USERS);
            if (response.success && response.data?.users) {
                setUsers(response.data.users);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(t('admin.failed_load_users'));
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter(u => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            u.name.toLowerCase().includes(query) ||
            u.surname.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.users_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.users_subtitle')}</p>
                    </div>
                    <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 w-100 w-md-auto">
                        <div className="input-group w-100" style={{ maxWidth: '100%' }}>
                            <span className="input-group-text bg-light border-end-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder={t('admin.search_users') || 'Ieškoti pagal vardą, pavardę...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ borderRight: searchQuery ? 'none' : '' }}
                            />
                            {searchQuery && (
                                <button
                                    className="btn btn-light border border-start-0"
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    title="Išvalyti"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            )}
                        </div>
                        <Link to="/admin" className="btn-custom bg-light border text-center" style={{ minWidth: 'auto' }}>{t('common.back')}</Link>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error}</div>
                    </div>
                )}

                {/* Users List */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">
                            {t('admin.all_users')}
                            {searchQuery && (
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 ms-2">
                                    {filteredUsers.length} {filteredUsers.length === 1 ? 'rezultatas' : 'rezultatai'}
                                </span>
                            )}
                        </div>
                    </div>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <h5>{t('admin.no_users')}</h5>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-search fs-1 d-block mb-3"></i>
                            <h5>Nerasta vartotojų pagal "{searchQuery}"</h5>
                            <p className="mb-0">Pabandykite kitą paieškos užklausą</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {filteredUsers.map(u => (
                                <div key={u.id} className="event-card">
                                    <div className="event-icon">
                                        <img
                                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${u.avatar || 'Midnight'}`}
                                            alt={u.name}
                                            className="w-100 h-100 rounded"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div className="event-info">
                                        <div className="event-title">
                                            {u.name} {u.surname}
                                            <span className={`badge rounded-pill ${u.role === 'super_admin' ? 'bg-danger' :
                                                u.role === 'group_admin' ? 'bg-info' : 'bg-secondary'
                                                }`}>
                                                {u.role.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="event-details">
                                            <div className="event-detail">👤 {u.name}</div>
                                            <div className="event-detail">📝 {u.surname}</div>
                                            <div className="event-detail">📧 {u.email}</div>
                                            <div className="event-detail">
                                                💰 <span className={`fw-bold ${u.balance < 0 ? 'text-danger' : 'text-success'}`}>
                                                    €{u.balance.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="event-detail">
                                                {u.is_active ?
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">{t('admin.user_active')}</span> :
                                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">{t('admin.user_inactive')}</span>
                                                }
                                            </div>
                                            <div className="event-detail">📅 {new Date(u.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="event-actions">
                                        <Link to={`/admin/users/edit/${u.id}`} className="btn-custom">
                                            {t('common.edit')}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminUsers;

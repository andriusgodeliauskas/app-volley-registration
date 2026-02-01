import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { get, post } from '../api/config';

/**
 * RegisterUserModal - Modal for super admin to register any user for an event
 *
 * @param {Object} props
 * @param {boolean} props.show - Whether modal is visible
 * @param {Function} props.onHide - Callback when modal is closed
 * @param {number} props.eventId - ID of the event
 * @param {Function} props.onSuccess - Callback when registration is successful
 */
export default function RegisterUserModal({ show, onHide, eventId, onSuccess }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available users when modal opens
  useEffect(() => {
    if (show && eventId) {
      fetchUsers();
    }
  }, [show, eventId]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.surname.toLowerCase().includes(term) ||
        `${user.name} ${user.surname}`.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await get(`${import.meta.env.VITE_API_URL}/admin_users_for_event.php?event_id=${eventId}`);
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (err) {
      setError(err.message || t('errors.loadUsersFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedUser) {
      setError(t('errors.selectUser'));
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await post(`${import.meta.env.VITE_API_URL}/register_event.php`, {
        event_id: eventId,
        user_id: selectedUser.id
      });

      if (!response.success) {
        // Map error codes to translated messages
        let errorMessage = response.message || t('errors.registrationFailed');
        if (response.message === 'balance_exceeds_user_limit') {
          errorMessage = t('error.balance_exceeds_user_limit');
        } else if (response.message === 'balance_exceeds_event_limit') {
          errorMessage = t('error.balance_exceeds_event_limit');
        }
        setError(errorMessage);
        return;
      }

      // Reset and close
      setSearchTerm('');
      setSelectedUser(null);
      onSuccess();
      onHide();
    } catch (err) {
      setError(err.message || t('errors.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUser(null);
    setError('');
    onHide();
  };

  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t('admin.registerUser')}</h5>
            <button type="button" className="btn-close" onClick={handleClose} disabled={isLoading}></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* Search Input */}
            <div className="mb-3">
              <label htmlFor="userSearch" className="form-label">{t('admin.searchUser')}</label>
              <input
                type="text"
                className="form-control"
                id="userSearch"
                placeholder={t('admin.searchByName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* User List */}
            {isLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('common.loading')}</span>
                </div>
              </div>
            ) : (
              <div className="user-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredUsers.length === 0 ? (
                  <p className="text-muted text-center">{t('admin.noUsersAvailable')}</p>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className={`card mb-2 cursor-pointer ${selectedUser?.id === user.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedUser(user)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body p-2">
                        <div className="d-flex align-items-center">
                          <div className="flex-grow-1">
                            <div className="fw-bold">{user.name} {user.surname}</div>
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleRegister} disabled={isLoading || !selectedUser}>
              {isLoading ? t('common.loading') : t('admin.register')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

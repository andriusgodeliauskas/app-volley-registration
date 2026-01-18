import { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS, post } from '../api/config';

// Create the Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state and methods
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Invalid stored data, clear it
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }

        setLoading(false);
    }, []);

    /**
     * Login with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<object>} User data
     */
    const login = async (email, password, rememberMe = false) => {
        setLoading(true);

        try {
            const response = await post(API_ENDPOINTS.LOGIN, { email, password, remember_me: rememberMe });

            if (response.success) {
                const { user: userData, token: authToken } = response.data;

                // Store in state
                setUser(userData);
                setToken(authToken);

                // Persist to localStorage
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('user', JSON.stringify(userData));

                return userData;
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Register a new user
     * @param {string} firstName 
     * @param {string} lastName
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<object>} User data
     */
    const register = async (firstName, lastName, email, password) => {
        setLoading(true);

        try {
            const response = await post(API_ENDPOINTS.REGISTER, { first_name: firstName, last_name: lastName, email, password });

            if (response.success) {
                return response.data.user;
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (err) {
            // Check if it's a duplicate email error
            const errorMessage = err.message.toLowerCase();
            if (errorMessage.includes('email') &&
                (errorMessage.includes('already') || errorMessage.includes('exist'))) {
                setError('EMAIL_ALREADY_EXISTS'); // Error code for translation
            } else {
                setError(err.message); // Original error message
            }
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout the current user
     * Calls backend to clear httpOnly cookie
     */
    const logout = async () => {
        try {
            // Call backend to clear httpOnly cookie
            await post(API_ENDPOINTS.LOGOUT, {});
        } catch (err) {
            // Log error but don't fail logout
            console.error('Logout API error:', err);
        } finally {
            // Always clear local state
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Clear saved email and remember me preference
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberMe');
        }
    };

    /**
     * Update user data in state and localStorage
     * @param {object} userData 
     */
    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    /**
     * Check if user has a specific role
     * @param {string|string[]} roles 
     * @returns {boolean}
     */
    const hasRole = (roles) => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    };

    /**
     * Check if user is authenticated
     */
    const isAuthenticated = !!user && !!token;

    /**
     * Check if user is super admin
     */
    const isSuperAdmin = user?.role === 'super_admin';

    /**
     * Check if user is group admin or super admin
     */
    const isAdmin = ['super_admin', 'group_admin'].includes(user?.role);

    /**
     * Login with Google OAuth
     * @param {string} code - Authorization code from Google OAuth
     * @returns {Promise<object>} Response with user data or temp_token
     */
    const loginWithGoogle = async (code) => {
        setLoading(true);

        try {
            const response = await post(API_ENDPOINTS.GOOGLE_AUTH, {
                code,
                redirect_uri: `${window.location.origin}/auth/google/callback`
            });

            if (response.success) {
                if (response.data.requires_password) {
                    // New user - return temp token for password setup
                    return {
                        requires_password: true,
                        temp_token: response.data.temp_token,
                        user: response.data.user
                    };
                } else {
                    // Existing user - complete login
                    const { user: userData, token: authToken } = response.data;

                    setUser(userData);
                    setToken(authToken);
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('user', JSON.stringify(userData));

                    return {
                        requires_password: false,
                        user: userData
                    };
                }
            } else {
                throw new Error(response.message || 'Google authentication failed');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Complete Google registration by setting password
     * @param {string} tempToken - Temporary token from Google auth
     * @param {string} password - User's chosen password
     * @returns {Promise<object>} User data
     */
    const completeGoogleRegistration = async (tempToken, password) => {
        setLoading(true);

        try {
            const response = await post(API_ENDPOINTS.SET_PASSWORD, {
                temp_token: tempToken,
                password
            });

            if (response.success) {
                const { user: userData, token: authToken } = response.data;

                setUser(userData);
                setToken(authToken);
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('user', JSON.stringify(userData));

                return userData;
            } else {
                throw new Error(response.message || 'Failed to set password');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Context value
    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        login,
        loginWithGoogle,
        completeGoogleRegistration,
        register,
        logout,
        updateUser,
        hasRole,
        setError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Custom hook to use the Auth Context
 * @returns {object} Auth context value
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

export default AuthContext;

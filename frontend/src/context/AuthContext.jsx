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
    const login = async (email, password) => {
        setError(null);
        setLoading(true);

        try {
            const response = await post(API_ENDPOINTS.LOGIN, { email, password });

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
     * @param {string} name 
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<object>} User data
     */
    const register = async (name, email, password) => {
        setError(null);
        setLoading(true);

        try {
            const response = await post(API_ENDPOINTS.REGISTER, { name, email, password });

            if (response.success) {
                return response.data.user;
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout the current user
     */
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
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

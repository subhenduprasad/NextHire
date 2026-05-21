import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

export const LoginContext = createContext(null);

// Custom hook for using the login context
export const useAuth = () => {
    const context = React.useContext(LoginContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const Context = ({ children }) => {
    const [loginData, setLoginData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user data from localStorage on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem("usertoken");
                const userData = localStorage.getItem("user");
                
                // Check for valid data before parsing
                if (token && userData && userData !== "undefined" && userData !== "null") {
                    const user = JSON.parse(userData);
                    
                    // Optionally verify token with backend
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            setLoginData(result.data);
                            setIsAuthenticated(true);
                            // Update localStorage with fresh data
                            localStorage.setItem("user", JSON.stringify(result.data));
                            if (result.token) {
                                localStorage.setItem("usertoken", result.token);
                            }
                        } else {
                            // Token invalid, clear storage
                            clearAuthData();
                        }
                    } else if (response.status === 401) {
                        // Token expired or invalid
                        clearAuthData();
                    } else {
                        // Fallback to stored data if API fails (e.g. server down)
                        setLoginData(user);
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error("Error initializing auth:", error);
                // Fallback to stored data
                const userData = localStorage.getItem("user");
                if (userData && userData !== "undefined" && userData !== "null") {
                    try {
                        setLoginData(JSON.parse(userData));
                        setIsAuthenticated(true);
                    } catch {
                        clearAuthData();
                    }
                } else {
                    clearAuthData();
                }
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Clear auth data helper
    const clearAuthData = () => {
        localStorage.removeItem("usertoken");
        localStorage.removeItem("user");
        setLoginData(null);
        setIsAuthenticated(false);
    };

    // Login function
    const login = useCallback((userData, token) => {
        localStorage.setItem("usertoken", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setLoginData(userData);
        setIsAuthenticated(true);
    }, []);

    // Logout function
    const logout = useCallback(() => {
        clearAuthData();
    }, []);

    // Update user data
    const updateUser = useCallback((updatedData) => {
        const newUserData = { ...loginData, ...updatedData };
        localStorage.setItem("user", JSON.stringify(newUserData));
        setLoginData(newUserData);
    }, [loginData]);

    // Check if user has specific role
    const hasRole = useCallback((role) => {
        if (!loginData) return false;
        if (Array.isArray(role)) {
            return role.includes(loginData.role);
        }
        return loginData.role === role;
    }, [loginData]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        loginData,
        setLoginData,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        hasRole
    }), [loginData, setLoginData, isLoading, isAuthenticated, login, logout, updateUser, hasRole]);

    return (
        <LoginContext.Provider value={contextValue}>
            {children}
        </LoginContext.Provider>
    );
};

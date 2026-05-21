import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginContext } from './ContextProvider/Context';

/**
 * ProtectedRoute - A wrapper component for protecting routes
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string|string[]} props.allowedRoles - Roles allowed to access this route
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
export const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
    const { loginData, isLoading, isAuthenticated } = useContext(LoginContext);
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
        // Redirect to login page with the current location for redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If specific roles are required, check if user has the required role
    if (allowedRoles.length > 0 && loginData) {
        const userRole = loginData.role || loginData.userType;
        if (!allowedRoles.includes(userRole)) {
            // User doesn't have the required role, redirect to home
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

/**
 * PublicRoute - A wrapper for routes that should only be accessible to non-authenticated users
 * (like login and register pages)
 */
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useContext(LoginContext);
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If user is authenticated, redirect them away from login/register pages
    if (isAuthenticated) {
        // Redirect to the page they came from or home
        const from = location.state?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    return children;
};

export default ProtectedRoute;

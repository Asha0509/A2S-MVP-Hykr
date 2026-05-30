import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const location = useLocation();

    const routerQueryToken = new URLSearchParams(location.search).get('token');
    const urlQueryToken = new URLSearchParams(window.location.search).get('token');
    let hashQueryToken = null;
    if (window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1] || '';
        hashQueryToken = new URLSearchParams(hashQuery).get('token');
    }
    const hasIncomingOAuthToken = !!(routerQueryToken || urlQueryToken || hashQueryToken);

    if (!isAuthenticated && !hasIncomingOAuthToken) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;

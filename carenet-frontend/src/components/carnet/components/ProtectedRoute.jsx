import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProtectedRoute({ children, adminOnly = false }) {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    
    if (!user) {
      // No user data, redirect to login
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      
      // Check if user is authenticated
      if (!userData.isAuthenticated) {
        navigate('/login');
        return;
      }

      // Check admin access for admin-only routes
      if (adminOnly && userData.role !== 'ADMIN') {
        navigate('/dashboard'); // Redirect non-admins to caregiver dashboard
        return;
      }
    } catch (error) {
      // Invalid user data, redirect to login
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate, adminOnly]);

  return children;
}

export default ProtectedRoute;

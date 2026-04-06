import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Phone, Facebook, Instagram, Twitter, Youtube, Linkedin, UserCircle, LogOut, LayoutDashboard, ChevronDown, Crown } from 'lucide-react';
import ApiService from '../services/api';

export default function PublicNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userRole, setUserRole] = useState('client'); // 'client' or 'caregiver'
  const [userContext, setUserContext] = useState(null);
  const profileMenuRef = useRef(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') || 'client';
    setIsLoggedIn(!!token);
    setUserRole(role);
  }, [location]);

  // Load user context (name, email, role, isSubscribed, avatar)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    // Only fetch context if we have both token and userId
    if (!token || !userId) {
      setUserContext(null);
      return;
    }
    
    (async () => {
      try {
        const ctx = await ApiService.getUserContext();
        setUserContext(ctx);
        // cache subscription for immediate UX on reloads
        if (typeof ctx?.isSubscribed === 'boolean') {
          localStorage.setItem('isSubscribed', JSON.stringify(ctx.isSubscribed));
        }
        if (ctx?.name) localStorage.setItem('userName', ctx.name);
        if (ctx?.email) localStorage.setItem('userEmail', ctx.email);
        if (ctx?.role) localStorage.setItem('userRole', ctx.role.toLowerCase());
      } catch (e) {
        console.warn('Failed to load user context:', e);
        // silent fail, keep minimal header
      }
    })();
  }, [isLoggedIn, location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    navigate('/login');
  };

  const handleDashboard = () => {
    setShowProfileMenu(false);
    if (userRole === 'caregiver') {
      navigate('/caregiver-dashboard');
    } else {
      navigate('/user-dashboard');
    }
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-sky-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="text-sm font-semibold">800-CARENET (227-3638)</span>
          </div>
          <div className="flex gap-3">
            <a href="#" className="hover:text-sky-200 transition">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-sky-200 transition">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-sky-200 transition">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-sky-200 transition">
              <Youtube className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-sky-200 transition">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-sky-600">CareNet</h1>
                <p className="text-xs text-gray-500">Professional Care Services</p>
              </div>
            </button>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => navigate('/')}
                className={`font-medium transition ${
                  isActive('/') ? 'text-sky-600' : 'text-gray-700 hover:text-sky-600'
                }`}
              >
                Home
              </button>
              
              {/* Services Link - Hide for caregivers */}
              {userRole !== 'caregiver' && (
                <button 
                  onClick={() => navigate('/service')} 
                  className={`font-medium transition ${
                    isActive('/service') ? 'text-sky-600' : 'text-gray-700 hover:text-sky-600'
                  }`}
                >
                  Services
                </button>
              )}

              {/* Activity Link - Only show when logged in */}
              {isLoggedIn && (
                <button 
                  onClick={() => {
                    if (userRole === 'caregiver') {
                      navigate('/caregiver-activity');
                    } else {
                      navigate('/user-activity');
                    }
                  }}
                  className={`font-medium transition ${
                    (isActive('/user-activity') || isActive('/caregiver-activity')) 
                      ? 'text-sky-600' 
                      : 'text-gray-700 hover:text-sky-600'
                  }`}
                >
                  Activity
                </button>
              )}
              
              <button 
                onClick={() => scrollToSection('contact')} 
                className="text-gray-700 hover:text-sky-600 font-medium transition"
              >
                Contact
              </button>
              
              <button 
                onClick={() => scrollToSection('about')} 
                className="text-gray-700 hover:text-sky-600 font-medium transition"
              >
                About Us
              </button>

              {/* Login Button or Profile Dropdown */}
              {!isLoggedIn ? (
                <button 
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-medium shadow-sm"
                >
                  Login
                </button>
              ) : (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(userContext?.avatar && userContext.avatar.substring(0,2)) || (userContext?.name?.[0]?.toUpperCase()) || (localStorage.getItem('userName')?.[0]?.toUpperCase()) || 'U'}
                    </div>
                    {/* Name + Premium */}
                    <span className="text-sm font-semibold text-gray-800 hidden sm:inline">
                      {userContext?.name || localStorage.getItem('userName') || 'User'}
                    </span>
                    {(userContext?.isSubscribed || JSON.parse(localStorage.getItem('isSubscribed') || 'false')) && (
                      <span className="hidden sm:inline-flex items-center justify-center w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-sm" title="Premium Member">
                        <Crown className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <button
                        onClick={handleDashboard}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-sky-50 flex items-center gap-3 transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-600" />
                        Dashboard
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

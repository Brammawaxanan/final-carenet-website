import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import PublicNavigation from "./components/PublicNavigation";

// Home Page
import HomePage from "./pages/HomePage";

// Auth Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
// Use the new Carenet caregiver application form if present
import CaregiverApplicationPage from "./pages/CaregiverApplicationPage";
import CaregiverApplicationForm from "./components/carnet/pages/CaregiverApplicationForm";

// Service Pages
import ServicePage from "./pages/ServicePage";
import SubscribePage from "./pages/SubscribePage";

// Activity Pages
import UserActivityPage from "./pages/UserActivityPage";
import CaregiverActivityPage from "./pages/CaregiverActivityPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import ProofGalleryPage from "./pages/ProofGalleryPage";

// Dashboard Pages
import UserDashboardPage from "./pages/UserDashboardPage";
import CaregiverDashboardPage from "./pages/CaregiverDashboardPage";

// Profile Pages
import UserProfilePage from "./pages/UserProfilePage";
import CaregiverProfilePage from "./pages/CaregiverProfilePage";
import CaregiverPublicProfilePage from "./pages/CaregiverPublicProfilePage";

// Payment Pages
import SmartPaymentPage from "./pages/SmartPaymentPage";
import BillingHistoryPage from "./pages/BillingHistoryPage";
import SavedCardsManager from "./components/SavedCardsManager";

// Admin Pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminTaskManagementPage from "./pages/AdminTaskManagementPage";
import ReportsPage from "./pages/ReportsPage";

// Admin Reviews
import ReviewsPage from "./admin/pages/ReviewsPage";

// New Admin Dashboard
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboardOverview from "./admin/pages/AdminDashboardOverview";
import UserManagement from "./admin/pages/UserManagement";
import CaregiverManagement from "./admin/pages/CaregiverManagement";
import ServiceRequests from "./admin/pages/ServiceRequests";
import PaymentManagement from "./admin/pages/PaymentManagement";
import ReportsAnalytics from "./admin/pages/ReportsAnalytics";
import SecurityPanel from "./admin/pages/SecurityPanel";
import SystemSettings from "./admin/pages/SystemSettings";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages (standalone with own navigation) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/service" element={<ServicePage />} />
        
        {/* Auth routes (no navigation) */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/caregiver-application" element={<CaregiverApplicationForm />} />
  <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* All other routes (with PublicNavigation) */}
        <Route path="/*" element={
          <div className="min-h-screen bg-white">
            <PublicNavigation />
            <main className="max-w-7xl mx-auto px-4 py-8">
              <Routes>
                {/* Dashboards */}
                <Route path="/home" element={<Navigate to="/" replace />} />

                {/* Dashboards */}
                <Route path="/user-dashboard" element={<UserDashboardPage />} />
                <Route path="/caregiver-dashboard" element={<CaregiverDashboardPage />} />

                {/* Subscription */}
                <Route path="/subscribe" element={<SubscribePage />} />

                {/* Activity Pages */}
                <Route path="/user-activity/:assignmentId?" element={<UserActivityPage />} />
                <Route path="/caregiver-activity/:assignmentId?" element={<CaregiverActivityPage />} />
                <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
                <Route path="/proof-gallery" element={<ProofGalleryPage />} />

                {/* Profile Pages */}
                <Route path="/user-profile" element={<UserProfilePage />} />
                <Route path="/caregiver-profile" element={<CaregiverProfilePage />} />
                <Route path="/caregivers/:caregiverId" element={<CaregiverPublicProfilePage />} />

                {/* Payment Pages */}
                <Route path="/payment/:bookingId" element={<SmartPaymentPage />} />
                <Route path="/billing-history" element={<BillingHistoryPage />} />
                <Route path="/saved-cards" element={<SavedCardsManager />} />

                {/* Old Admin Pages (keep for backwards compatibility) */}
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </main>
          </div>
        } />

        {/* New Admin Dashboard Routes with AdminLayout */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboardOverview />} />
              <Route path="/dashboard" element={<AdminDashboardOverview />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/caregivers" element={<CaregiverManagement />} />
              <Route path="/requests" element={<ServiceRequests />} />
              <Route path="/tasks" element={<AdminTaskManagementPage />} />
              <Route path="/payments" element={<PaymentManagement />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/reports" element={<ReportsAnalytics />} />
              <Route path="/security" element={<SecurityPanel />} />
              <Route path="/settings" element={<SystemSettings />} />
            </Routes>
          </AdminLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
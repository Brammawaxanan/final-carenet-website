import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../../src/services/api';
import { errorUtils } from '../utils/helpers';
import jsPDF from 'jspdf';

function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    activeCaregivers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter applications based on search term and status
  useEffect(() => {
    let filtered = applications;

    // Filter by search term (name, email, application ID)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.applicationId.toLowerCase().includes(searchLower) ||
        app.phone.toLowerCase().includes(searchLower) ||
        app.location.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter.toUpperCase());
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch all caregivers data
      const caregiverResponse = await adminService.getCaregivers();
      const caregivers = caregiverResponse.data;
      
      // Transform backend data to frontend format
      const transformedApplications = caregivers.map(caregiver => ({
        id: caregiver.id,
        applicationId: `APP-${new Date().getFullYear()}-${String(caregiver.id).padStart(3, '0')}`,
        firstName: caregiver.firstName || 'N/A',
        lastName: caregiver.lastName || 'N/A',
        name: `${caregiver.firstName} ${caregiver.lastName}`,
        email: caregiver.email || 'N/A',
        phone: caregiver.phone || 'N/A',
        status: caregiver.status || 'PENDING',
        appliedDate: caregiver.createdAt ? new Date(caregiver.createdAt).toLocaleDateString() : 'N/A',
        experience: caregiver.experience || 'N/A',
        location: caregiver.address || 'N/A',
        documents: caregiver.documents || [],
        availability: caregiver.availability || 'N/A',
        certifications: caregiver.certifications || 'N/A',
        emergencyContact: caregiver.emergencyContact || 'N/A',
        caregiverType: caregiver.caregiverType || 'HUMAN_CARE'
      }));

      setApplications(transformedApplications);

      // Calculate real statistics
      const calculatedStats = {
        totalApplications: caregivers.length,
        pendingReview: caregivers.filter(c => 
          c.status === 'PENDING' || 
          c.status === 'UNDER_REVIEW' || 
          c.status === 'PENDING_DOCUMENTS'
        ).length,
        approved: caregivers.filter(c => 
          c.status === 'APPROVED' || 
          c.status === 'VERIFIED'
        ).length,
        rejected: caregivers.filter(c => c.status === 'REJECTED').length,
        activeCaregivers: caregivers.filter(c => 
          c.status === 'VERIFIED' || 
          c.status === 'APPROVED'
        ).length
      };

      setStats(calculatedStats);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (caregiverId, newStatus) => {
    try {
      console.log(`Attempting to change status of caregiver ${caregiverId} to ${newStatus}`);
      
      if (newStatus === 'APPROVED' || newStatus === 'VERIFIED') {
        console.log('Calling verifyCaregiver');
        await adminService.verifyCaregiver(caregiverId);
      } else if (newStatus === 'REJECTED') {
        console.log('Calling rejectCaregiver');
        await adminService.rejectCaregiver(caregiverId);
      } else {
        console.log('Calling updateCaregiverStatus');
        await adminService.updateCaregiverStatus(caregiverId, newStatus);
      }
      
      console.log('Status change successful, refreshing data');
      // Refresh data after status change
      await fetchDashboardData();
      
      // Show success message
      alert(`Application status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(errorUtils.getErrorMessage(err));
    }
  };

  const handleDeleteApplication = async (caregiverId, caregiverName) => {
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the application for ${caregiverName}? This action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      await adminService.deleteCaregiver(caregiverId);
      
      // Refresh data after deletion
      await fetchDashboardData();
      
      // Show success message
      alert(`Application for ${caregiverName} has been deleted successfully`);
    } catch (err) {
      console.error('Error deleting application:', err);
      setError(errorUtils.getErrorMessage(err));
    }
  };

  const handleViewDetails = (application) => {
    console.log('View details for:', application);
    console.log('Documents in application:', application.documents);
    setSelectedApplication(application);
    setShowDocumentsModal(true);
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      console.log('Downloading document:', { documentId, fileName });
      
      const response = await adminService.downloadDocument(documentId);
      console.log('Download response:', response);
      
      // Get the content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Create blob with proper content type
      const blob = new Blob([response.data], { type: contentType });
      console.log('Created blob:', { size: blob.size, type: blob.type });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `document_${documentId}`;
      
      // Ensure link is visible for some browsers
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download initiated successfully');
    } catch (err) {
      console.error('Error downloading document:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 404) {
        alert('Document not found or has been deleted');
      } else if (err.response?.status === 500) {
        alert('Server error occurred while downloading document');
      } else {
        alert(`Failed to download document: ${err.message}`);
      }
    }
  };

  const closeModal = () => {
    setShowDocumentsModal(false);
    setSelectedApplication(null);
  };

  const handleDocumentStatusChange = async (documentId, newStatus) => {
    try {
      await adminService.updateFileStatus(documentId, newStatus);
      
      // Immediately update the document status in the modal
      const updatedApplication = { ...selectedApplication };
      const updatedDocuments = updatedApplication.documents.map(doc => 
        doc.id === documentId ? { ...doc, status: newStatus } : doc
      );
      updatedApplication.documents = updatedDocuments;
      
      // If a document was rejected, the entire application will be automatically rejected
      if (newStatus === 'REJECTED') {
        updatedApplication.status = 'REJECTED';
      }
      
      setSelectedApplication(updatedApplication);
      
      // Also refresh the main data in background
      fetchDashboardData();
      
      if (newStatus === 'REJECTED') {
        alert(`Document rejected. The entire application has been automatically rejected.`);
      } else {
        alert(`Document status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating document status:', err);
      alert('Failed to update document status');
    }
  };

  const canApproveApplication = (application) => {
    if (!application.documents || application.documents.length === 0) {
      return false;
    }
    return application.documents.every(doc => doc.status === 'APPROVED');
  };

  const handleApplicationApprove = async (applicationId) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!canApproveApplication(application)) {
        alert('All documents must be individually approved before approving the application.');
        return;
      }
      
      await adminService.verifyCaregiver(applicationId);
      
      // Update the application status in both the selected application and the main list
      setSelectedApplication(prev => ({ ...prev, status: 'APPROVED' }));
      fetchDashboardData();
      
      alert('Application approved successfully!');
    } catch (err) {
      console.error('Error approving application:', err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Failed to approve application. Please ensure all documents are approved first.');
      }
    }
  };

  const handleApplicationReject = async (applicationId) => {
    if (!window.confirm('Are you sure you want to reject this entire application?')) {
      return;
    }
    
    try {
      await adminService.rejectCaregiver(applicationId);
      
      // Update the application status in both the selected application and the main list
      setSelectedApplication(prev => ({ ...prev, status: 'REJECTED' }));
      fetchDashboardData();
      
      alert('Application rejected successfully.');
    } catch (err) {
      console.error('Error rejecting application:', err);
      alert('Failed to reject application.');
    }
  };

  const generateReportData = (type) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter applications by date range based on report type
    let filteredApplications = applications;
    if (type === 'monthly') {
      filteredApplications = applications.filter(app => {
        const appDate = new Date(app.appliedDate);
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
      });
    } else if (type === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredApplications = applications.filter(app => {
        const appDate = new Date(app.appliedDate);
        return appDate >= oneWeekAgo;
      });
    }

    // Calculate metrics
    const metrics = {
      totalApplications: filteredApplications.length,
      pendingApplications: filteredApplications.filter(app => 
        app.status === 'PENDING' || app.status === 'UNDER_REVIEW'
      ).length,
      approvedApplications: filteredApplications.filter(app => 
        app.status === 'APPROVED' || app.status === 'VERIFIED'
      ).length,
      rejectedApplications: filteredApplications.filter(app => 
        app.status === 'REJECTED'
      ).length,
      documentsTotal: filteredApplications.reduce((total, app) => 
        total + (app.documents?.length || 0), 0
      ),
      documentsApproved: filteredApplications.reduce((total, app) => 
        total + (app.documents?.filter(doc => doc.status === 'APPROVED').length || 0), 0
      ),
      documentsRejected: filteredApplications.reduce((total, app) => 
        total + (app.documents?.filter(doc => doc.status === 'REJECTED').length || 0), 0
      ),
      averageProcessingTime: calculateAverageProcessingTime(filteredApplications),
      statusBreakdown: getStatusBreakdown(filteredApplications),
      monthlyTrends: getMonthlyTrends(applications)
    };

    return { metrics, applications: filteredApplications };
  };

  const calculateAverageProcessingTime = (apps) => {
    const processedApps = apps.filter(app => 
      app.status === 'APPROVED' || app.status === 'REJECTED'
    );
    
    if (processedApps.length === 0) return 'N/A';
    
    const totalDays = processedApps.reduce((total, app) => {
      const applied = new Date(app.appliedDate);
      const now = new Date();
      const diffTime = Math.abs(now - applied);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return total + diffDays;
    }, 0);
    
    return Math.round(totalDays / processedApps.length);
  };

  const getStatusBreakdown = (apps) => {
    const breakdown = {};
    apps.forEach(app => {
      breakdown[app.status] = (breakdown[app.status] || 0) + 1;
    });
    return breakdown;
  };

  const getMonthlyTrends = (apps) => {
    const trends = {};
    apps.forEach(app => {
      const monthYear = new Date(app.appliedDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      trends[monthYear] = (trends[monthYear] || 0) + 1;
    });
    return trends;
  };

  const downloadReport = (reportData, type) => {
    const { metrics, applications: reportApps } = reportData;
    const currentDate = new Date().toLocaleDateString();
    
    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - (2 * margin);
    
    // Helper function to add text and manage page breaks
    const addText = (text, size = 12, isBold = false, indent = 0) => {
      if (yPosition > 270) { // Near bottom of page
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(size);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.text(text, margin + indent, yPosition);
      yPosition += size * 0.8;
    };

    // Helper function to add a line
    const addLine = () => {
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    };

    // Title and Header
    addText('CARENET ADMIN REPORT', 20, true);
    addText(`Report Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`, 14, true);
    addText(`Generated on: ${currentDate}`, 12);
    yPosition += 10;
    addLine();
    
    // Summary Metrics
    addText('SUMMARY METRICS', 16, true);
    addText(`Total Applications: ${metrics.totalApplications}`, 12);
    addText(`Pending Applications: ${metrics.pendingApplications}`, 12);
    addText(`Approved Applications: ${metrics.approvedApplications}`, 12);
    addText(`Rejected Applications: ${metrics.rejectedApplications}`, 12);
    addText(`Total Documents: ${metrics.documentsTotal}`, 12);
    addText(`Approved Documents: ${metrics.documentsApproved}`, 12);
    addText(`Rejected Documents: ${metrics.documentsRejected}`, 12);
    addText(`Average Processing Time: ${metrics.averageProcessingTime} days`, 12);
    yPosition += 10;
    
    // Status Breakdown
    addText('STATUS BREAKDOWN', 16, true);
    Object.entries(metrics.statusBreakdown).forEach(([status, count]) => {
      addText(`${status}: ${count}`, 12, false, 10);
    });
    yPosition += 10;
    
    // Monthly Trends
    addText('MONTHLY TRENDS', 16, true);
    Object.entries(metrics.monthlyTrends).forEach(([month, count]) => {
      addText(`${month}: ${count} applications`, 12, false, 10);
    });
    yPosition += 15;
    
    // Detailed Application List
    addText('DETAILED APPLICATION LIST', 16, true);
    reportApps.forEach((app, index) => {
      if (yPosition > 230) { // Check for space before adding application block
        doc.addPage();
        yPosition = 20;
      }
      
      addText(`${index + 1}. ${app.firstName} ${app.lastName}`, 12, true);
      addText(`ID: ${app.applicationId}`, 10, false, 15);
      addText(`Email: ${app.email}`, 10, false, 15);
      addText(`Status: ${app.status}`, 10, false, 15);
      addText(`Applied: ${app.appliedDate}`, 10, false, 15);
      addText(`Documents: ${app.documents?.length || 0}`, 10, false, 15);
      addText(`Location: ${app.location}`, 10, false, 15);
      yPosition += 5;
    });
    
    // Save the PDF
    doc.save(`CareNet_${type}_Report_${currentDate.replace(/\//g, '-')}.pdf`);
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      // Ensure we have fresh data
      await fetchDashboardData();
      
      // Generate report data
      const reportData = generateReportData(reportType);
      
      // Download the report
      downloadReport(reportData, reportType);
      
      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
      setShowReportModal(false);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const openReportModal = () => {
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportType('summary');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': 
      case 'PENDING_DOCUMENTS': 
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': 
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED': 
      case 'VERIFIED': 
        return 'bg-green-100 text-green-800';
      case 'REJECTED': 
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PENDING_DOCUMENTS': return 'Pending Documents';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'APPROVED': return 'Approved';
      case 'VERIFIED': return 'Verified';
      case 'REJECTED': return 'Rejected';
      default: return status || 'Unknown';
    }
  };

  const getCaregiverTypeDisplay = (type) => {
    switch (type) {
      case 'ELDER_CARE':
        return { icon: '🧓', name: 'Elder Care', color: 'bg-blue-100 text-blue-800' };
      case 'CHILD_CARE':
        return { icon: '👶', name: 'Child Care', color: 'bg-green-100 text-green-800' };
      case 'PET_CARE':
        return { icon: '🐾', name: 'Pet Care', color: 'bg-purple-100 text-purple-800' };
      case 'HUMAN_CARE':
        return { icon: '👩‍⚕️', name: 'Human Care (Legacy)', color: 'bg-gray-100 text-gray-800' };
      default:
        return { icon: '📋', name: 'Care', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👨‍💼 Admin Dashboard</h1>
              <p className="text-gray-600">Manage caregiver applications and system</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                disabled={loading}
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">❌</span>
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    📊
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    ⏳
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingReview}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    ✅
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-600">
                    ❌
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    👩‍⚕️
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Caregivers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeCaregivers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Applications ({filteredApplications.length} of {applications.length})
                  </h3>
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleString()}
                  </div>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name, email, ID, phone, or location..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    {(searchTerm || statusFilter !== 'all') && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {filteredApplications.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No Matching Applications' : 'No Applications Found'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search criteria or filters.' 
                      : 'No caregiver applications have been submitted yet.'}
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Application ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Care Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documents
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{app.name}</div>
                              <div className="text-sm text-gray-500">{app.email}</div>
                              <div className="text-sm text-gray-500">{app.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {app.applicationId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const typeInfo = getCaregiverTypeDisplay(app.caregiverType);
                              return (
                                <div className="flex items-center">
                                  <span className="text-xl mr-2">{typeInfo.icon}</span>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
                                    {typeInfo.name}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {app.experience}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {app.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="text-blue-600 font-medium">{app.documents.length}</span>
                              <span className="text-gray-500 ml-1">files</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                              {getStatusText(app.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {app.appliedDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleViewDetails(app)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => handleDeleteApplication(app.id, app.firstName + ' ' + app.lastName)}
                                className="text-red-700 hover:text-red-900 font-semibold"
                                title="Delete Application"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick Actions */}
        {!loading && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Generate Reports</h4>
              <p className="text-gray-600 mb-4">Create detailed reports on application metrics.</p>
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                onClick={openReportModal}
              >
                Generate Report
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Documents Modal */}
      {showDocumentsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Documents for {selectedApplication.firstName} {selectedApplication.lastName}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Application Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Application Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {selectedApplication.firstName} {selectedApplication.lastName}</div>
                <div><strong>Email:</strong> {selectedApplication.email}</div>
                <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                <div><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedApplication.status)}`}>
                    {getStatusText(selectedApplication.status)}
                  </span>
                </div>
                <div><strong>Experience:</strong> {selectedApplication.experience}</div>
                <div><strong>Certifications:</strong> {selectedApplication.certifications}</div>
                <div><strong>Availability:</strong> {selectedApplication.availability}</div>
                <div><strong>Applied on:</strong> {selectedApplication.appliedDate}</div>
                <div><strong>Care Type:</strong> 
                  <span className="ml-2">
                    {(() => {
                      const typeInfo = getCaregiverTypeDisplay(selectedApplication.caregiverType);
                      return (
                        <span className="flex items-center">
                          <span className="text-lg mr-2">{typeInfo.icon}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
                            {typeInfo.name}
                          </span>
                        </span>
                      );
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Uploaded Documents ({selectedApplication.documents?.length || 0})
              </h3>
              
              {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                <div className="space-y-3">
                  {selectedApplication.documents.map((document, index) => (
                    <div key={document.id || index} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-500">
                            {document.type?.includes('pdf') ? '📄' : 
                             document.type?.includes('image') ? '🖼️' : 
                             document.type?.includes('word') ? '📝' : '📁'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {document.fileName || document.name || `Document ${index + 1}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {document.type || 'Unknown type'} • 
                              {document.status && (
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                  document.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                  document.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {document.status}
                                </span>
                              )}
                            </p>
                            {document.createdAt && (
                              <p className="text-xs text-gray-400">
                                Uploaded: {new Date(document.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownloadDocument(document.id, document.fileName)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
                          disabled={!document.id}
                        >
                          {document.id ? 'Download' : 'No ID'}
                        </button>
                        
                        {document.status !== 'APPROVED' && document.id && (
                          <button
                            onClick={() => handleDocumentStatusChange(document.id, 'APPROVED')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm"
                          >
                            Approve
                          </button>
                        )}
                        
                        {document.status !== 'REJECTED' && document.id && (
                          <button
                            onClick={() => handleDocumentStatusChange(document.id, 'REJECTED')}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No documents uploaded yet</p>
                </div>
              )}
            </div>

            {/* Application Status and Actions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Application Status</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                    {getStatusText(selectedApplication.status)}
                  </span>
                  {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {selectedApplication.documents.filter(doc => doc.status === 'APPROVED').length} / {selectedApplication.documents.length} documents approved
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {selectedApplication.status !== 'APPROVED' && selectedApplication.status !== 'VERIFIED' && (
                    <button 
                      onClick={() => handleApplicationApprove(selectedApplication.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canApproveApplication(selectedApplication)}
                      title={!canApproveApplication(selectedApplication) ? "All documents must be individually approved before approving the application" : "Approve application"}
                    >
                      Approve Application
                    </button>
                  )}
                  {selectedApplication.status !== 'REJECTED' && (
                    <button 
                      onClick={() => handleApplicationReject(selectedApplication.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Reject Application
                    </button>
                  )}
                </div>
              </div>
              
              {selectedApplication.documents && selectedApplication.documents.length > 0 && !canApproveApplication(selectedApplication) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> To approve this application, all documents must be individually reviewed and approved first.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Generate Report
              </h2>
              <button
                onClick={closeReportModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="summary">Summary Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="detailed">Detailed Report</option>
              </select>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Report Preview</h3>
              <div className="text-sm text-gray-600">
                {reportType === 'summary' && 'Complete overview of all applications and documents'}
                {reportType === 'weekly' && 'Applications and activities from the last 7 days'}
                {reportType === 'monthly' && 'Current month applications and statistics'}
                {reportType === 'detailed' && 'Comprehensive report with all application details'}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                • Application statistics
                • Document status breakdown
                • Processing time analysis
                • Monthly trends
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={closeReportModal}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                disabled={reportLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                disabled={reportLoading}
              >
                {reportLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate & Download'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

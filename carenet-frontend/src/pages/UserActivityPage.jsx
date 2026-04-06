import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Clock, CheckCircle, AlertCircle, Plus, DollarSign, Calendar, FileText, FileDown } from "lucide-react";
import TaskCard from "../components/TaskCard";
import ProgressChart from "../components/ProgressChart";
import PaymentSummary from "../components/payments/PaymentSummary";
import TaskModal from "../components/TaskModal";
import ApiService from "../services/api";

export default function UserActivityPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  // Initialize from URL param, localStorage, or null
  const [currentAssignmentId, setCurrentAssignmentId] = useState(() => {
    if (assignmentId) return parseInt(assignmentId);
    const cached = localStorage.getItem('userCurrentAssignmentId');
    return cached ? parseInt(cached) : null;
  });
  
  const [activityData, setActivityData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => { 
    fetchAssignments();
    fetchUserPremiumStatus();
    
    // Check if coming from a fresh booking
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('booking') === 'success') {
      setShowBookingSuccess(true);
      setTimeout(() => setShowBookingSuccess(false), 5000);
    }
  }, []);
  
  // Fetch activity and persist assignment ID
  useEffect(() => {
    if (currentAssignmentId) {
      fetchActivity(currentAssignmentId);
      localStorage.setItem('userCurrentAssignmentId', currentAssignmentId.toString());
      
      if (!assignmentId || parseInt(assignmentId) !== currentAssignmentId) {
        navigate(`/user-activity/${currentAssignmentId}`, { replace: true });
      }
    }
  }, [currentAssignmentId]);

  const fetchAssignments = async () => {
    try {
      console.log('Fetching assignments...');
      const userId = localStorage.getItem('userId');
      console.log('Current user ID:', userId);
      
      const data = await ApiService.getMyAssignments();
      console.log('Assignments received:', data);
      console.log('Number of assignments:', data?.length || 0);
      
      // Sort assignments by createdAt (newest first) to show latest bookings first
      const sortedAssignments = (data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log('Sorted assignments (newest first):', sortedAssignments.map(a => ({id: a.id, created: a.createdAt})));
      
      setAssignments(sortedAssignments);
      
      // Smart assignment selection
      if (sortedAssignments && sortedAssignments.length > 0) {
        if (!currentAssignmentId) {
          // Check if cached assignment still exists
          const cachedId = localStorage.getItem('userCurrentAssignmentId');
          const cachedExists = cachedId && sortedAssignments.some(a => a.id === parseInt(cachedId));
          
          if (cachedExists) {
            console.log('✅ Restoring cached assignment:', cachedId);
            setCurrentAssignmentId(parseInt(cachedId));
          } else {
            // Default to newest assignment
            console.log('✅ Setting current assignment to NEWEST:', sortedAssignments[0].id);
            setCurrentAssignmentId(sortedAssignments[0].id);
          }
        }
      } else {
        console.warn('No assignments found for this user');
        setLoading(false);
      }
    } catch (e) { 
      console.error('Error fetching assignments:', e);
      setAssignments([]);
      setLoading(false); // Stop loading on error
    }
  };

  const fetchUserPremiumStatus = async () => {
    try {
      console.log('Fetching user premium status...');
      const dashboardData = await ApiService.getDashboard();
      const premium = dashboardData?.user?.isPremium || false;
      setIsPremium(premium);
      console.log('User premium status:', premium ? 'PREMIUM ✅' : 'NORMAL');
    } catch (error) {
      console.error('Error fetching premium status:', error);
      setIsPremium(false); // Default to non-premium on error
    }
  };

  const fetchActivity = async (id) => {
    try {
      console.log('Fetching activity for assignment:', id);
      setLoading(true);
      const data = await ApiService.getActivityOverview(id);
      console.log('Activity data received:', data);
      setActivityData(data);
    } catch (error) {
      console.error('Error fetching activity:', error);
      setActivityData(null);
    } finally { 
      console.log('Setting loading to false');
      setLoading(false); 
    }
  };

  const handleTaskCreate = () => {
    // Check if assignment is completed
    if (activityData?.assignment?.status === 'COMPLETED') {
      alert('❌ Cannot create tasks.\n\nThis assignment has been marked as completed.');
      return;
    }
    setSelectedTask(null);
    setShowTaskModal(true);
  };
  
  const handleTaskEdit = (task) => {
    // Check if assignment is completed
    if (activityData?.assignment?.status === 'COMPLETED') {
      alert('❌ Cannot edit tasks.\n\nThis assignment has been marked as completed.');
      return;
    }
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSave = async (taskData) => {
    try {
      if (selectedTask) await ApiService.updateTask(selectedTask.id, taskData);
      else await ApiService.createTask({ ...taskData, assignmentId: currentAssignmentId });
      setShowTaskModal(false);
      fetchActivity(currentAssignmentId);
    } catch { alert("Error saving task"); }
  };

  const handleTaskDelete = async (taskId) => { await ApiService.deleteTask(taskId); fetchActivity(currentAssignmentId); };
  const handleTaskVerify = async (taskId) => { await ApiService.verifyTask(taskId); fetchActivity(currentAssignmentId); };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const assignmentId = activityData?.assignment?.id;
      if (!assignmentId) {
        alert('No assignment found to generate report');
        return;
      }

      const pdf = await ApiService.generateTaskReport(assignmentId);
      
      // Create a blob and download
      const blob = new Blob([pdf], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-report-${assignmentId}-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleMarkAllCompleted = async () => {
    try {
      const assignmentId = activityData?.assignment?.id;
      if (!assignmentId) {
        alert('No assignment found');
        return;
      }

      const confirmComplete = window.confirm(
        'Are you sure you want to complete this assignment?\n\n' +
        '⚠️ Once completed:\n' +
        '• You cannot create new tasks\n' +
        '• The caregiver will be notified via email\n' +
        '• The assignment will be marked as finished'
      );

      if (!confirmComplete) return;

      // Call the complete assignment endpoint
      await ApiService.completeAssignment(assignmentId);
      
      alert('✅ Assignment completed successfully!\nThe caregiver has been notified via email.');
      
      // Refresh both assignments and activity data to update UI
      fetchAssignments();
      fetchActivity(assignmentId);
    } catch (error) {
      console.error('Error completing assignment:', error);
      alert('Failed to complete assignment. Please try again.');
    }
  };

  if (!currentAssignmentId && !loading) {
    const userId = localStorage.getItem('userId');
    
    const switchToWorkingClient = () => {
      localStorage.setItem('userId', '30'); // Client with assignment 13
      localStorage.setItem('userRole', 'client');
      window.location.reload();
    };
    
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <Calendar className="w-12 h-12 text-pale-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-pale-900 mb-2">No Active Assignment</h3>
        <p className="text-pale-600 mb-4">Please book a caregiver to start tracking tasks.</p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800 mb-2">
            <strong>Debug Info:</strong>
          </p>
          <p className="text-sm text-amber-700">
            {userId ? `Logged in as user ID: ${userId}` : 'No user ID found'}
          </p>
          <p className="text-sm text-amber-700">
            Assignments found: {assignments.length}
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">
            <strong>💡 For Testing:</strong> Switch to a client who has active bookings
          </p>
          <button
            onClick={switchToWorkingClient}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Switch to Client with Booking
          </button>
          <p className="text-xs text-blue-600 mt-2">
            (This will switch to client ID 30 who has assignment 13 with 5 tasks)
          </p>
        </div>
      </div>
    );
  }
  if (loading) return <div className="flex items-center justify-center min-h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-8">
      {/* Booking Success Banner */}
      {showBookingSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm animate-fade-in">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Booking Successful! 🎉</h3>
              <p className="text-green-700">Your task has been added and is ready to track below.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-pale-900">
                Assignment #{currentAssignmentId}
                {activityData?.assignment?.serviceType && (
                  <span className="text-lg text-pale-600 font-normal ml-2">
                    • {activityData.assignment.serviceType}
                  </span>
                )}
              </h1>
              <p className="text-pale-600">
                {activityData?.caregiverName ? (
                  <>
                    <User className="w-4 h-4 inline mr-1" />
                    Caregiver: <span className="font-semibold text-primary-600">{activityData.caregiverName}</span>
                  </>
                ) : (
                  'Track your caregiver\'s progress and manage tasks'
                )}
              </p>
            </div>
          </div>
          {assignments.length > 1 && (
            <select value={currentAssignmentId} onChange={(e) => setCurrentAssignmentId(e.target.value)}
              className="px-4 py-2 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
              {assignments.map((a) => <option key={a.id} value={a.id}>Assignment #{a.id}</option>)}
            </select>
          )}
        </div>

        {activityData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{activityData.counts.verified}</div>
              <div className="text-pale-600">Completed Tasks</div>
            </div>
            <div className="text-center">
              <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{activityData.counts.awaitingProof}</div>
              <div className="text-pale-600">Awaiting Proof</div>
            </div>
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">Rs. {((activityData.runningDueCents || 0) / 100).toFixed(2)}</div>
              <div className="text-pale-600">Amount Due</div>
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-pale-900">Tasks</h2>
              {!isPremium && (
                <p className="text-sm text-amber-600 mt-1">
                  📋 View-only mode • Upgrade to Premium to manage tasks
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Generate Report Button */}
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-4 h-4" />
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>
              
              {isPremium && activityData?.assignment?.status !== 'COMPLETED' && (
                <button onClick={handleTaskCreate} className="btn-primary flex items-center  space-x-2">
                  <Plus className="w-4 h-4 " /> <span>Add Task</span>
                </button>
              )}
              
              {activityData?.assignment?.status === 'COMPLETED' && (
                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <span className="font-medium">✓ Assignment Completed</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {activityData?.tasks?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                role="user"
                isSubscribed={isPremium}
                onEdit={isPremium ? () => handleTaskEdit(task) : undefined}
                onDelete={isPremium ? () => handleTaskDelete(task.id) : undefined}
                onVerify={isPremium ? () => handleTaskVerify(task.id) : undefined}
              />
            ))}
            {(!activityData?.tasks || activityData.tasks.length === 0) && (
              <div className="text-center py-12 bg-pale-50 rounded-lg border-2 border-dashed border-pale-200">
                <FileText className="w-12 h-12 text-pale-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-pale-900 mb-2">No tasks yet</h3>
                {isPremium ? (
                  <>
                    <p className="text-pale-600 mb-4">Create your first task to get started</p>
                    <button onClick={handleTaskCreate} className="btn-primary">Create Task</button>
                  </>
                ) : (
                  <p className="text-pale-600">No tasks available. Upgrade to Premium to create tasks.</p>
                )}
              </div>
            )}
            
            {/* Assignment Completed Button - Only for Subscriber Clients with Active Assignments */}
            {isPremium && 
             activityData?.tasks && 
             activityData.tasks.length > 0 && 
             activityData?.assignment?.status !== 'COMPLETED' && (
              <div className="pt-4 border-t border-pale-200">
                <button
                  onClick={handleMarkAllCompleted}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Assignment Completed</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {activityData && (
            <ProgressChart
              total={activityData.counts.total}
              completed={activityData.counts.verified}
              progress={activityData.progressPercent}
            />
          )}
          {activityData?.assignment?.bookingId && (
            <PaymentSummary 
              bookingId={activityData.assignment.bookingId} 
              role="CLIENT" 
            />
          )}
        </div>
      </div>

      {showTaskModal && (
        <TaskModal task={selectedTask} onSave={handleTaskSave} onClose={() => setShowTaskModal(false)} />
      )}
    </div>
  );
}
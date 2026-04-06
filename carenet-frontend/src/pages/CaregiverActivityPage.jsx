import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Clock, CheckCircle, DollarSign, Calendar, FileText, Upload, Filter, FileDown } from "lucide-react";
import TaskCard from "../components/TaskCard";
import ProgressChart from "../components/ProgressChart";
import PaymentSummary from "../components/payments/PaymentSummary";
import ApiService from "../services/api";

export default function CaregiverActivityPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  // Initialize from URL param, localStorage, or null
  const [currentAssignmentId, setCurrentAssignmentId] = useState(() => {
    if (assignmentId) return parseInt(assignmentId);
    const cached = localStorage.getItem('caregiverCurrentAssignmentId');
    return cached ? parseInt(cached) : null;
  });
  
  const [activityData, setActivityData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('all'); // 'all' or clientId
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => { fetchAssignments(); }, []);
  
  // Fetch activity when assignment ID changes
  useEffect(() => {
    if (currentAssignmentId) {
      fetchActivity(currentAssignmentId);
      // Save to localStorage for persistence
      localStorage.setItem('caregiverCurrentAssignmentId', currentAssignmentId.toString());
      
      // Update URL if needed (without reloading page)
      if (!assignmentId || parseInt(assignmentId) !== currentAssignmentId) {
        navigate(`/caregiver-activity/${currentAssignmentId}`, { replace: true });
      }
    }
  }, [currentAssignmentId]);

  const fetchAssignments = async () => {
    try {
      console.log('🔧 [Caregiver] Fetching caregiver assignments...');
      const userId = localStorage.getItem('userId');
      console.log('🔧 [Caregiver] Current caregiver user ID:', userId);
      
      const data = await ApiService.getMyCaregiverAssignments();
      console.log('🔧 [Caregiver] Assignments received:', data);
      console.log('🔧 [Caregiver] Number of assignments:', data?.length || 0);
      
      // Sort assignments by createdAt (newest first) to show latest bookings first
      const sortedAssignments = (data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log('🔧 [Caregiver] Sorted assignments (newest first):', sortedAssignments.map(a => ({id: a.id, created: a.createdAt})));
      
      setAssignments(sortedAssignments);
      
      // Smart assignment selection
      if (sortedAssignments && sortedAssignments.length > 0) {
        // If no current assignment selected, pick one
        if (!currentAssignmentId) {
          // Check if cached assignment still exists
          const cachedId = localStorage.getItem('caregiverCurrentAssignmentId');
          const cachedExists = cachedId && sortedAssignments.some(a => a.id === parseInt(cachedId));
          
          if (cachedExists) {
            console.log('🔧 [Caregiver] Restoring cached assignment:', cachedId);
            setCurrentAssignmentId(parseInt(cachedId));
          } else {
            // Default to newest assignment
            console.log('🔧 [Caregiver] Setting current assignment to NEWEST:', sortedAssignments[0].id);
            setCurrentAssignmentId(sortedAssignments[0].id);
          }
        }
      } else {
        console.warn('⚠️ [Caregiver] No assignments found for this caregiver');
        setLoading(false);
      }
    } catch (e) {
      console.error('❌ [Caregiver] Error fetching assignments:', e);
      setAssignments([]);
      setLoading(false);
    }
  };

  const fetchActivity = async (id) => {
    try {
      console.log('🔧 [Caregiver] Fetching activity for assignment:', id);
      setLoading(true);
      const data = await ApiService.getActivityOverview(id);
      console.log('🔧 [Caregiver] Activity data received:', data);
      console.log('🔧 [Caregiver] Tasks:', data?.tasks?.length || 0);
      setActivityData(data);
    } catch (error) {
      console.error('❌ [Caregiver] Error fetching activity:', error);
      setActivityData(null);
    } finally {
      console.log('🔧 [Caregiver] Setting loading to false');
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId) => { await ApiService.completeTask(taskId); fetchActivity(currentAssignmentId); };

  const handleProofUpload = async (taskId, file) => {
    try {
      console.log('📤 Starting proof upload for task:', taskId);
      console.log('📤 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 FormData created, calling API...');
      const result = await ApiService.uploadTaskProof(taskId, formData);
      console.log('✅ Upload result:', result);
      
      alert('✅ Proof uploaded successfully!');
      fetchActivity(currentAssignmentId);
    } catch (error) {
      console.error('❌ Error uploading proof:', {
        message: error.message,
        error: error,
        taskId,
        fileName: file?.name
      });
      alert(`❌ Failed to upload proof: ${error.message || 'Please try again.'}`);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const caregiverId = localStorage.getItem('userId');
      const blob = await ApiService.generateCaregiverReport(caregiverId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `caregiver-activity-report-${caregiverId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('✅ Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('❌ Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Get unique clients from assignments
  const getUniqueClients = () => {
    const clientMap = new Map();
    assignments.forEach(assignment => {
      if (assignment.clientId && assignment.clientName) {
        if (!clientMap.has(assignment.clientId)) {
          clientMap.set(assignment.clientId, {
            id: assignment.clientId,
            name: assignment.clientName
          });
        }
      }
    });
    return Array.from(clientMap.values());
  };

  // Get filtered assignments based on selected client
  const getFilteredAssignments = () => {
    if (selectedClient === 'all') {
      return assignments;
    }
    return assignments.filter(a => a.clientId === parseInt(selectedClient));
  };

  const uniqueClients = getUniqueClients();
  const filteredAssignments = getFilteredAssignments();
  const showClientFilter = uniqueClients.length > 1;

  if (!currentAssignmentId && !loading) {
    const userId = localStorage.getItem('userId');
    
    const switchToWorkingCaregiver = () => {
      localStorage.setItem('userId', '15'); // Caregiver with assignment 13
      localStorage.setItem('userRole', 'caregiver');
      window.location.reload();
    };
    
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <Calendar className="w-12 h-12 text-pale-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-pale-900 mb-2">No Active Assignment</h3>
        <p className="text-pale-600 mb-4">This caregiver has not accepted any bookings yet.</p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800 mb-2">
            <strong>Debug Info:</strong>
          </p>
          <p className="text-sm text-amber-700">
            {userId ? `Logged in as caregiver ID: ${userId}` : 'No user ID found'}
          </p>
          <p className="text-sm text-amber-700">
            Assignments found: {assignments.length}
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">
            <strong>💡 For Testing:</strong> Switch to a caregiver who has active assignments
          </p>
          <button
            onClick={switchToWorkingCaregiver}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Switch to Caregiver with Assignment
          </button>
          <p className="text-xs text-blue-600 mt-2">
            (This will switch to caregiver ID 15 who has assignment 13 with 5 tasks)
          </p>
        </div>
      </div>
    );
  }
  if (loading) return <div className="flex items-center justify-center min-h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-8">
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
                {activityData?.clientName ? (
                  <>
                    <User className="w-4 h-4 inline mr-1" />
                    A Client: <span className="font-semibold text-primary-600">{activityData.clientName}</span>
                  </>
                ) : (
                  'Complete tasks and upload proof for verification'
                )}
              </p>
            </div>
          </div>
          {assignments.length > 1 && (
            <select 
              value={currentAssignmentId} 
              onChange={(e) => setCurrentAssignmentId(parseInt(e.target.value))}
              className="px-4 py-2 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assignment #{a.id}
                </option>
              ))}
            </select>
          )}
        </div>

        {activityData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{activityData.counts.completed}</div>
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
            <h2 className="text-xl font-semibold text-pale-900">Tasks</h2>
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
          <div className="space-y-4">
            {activityData?.tasks?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                role="caregiver"
                onComplete={() => handleTaskComplete(task.id)}
                onUploadProof={(tid, file) => handleProofUpload(tid, file)}
              />
            ))}
            {(!activityData?.tasks || activityData.tasks.length === 0) && (
              <div className="text-center py-12 bg-pale-50 rounded-lg border-2 border-dashed border-pale-200">
                <FileText className="w-12 h-12 text-pale-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-pale-900 mb-2">No tasks yet</h3>
                <p className="text-pale-600">Tasks assigned by the user will appear here.</p>
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
              role="CAREGIVER" 
            />
          )}
        </div>
      </div>
    </div>
  );
}
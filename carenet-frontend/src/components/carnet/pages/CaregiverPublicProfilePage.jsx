import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Briefcase, Shield, Calendar, CheckCircle, Clock } from 'lucide-react';
import PublicNavigation from '../components/PublicNavigation';
import ApiService from '../services/api';

const CaregiverPublicProfilePage = () => {
  const { caregiverId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [caregiver, setCaregiver] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    fetchCaregiverProfile();
  }, [caregiverId]);

  const fetchCaregiverProfile = async () => {
    try {
      console.log('Fetching caregiver profile for ID:', caregiverId);
      const data = await ApiService.getCaregiverProfile(caregiverId);
      console.log('Caregiver profile data:', data);
      
      setCaregiver(data.caregiver || null);
      setAssignments(data.assignments || []);
      setIsSubscribed(data.isSubscribed || false);
    } catch (error) {
      console.error('Error fetching caregiver profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    // Navigate to booking page with caregiver data
    navigate(`/booking/${caregiverId}`, { 
      state: { 
        caregiver: caregiver 
      } 
    });
  };

  if (loading) {
    return (
      <>
        <PublicNavigation />
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  if (!caregiver) {
    return (
      <>
        <PublicNavigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-pale-900 mb-4">Caregiver Not Found</h2>
          <p className="text-pale-600 mb-6">The caregiver you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/service')} className="btn-primary">
            Back to Service Page
          </button>
        </div>
      </>
    );
  }

  const skills = caregiver.skills ? caregiver.skills.split(',').map(s => s.trim()) : [];
  const serviceTypes = caregiver.serviceTypes ? caregiver.serviceTypes.split(',').map(s => s.trim()) : [];
  const hourlyRate = caregiver.hourlyRateCents ? (caregiver.hourlyRateCents / 100).toFixed(2) : 'N/A';

  return (
    <>
      <PublicNavigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary-600 text-3xl font-bold shadow-lg">
                  {caregiver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{caregiver.name}</h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold">{caregiver.rating || 'N/A'}</span>
                      <span className="ml-1 opacity-90">({caregiver.reviewCount || 0} reviews)</span>
                    </div>
                    {caregiver.verified && (
                      <div className="flex items-center bg-green-500 px-3 py-1 rounded-full text-sm">
                        <Shield className="w-4 h-4 mr-1" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-white/90">
                <div className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  {caregiver.experience || 0} years experience
                </div>
                {caregiver.lat && caregiver.lng && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Available in your area
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold mb-2">Rs {hourlyRate}/hr</div>
              <button 
                onClick={handleBookNow}
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-pale-50 transition-colors shadow-lg"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="card">
              <h2 className="text-2xl font-bold text-pale-900 mb-4">About {caregiver.name}</h2>
              <p className="text-pale-700 leading-relaxed">
                {caregiver.bio || 'This caregiver has not provided a bio yet.'}
              </p>
            </div>

            {/* Skills Section */}
            {skills.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-pale-900 mb-4">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service Types */}
            {serviceTypes.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-pale-900 mb-4">Service Types</h2>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assignments History */}
            {assignments.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-pale-900 mb-4">
                  Work History ({assignments.length} assignments)
                </h2>
                <div className="space-y-4">
                  {assignments.slice(0, 5).map((assignment) => {
                    const totalTasks = assignment.taskCount || 0;
                    const completedTasks = assignment.tasks?.filter(
                      t => ['COMPLETED', 'VERIFIED', 'LOCKED'].includes(t.status)
                    ).length || 0;
                    
                    return (
                      <div
                        key={assignment.id}
                        className="border border-pale-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-pale-900">
                              {assignment.serviceType || 'Service Assignment'}
                            </h3>
                            <p className="text-sm text-pale-600">
                              Client: {assignment.clientName}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            assignment.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700'
                              : assignment.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-pale-100 text-pale-700'
                          }`}>
                            {assignment.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-pale-600 mt-3">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            {completedTasks}/{totalTasks} tasks completed
                          </div>
                          {assignment.startedAt && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Started {new Date(assignment.startedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {assignments.length > 5 && (
                  <p className="text-sm text-pale-600 mt-4 text-center">
                    + {assignments.length - 5} more assignments
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="card bg-gradient-to-br from-pale-50 to-white">
              <h3 className="font-bold text-pale-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-pale-600">Rating</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-semibold">{caregiver.rating || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pale-600">Reviews</span>
                  <span className="font-semibold">{caregiver.reviewCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pale-600">Experience</span>
                  <span className="font-semibold">{caregiver.experience || 0} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pale-600">Assignments</span>
                  <span className="font-semibold">{assignments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pale-600">Verified</span>
                  <span className={`font-semibold ${caregiver.verified ? 'text-green-600' : 'text-pale-400'}`}>
                    {caregiver.verified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Availability Card */}
            <div className="card bg-primary-50">
              <div className="flex items-center mb-3">
                <Clock className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="font-bold text-primary-900">Availability</h3>
              </div>
              <p className="text-sm text-primary-700 mb-4">
                Contact this caregiver to check their current availability.
              </p>
              <button 
                onClick={handleBookNow}
                className="w-full btn-primary"
              >
                Book an Appointment
              </button>
            </div>

            {/* Subscription Banner */}
            {!isSubscribed && (
              <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <h3 className="font-bold text-yellow-900 mb-2">
                  Unlock Premium Features
                </h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Subscribe to access unlimited bookings, priority support, and exclusive caregivers.
                </p>
                <button 
                  onClick={() => navigate('/subscribe')}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  Subscribe Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CaregiverPublicProfilePage;

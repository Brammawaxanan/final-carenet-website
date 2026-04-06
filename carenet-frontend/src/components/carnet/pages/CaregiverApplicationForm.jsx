import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Alert, LoadingSpinner } from '../components/UI';
import FileUploader from '../components/FileUploader';
import ApiService from '../../../../src/services/api';
// lightweight validation helpers (inlined because carnet package helpers are not available)
const validationUtils = {
  validateRequired(fields) {
    const errs = {};
    Object.keys(fields).forEach(k => {
      if (!fields[k]) errs[k] = 'This field is required';
    });
    return errs;
  },
  isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  },
  isValidDateOfBirth(d) {
    const date = new Date(d);
    return date instanceof Date && !isNaN(date) && date < new Date();
  }
}

const errorUtils = {
  // placeholder if other utilities were used elsewhere
}

function CaregiverApplicationForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [applicationResult, setApplicationResult] = useState({ type: '', message: '', applicationId: null });
  
  const [formData, setFormData] = useState({
    caregiverType: 'ELDER_CARE', // Default to elder care
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    ssn: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    experience: '',
    certifications: '',
    availability: '',
    specializations: '',
  });

  const [files, setFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      // Personal Information
      const requiredFields = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
      };
      
      Object.assign(errors, validationUtils.validateRequired(requiredFields));
      
      if (formData.email && !validationUtils.isValidEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      // Date of birth must be in the past
      if (formData.dateOfBirth && !validationUtils.isValidDateOfBirth(formData.dateOfBirth)) {
        errors.dateOfBirth = 'Date of birth must be a valid date in the past';
      }
    }
    
    if (step === 2) {
      // Address Information
      const requiredFields = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
      };
      
      Object.assign(errors, validationUtils.validateRequired(requiredFields));
      
      // Emergency contact phone validation is optional (no mandatory format requirement)
    }
    
    if (step === 3) {
      // Professional Information
      const requiredFields = {
        experience: formData.experience,
        availability: formData.availability,
      };
      
      Object.assign(errors, validationUtils.validateRequired(requiredFields));
    }
    
    if (step === 4) {
      // Check for required documents
      const requiredCategories = ['id', 'medical', 'license', 'background', 'training'];
      const uploadedCategories = files.map(f => f.category).filter(Boolean);
      const missingCategories = requiredCategories.filter(cat => !uploadedCategories.includes(cat));
      
      if (missingCategories.length > 0) {
        const categoryNames = {
          id: 'Government ID',
          medical: 'Medical Certificate', 
          license: 'Nursing License',
          background: 'Background Check',
          training: 'Training Certificates'
        };
        const missing = missingCategories.map(cat => categoryNames[cat]).join(', ');
        errors.documents = `Please upload the following required documents: ${missing}`;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if user is logged in. Support both legacy `user` JSON or token-based auth stored elsewhere.
      let user = null;
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        try { user = JSON.parse(rawUser); } catch { user = null }
      }
      if (!user && localStorage.getItem('token')) {
        // Build minimal user from known localStorage keys
        user = {
          id: localStorage.getItem('userId'),
          role: localStorage.getItem('userRole'),
          email: localStorage.getItem('userName')
        };
      }

      if (!user) {
        // Not logged in — send to login and preserve return location
        navigate('/login', { state: { from: '/caregiver-application' } });
        setLoading(false);
        return;
      }

      // Prepare application data
      const applicationData = {
        caregiverType: formData.caregiverType,
        email: formData.email, // Include the email from form
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        dateOfBirth: formData.dateOfBirth,
        ssn: formData.ssn,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        experience: formData.experience,
        certifications: formData.certifications,
        availability: formData.availability,
        specializations: formData.specializations
      };

      let result;
      if (files.length > 0) {
        const formDataMultipart = new FormData();
        formDataMultipart.append('applicationData', JSON.stringify(applicationData));
        files.forEach(fileObj => formDataMultipart.append('files', fileObj.file));

        try {
          result = await ApiService.applyCaregiverWithFiles(user.id, formDataMultipart);
        } catch (err) {
          console.error('Application submission error (with files):', err);
          const msg = err.message && err.message.includes('Failed to fetch') ? 'Network error: cannot reach the server (check backend).' : err.message;
          throw new Error(msg);
        }
      } else {
        try {
          result = await ApiService.applyCaregiver(applicationData);
        } catch (err) {
          console.error('Application submission error:', err);
          const msg = err.message && err.message.includes('Failed to fetch') ? 'Network error: cannot reach the server (check backend).' : err.message;
          throw new Error(msg);
        }
      }

      const applicationId = result.id;
      // After successful submission navigate to caregiver dashboard
      setApplicationResult({ type: 'success', message: result.message || 'Application received', applicationId });
      setShowResultModal(true);

    } catch (err) {
      console.error('Application submission error:', err);
      // Show error modal instead of setting error state
      setApplicationResult({
        type: 'error',
        message: err.message || 'Failed to submit application. Please try again.',
        applicationId: null
      });
      setShowResultModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const closeModal = () => {
    setShowResultModal(false);
    setApplicationResult({ type: '', message: '', applicationId: null });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information & Caregiver Type</h3>
            
            {/* Caregiver Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caregiver Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, caregiverType: 'ELDER_CARE'})}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.caregiverType === 'ELDER_CARE' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-3xl">🧓</span>
                    <div>
                      <h4 className="font-semibold">Elder Care</h4>
                      <p className="text-sm text-gray-600">Care for elderly individuals - assistance with daily activities, medical support, companionship</p>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, caregiverType: 'CHILD_CARE'})}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.caregiverType === 'CHILD_CARE' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-3xl">👶</span>
                    <div>
                      <h4 className="font-semibold">Child Care</h4>
                      <p className="text-sm text-gray-600">Care for children - babysitting, educational support, recreational activities, child development</p>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, caregiverType: 'PET_CARE'})}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.caregiverType === 'PET_CARE' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-3xl">🐾</span>
                    <div>
                      <h4 className="font-semibold">Pet Care</h4>
                      <p className="text-sm text-gray-600">Care for animals - pet sitting, dog walking, feeding, grooming, veterinary support</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={validationErrors.firstName}
                placeholder="Enter your first name"
              />
              <Input
                label="Last Name *"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={validationErrors.lastName}
                placeholder="Enter your last name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={validationErrors.email}
                placeholder="Enter your email address"
              />
              <Input
                label="Phone Number *"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                error={validationErrors.phone}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date of Birth *"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                error={validationErrors.dateOfBirth}
              />
              <Input
                label="Social Security Number"
                name="ssn"
                value={formData.ssn}
                onChange={handleInputChange}
                error={validationErrors.ssn}
                placeholder="Enter your SSN (optional)"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address & Emergency Contact</h3>
            
            <Input
              label="Street Address *"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              error={validationErrors.address}
              placeholder="Enter your street address"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City *"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                error={validationErrors.city}
                placeholder="Enter your city"
              />
              <Input
                label="State *"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                error={validationErrors.state}
                placeholder="Enter your state"
              />
              <Input
                label="ZIP Code *"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                error={validationErrors.zipCode}
                placeholder="Enter your ZIP code"
              />
            </div>

            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact Name *"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  error={validationErrors.emergencyContactName}
                  placeholder="Enter emergency contact name"
                />
                <Input
                  label="Emergency Contact Phone *"
                  name="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  error={validationErrors.emergencyContactPhone}
                  placeholder="Enter emergency contact phone"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience *
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  validationErrors.experience ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your caregiving experience, previous positions, and relevant background..."
              />
              {validationErrors.experience && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.experience}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certifications & Licenses
              </label>
              <textarea
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="List any relevant certifications, licenses, or training (CPR, CNA, HHA, etc.)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability *
              </label>
              <textarea
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  validationErrors.availability ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your availability (days, hours, flexible schedule, etc.)..."
              />
              {validationErrors.availability && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.availability}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specializations
              </label>
              <textarea
                name="specializations"
                value={formData.specializations}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any special areas of care (elderly, disabled, children, medical conditions, etc.)..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Upload Required Documents</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please upload all required documents to complete your application. Each document should be clear and readable.
            </p>

            {/* Document Upload Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Government ID */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">🆔</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Government ID Card <span className="text-red-500">*</span></h4>
                    <p className="text-sm text-gray-600">Valid driver's license, passport, or state ID</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB • PDF, JPG, PNG accepted</p>
                  </div>
                </div>
                <FileUploader
                  onFilesSelected={(selectedFiles) => {
                    const updatedFiles = files.filter(f => f.category !== 'id');
                    if (selectedFiles.length > 0) {
                      updatedFiles.push({ ...selectedFiles[0], category: 'id' });
                    }
                    setFiles(updatedFiles);
                  }}
                  maxFiles={1}
                  maxSizeMB={5}
                  allowedTypes={['pdf', 'jpg', 'jpeg', 'png']}
                />
              </div>

              {/* Medical Certificate */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">⚕️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Medical Certificate <span className="text-red-500">*</span></h4>
                    <p className="text-sm text-gray-600">Recent health clearance from licensed physician</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB • PDF, JPG, PNG accepted</p>
                  </div>
                </div>
                <FileUploader
                  onFilesSelected={(selectedFiles) => {
                    const updatedFiles = files.filter(f => f.category !== 'medical');
                    if (selectedFiles.length > 0) {
                      updatedFiles.push({ ...selectedFiles[0], category: 'medical' });
                    }
                    setFiles(updatedFiles);
                  }}
                  maxFiles={1}
                  maxSizeMB={5}
                  allowedTypes={['pdf', 'jpg', 'jpeg', 'png']}
                />
              </div>

              {/* Nursing License */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">👩‍⚕️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Nursing License <span className="text-red-500">*</span></h4>
                    <p className="text-sm text-gray-600">Valid nursing or healthcare professional license</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB • PDF, JPG, PNG accepted</p>
                  </div>
                </div>
                <FileUploader
                  onFilesSelected={(selectedFiles) => {
                    const updatedFiles = files.filter(f => f.category !== 'license');
                    if (selectedFiles.length > 0) {
                      updatedFiles.push({ ...selectedFiles[0], category: 'license' });
                    }
                    setFiles(updatedFiles);
                  }}
                  maxFiles={1}
                  maxSizeMB={5}
                  allowedTypes={['pdf', 'jpg', 'jpeg', 'png']}
                />
              </div>

              {/* Background Check */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">🔍</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Background Check <span className="text-red-500">*</span></h4>
                    <p className="text-sm text-gray-600">Criminal background verification report</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 10MB • PDF accepted</p>
                  </div>
                </div>
                <FileUploader
                  onFilesSelected={(selectedFiles) => {
                    const updatedFiles = files.filter(f => f.category !== 'background');
                    if (selectedFiles.length > 0) {
                      updatedFiles.push({ ...selectedFiles[0], category: 'background' });
                    }
                    setFiles(updatedFiles);
                  }}
                  maxFiles={1}
                  maxSizeMB={10}
                  allowedTypes={['pdf']}
                />
              </div>

              {/* Training Certificates */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">📜</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Training Certificates <span className="text-red-500">*</span></h4>
                    <p className="text-sm text-gray-600">CPR, First Aid, or specialized training certificates</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB • PDF, JPG, PNG accepted</p>
                  </div>
                </div>
                <FileUploader
                  onFilesSelected={(selectedFiles) => {
                    const updatedFiles = files.filter(f => f.category !== 'training');
                    if (selectedFiles.length > 0) {
                      updatedFiles.push({ ...selectedFiles[0], category: 'training' });
                    }
                    setFiles(updatedFiles);
                  }}
                  maxFiles={1}
                  maxSizeMB={5}
                  allowedTypes={['pdf', 'jpg', 'jpeg', 'png']}
                />
              </div>

              {/* Professional References */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">✍️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Professional References</h4>
                    <p className="text-sm text-gray-600">Letters of recommendation from previous employers</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB • PDF, DOC, TXT accepted</p>
                  </div>
                </div>
                <FileUploader
                  onFilesSelected={(selectedFiles) => {
                    const updatedFiles = files.filter(f => f.category !== 'references');
                    if (selectedFiles.length > 0) {
                      updatedFiles.push({ ...selectedFiles[0], category: 'references' });
                    }
                    setFiles(updatedFiles);
                  }}
                  maxFiles={1}
                  maxSizeMB={5}
                  allowedTypes={['pdf', 'doc', 'docx', 'txt']}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {files.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">📁 Uploaded Documents ({files.length})</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className="text-green-700">
                        {file.category ? `${file.category.charAt(0).toUpperCase() + file.category.slice(1)}: ` : ''}
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationErrors.documents && (
              <Alert type="error">
                {validationErrors.documents}
              </Alert>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Document Checklist:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">*</span>
                  <span>Government ID (Required)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">*</span>
                  <span>Medical Certificate (Required)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">*</span>
                  <span>Nursing License (Required)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">*</span>
                  <span>Background Check (Required)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">*</span>
                  <span>Training Certificates (Required)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">•</span>
                  <span>References (Optional)</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = (step) => {
    const titles = {
      1: 'Type & Personal Info',
      2: 'Address & Contact',
      3: 'Professional Details',
      4: 'Document Upload',
    };
    return titles[step] || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Caregiver Application</h1>
          <p className="text-lg text-gray-600 mt-2">Join our verified network of professional caregivers</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                <span className="text-xs text-gray-500 mt-2">{getStepTitle(step)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <Card>
          {error && (
            <Alert type="error" className="mb-6" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-6">
              {success}
            </Alert>
          )}

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep} disabled={loading}>
                  Previous
                </Button>
              )}
            </div>

            <div>
              {currentStep < 4 ? (
                <Button onClick={nextStep} disabled={loading}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={loading}>
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Result Modal */}
        {showResultModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center mb-4">
                  {applicationResult.type === 'success' ? (
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Application Submitted Successfully!</h3>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Application Submission Failed</h3>
                    </div>
                  )}
                </div>

                {/* Modal Content */}
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {applicationResult.message}
                  </p>
                  
                  {applicationResult.type === 'success' && applicationResult.applicationId && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Application ID:</span> {applicationResult.applicationId}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Please save this ID for your records. You can use it to track your application status.
                      </p>
                    </div>
                  )}

                  {applicationResult.type === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        Please try submitting your application again. If the problem persists, contact our support team.
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3">
                  {applicationResult.type === 'error' && (
                    <Button 
                      variant="outline" 
                      onClick={closeModal}
                      className="px-4 py-2"
                    >
                      Try Again
                    </Button>
                  )}
                  <Button 
                    onClick={handleGoHome}
                    className={`px-6 py-2 ${
                      applicationResult.type === 'success' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaregiverApplicationForm;
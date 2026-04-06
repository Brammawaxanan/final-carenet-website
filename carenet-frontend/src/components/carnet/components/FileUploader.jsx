import React, { useState, useCallback } from 'react';
import { Button, ProgressBar, Alert } from './UI';
// Inline lightweight file utility helpers (original helpers not present in this repo path)
const fileUtils = {
  validateFileSize(file, maxMB) {
    const sizeMB = file.size / (1024 * 1024);
    return sizeMB <= maxMB;
  },
  validateFileType(file, allowedTypes) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return allowedTypes.map(t => t.toLowerCase()).includes(ext);
  },
  generateFileId() {
    return Math.random().toString(36).slice(2, 9);
  },
  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

const FileUploader = ({ 
  onFilesSelected, 
  maxFiles = 10, 
  maxSizeMB = 10, 
  allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  className = '',
  onUploadStatusChange,
  showRemoveButton = true // New prop to control remove button visibility
}) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);

  const handleFiles = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const newErrors = [];
    const validFiles = [];

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    fileArray.forEach((file) => {
      // Validate file size
      if (!fileUtils.validateFileSize(file, maxSizeMB)) {
        newErrors.push(`${file.name}: File size exceeds ${maxSizeMB}MB`);
        return;
      }

      // Validate file type
      if (!fileUtils.validateFileType(file, allowedTypes)) {
        newErrors.push(`${file.name}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        return;
      }

      // Check for duplicate files
      if (files.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)) {
        newErrors.push(`${file.name}: File already selected`);
        return;
      }

      validFiles.push({
        file,
        id: fileUtils.generateFileId(),
        name: file.name,
        size: file.size,
        formattedSize: fileUtils.formatFileSize(file.size),
        type: file.type,
        status: 'ready', // ready, uploading, completed, error
      });
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    setErrors([]);
    
    // Don't call onFilesSelected here since useEffect will handle it
    // This prevents double calls
  }, [files, maxFiles, maxSizeMB, allowedTypes]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    
    // Remove upload progress for this file
    const newProgress = { ...uploadProgress };
    delete newProgress[fileId];
    setUploadProgress(newProgress);

    // onFilesSelected will be called by useEffect when files change
  };

  const updateFileStatus = (fileId, status, progress = 0) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId ? { ...file, status } : file
      )
    );

    if (status === 'uploading' && progress > 0) {
      setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
    } else if (status === 'completed' || status === 'error') {
      // Remove from upload progress when complete
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }

    // Notify parent component of status change
    if (onUploadStatusChange) {
      onUploadStatusChange(fileId, status, progress);
    }
  };

  // Expose updateFileStatus to parent component through callback
  React.useEffect(() => {
    if (onFilesSelected && typeof onFilesSelected === 'function') {
      // Check if onFilesSelected expects 2 parameters (new signature) or 1 (old signature)
      if (onFilesSelected.length === 1) {
        onFilesSelected(files);
      } else {
        onFilesSelected(files, updateFileStatus);
      }
    }
  }, [files]);

  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const iconClasses = "w-8 h-8 mx-auto mb-2";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
      return <div className={`${iconClasses} bg-blue-100 rounded flex items-center justify-center text-blue-600`}>📷</div>;
    }
    if (['pdf'].includes(ext)) {
      return <div className={`${iconClasses} bg-red-100 rounded flex items-center justify-center text-red-600`}>📄</div>;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <div className={`${iconClasses} bg-blue-100 rounded flex items-center justify-center text-blue-600`}>📝</div>;
    }
    return <div className={`${iconClasses} bg-gray-100 rounded flex items-center justify-center text-gray-600`}>📎</div>;
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          accept={allowedTypes.map(type => `.${type}`).join(',')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Maximum {maxFiles} files, up to {maxSizeMB}MB each
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported formats: {allowedTypes.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert type="error" className="mt-4">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Selected Files ({files.length}/{maxFiles})
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((fileData) => (
              <div key={fileData.id} className="bg-gray-50 rounded-lg p-4 relative">
                {/* Remove Button - only show if showRemoveButton is true */}
                {showRemoveButton && (
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                )}

                {/* File Icon */}
                {getFileIcon(fileData)}

                {/* File Info */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 truncate" title={fileData.name}>
                    {fileData.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {fileData.formattedSize}
                  </p>
                </div>

                {/* Status */}
                <div className="mt-3">
                  {fileData.status === 'ready' && (
                    <div className="text-xs text-gray-500 text-center">Ready to upload</div>
                  )}
                  
                  {fileData.status === 'uploading' && (
                    <div className="space-y-2">
                      <div className="text-xs text-blue-600 text-center">Uploading...</div>
                      <ProgressBar progress={uploadProgress[fileData.id] || 0} />
                    </div>
                  )}
                  
                  {fileData.status === 'completed' && (
                    <div className="text-xs text-green-600 text-center">✓ Uploaded</div>
                  )}
                  
                  {fileData.status === 'error' && (
                    <div className="text-xs text-red-600 text-center">✗ Failed</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;

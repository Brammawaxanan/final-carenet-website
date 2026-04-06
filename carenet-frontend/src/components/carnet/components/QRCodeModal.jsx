import React, { useState, useEffect } from 'react';

/*
Alternative version using local qrcode package (use after running npm install qrcode)
import QRCode from 'qrcode';
*/

const QRCodeModal = ({ isOpen, onClose, caregiverData }) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');

  useEffect(() => {
    if (isOpen && caregiverData) {
      generateQRCode();
    }
  }, [isOpen, caregiverData]);

  const generateQRCode = async () => {
    try {
      const qrData = {
        name: caregiverData.name,
        caregiverId: caregiverData.id,
        careType: caregiverData.careType,
        email: caregiverData.email,
        registrationDate: caregiverData.registrationDate,
        service:"Temp"

      };

      const qrString = JSON.stringify(qrData);
      
      // Use QR Server API as a temporary solution until qrcode package is installed
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
      setQrCodeDataURL(qrApiUrl);

      /*
      // Alternative version using local qrcode package
      const dataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataURL(dataURL);
      */
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = async () => {
    if (qrCodeDataURL) {
      try {
        const response = await fetch(qrCodeDataURL);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `caregiver-qr-${caregiverData.name || 'unknown'}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading QR code:', error);
        alert('Failed to download QR code. Please try again.');
      }
    }

    /*
    // Alternative download function for local qrcode package
    const link = document.createElement('a');
    link.download = `caregiver-qr-${caregiverData.name}.png`;
    link.href = qrCodeDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    */
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Caregiver QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="text-center mb-6">
          {qrCodeDataURL && (
            <img 
              src={qrCodeDataURL} 
              alt="Caregiver QR Code"
              className="mx-auto mb-4 border rounded"
            />
          )}
          
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {caregiverData?.name}</p>
            <p><strong>ID:</strong> {caregiverData?.id}</p>
            <p><strong>Care Type:</strong> {caregiverData?.careType}</p>
            <p><strong>Email:</strong> {caregiverData?.email}</p>
            <p><strong>Registration Date:</strong> {caregiverData?.registrationDate}</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={downloadQRCode}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Download QR Code
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
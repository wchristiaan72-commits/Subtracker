import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, CheckCircle, ArrowLeft, Lock, Zap } from 'lucide-react';

export default function Scan() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Premium Gatekeeper
  if (user?.tier !== 'premium' && user?.isAdmin !== 1) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 text-center p-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
            <Lock className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Premium Feature</h2>
          <p className="text-slate-500 mb-8">
            AI Receipt Scanning is exclusively available on the Premium tier. Upgrade to automatically extract and save subscriptions from your receipts.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 mb-4"
          >
            <Zap className="mr-2 h-5 w-5" />
            Upgrade to Premium
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG/PNG).');
      return;
    }

    setIsScanning(true);
    setError('');
    setSuccessData(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      
      try {
        const res = await fetch('/api/ai/scan-receipt', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSuccessData(data.subscription);
      } catch (err: any) {
        setError(err.message || 'Failed to scan receipt');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-slate-900 mb-1">AI Receipt Scanner</h3>
            <p className="text-sm text-slate-500 mb-6">
              Upload a receipt and our AI will automatically extract the service name, cost, and renewal date, then add it to your dashboard.
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {successData ? (
              <div className="text-center py-12 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Subscription Added!</h3>
                <div className="text-emerald-800 mb-6">
                  <p className="font-medium text-lg">{successData.service_name}</p>
                  <p>${successData.monthly_cost.toFixed(2)} / month</p>
                  <p className="text-sm opacity-80">Renews: {new Date(successData.renewal_date).toLocaleDateString()}</p>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => setSuccessData(null)}
                    className="inline-flex items-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-700 bg-transparent hover:bg-emerald-100"
                  >
                    Scan Another
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isScanning && fileInputRef.current?.click()}
                className={`mt-2 flex justify-center px-6 pt-16 pb-16 border-2 border-dashed rounded-xl transition-colors ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer'
                } ${isScanning ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <div className="space-y-4 text-center">
                  {isScanning ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="mx-auto h-12 w-12 text-indigo-500 animate-spin mb-4" />
                      <p className="text-lg font-medium text-indigo-600">AI is analyzing your receipt...</p>
                      <p className="text-sm text-slate-500 mt-1">This usually takes a few seconds.</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600 justify-center">
                        <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                          <span>Upload a file</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            accept="image/jpeg, image/png"
                            onChange={handleFileSelect}
                          />
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">PNG or JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

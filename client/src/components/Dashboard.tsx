import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

interface SystemStatus {
  server: string;
  timestamp: string;
  environment: string;
  circuit: {
    isSetup: boolean;
    missingFiles: string[];
    circuitsPath: string;
  };
  features: {
    proofVerification: boolean;
    jwtAuth: boolean;
    testProofGeneration: boolean;
  };
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.getStatus();
        setSystemStatus(response.data.status);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to fetch status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">ZeroGate Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="btn-outline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Authentication Status</h3>
              <p className="text-sm text-gray-500">Your current session information</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">Successfully Authenticated</span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">User ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Login Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user?.timestamp ? new Date(user.timestamp).toLocaleString() : 'Unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Proof Status</dt>
                      <dd className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="alert-success">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Zero-Knowledge Proof Verified
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your identity was proven without revealing your secret to anyone.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Status</h3>
              <p className="text-sm text-gray-500">Backend and circuit information</p>
            </div>
            <div className="card-content">
              {error ? (
                <div className="alert-error">
                  <p>{error}</p>
                </div>
              ) : systemStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Server Status</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{systemStatus.server}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Environment</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{systemStatus.environment}</dd>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Circom Circuit</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Circuit Setup</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          systemStatus.circuit.isSetup 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {systemStatus.circuit.isSetup ? '✓ Ready' : '✗ Not Setup'}
                        </span>
                      </div>
                      
                      {systemStatus.circuit.missingFiles.length > 0 && (
                        <div className="text-sm text-red-600">
                          Missing files: {systemStatus.circuit.missingFiles.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Features</h4>
                    <div className="space-y-2">
                      {Object.entries(systemStatus.features).map(([feature, enabled]) => (
                        <div key={feature} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {enabled ? '✓ Enabled' : '○ Disabled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(systemStatus.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Technical Details</h3>
              <p className="text-sm text-gray-500">How ZeroGate works</p>
            </div>
            <div className="card-content">
              <div className="prose max-w-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h4 className="mt-4 text-sm font-medium text-gray-900">Zero-Knowledge Proof</h4>
                    <p className="mt-2 text-sm text-gray-500">
                      Prove you know a secret without revealing it using zk-SNARKs and Groth16.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="mt-4 text-sm font-medium text-gray-900">Cryptographic Verification</h4>
                    <p className="mt-2 text-sm text-gray-500">
                      Server verifies your proof without ever seeing your secret password.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h4 className="mt-4 text-sm font-medium text-gray-900">Secure Authentication</h4>
                    <p className="mt-2 text-sm text-gray-500">
                      Get a JWT token for authenticated access after successful proof verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateProof, formatProofForSubmission, validateSecret, getPublicHash, getRegisteredUsers } from '../utils/snarkjs';

interface LoginProps {
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { login, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validate username
    if (!username || username.trim().length === 0) {
      setValidationError('Username cannot be empty');
      return;
    }
    
    // Check if user exists
    const publicHash = getPublicHash(username);
    if (!publicHash) {
      setValidationError('Username not found. Please register first.');
      return;
    }
    
    // Validate secret
    const validation = validateSecret(secret);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid secret');
      return;
    }
    setValidationError('');

    try {
      setIsGeneratingProof(true);
      
      // Generate proof using ZK-SNARK hash preimage circuit
      console.log('🔐 Generating zk-SNARK proof for hash preimage...');
      console.log('🔍 Using public hash:', publicHash);
      
      const zkProof = await generateProof(secret, publicHash);
      
      // Format proof for API - use the actual public signals from the proof
      const { proof, publicInputs } = formatProofForSubmission(zkProof);
      
      console.log('✅ Proof generated, submitting for verification...');
      console.log('🔍 Public inputs from proof:', publicInputs);
      console.log('🔍 Proof structure:', proof);
      
      // Submit proof for verification (using username and proof)
      await login(proof, publicInputs, username);
      
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setValidationError('Authentication failed. Please check your secret.');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const isLoading = loading || isGeneratingProof;
  const registeredUsers = getRegisteredUsers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center animation-pulse-glow">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            ZeroGate
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Prove you know the secret without revealing it
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <div className="card-content">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
                  Secret
                </label>
                <div className="mt-1">
                  <input
                    id="secret"
                    name="secret"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="input"
                    placeholder="Enter your secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {validationError && (
                  <p className="mt-2 text-sm text-red-600">{validationError}</p>
                )}
              </div>

              {/* Show registered users if any exist */}
              {registeredUsers.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Registered users:</p>
                  <p className="mt-1">{registeredUsers.join(', ')}</p>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="alert-error">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Authentication Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary h-12"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isGeneratingProof ? 'Generating Proof...' : 'Verifying...'}
                    </div>
                  ) : (
                    'Generate Proof & Login'
                  )}
                </button>
              </div>

              {/* Switch to Register */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  disabled={isLoading}
                >
                  Don't have an account? Register here
                </button>
              </div>

              {/* Info */}
              <div className="alert-info">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      How it works
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        We use zk-SNARKs to prove you know the secret that hashes to your stored public hash 
                        without revealing the secret to anyone. Your secret never leaves your browser.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Protected by zero-knowledge cryptography
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

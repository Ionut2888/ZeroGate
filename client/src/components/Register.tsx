import React, { useState } from 'react';
import { registerUser, validateSecret } from '../utils/snarkjs';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [error, setError] = useState('');
  const [publicHash, setPublicHash] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');
    
    // Validate username
    if (!username || username.trim().length === 0) {
      setValidationError('Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters long');
      return;
    }
    
    // Validate secret
    const secretValidation = validateSecret(secret);
    if (!secretValidation.isValid) {
      setValidationError(secretValidation.error || 'Invalid secret');
      return;
    }
    
    // Check if secrets match
    if (secret !== confirmSecret) {
      setValidationError('Secrets do not match');
      return;
    }

    try {
      setIsRegistering(true);
      
      console.log('🔐 Registering user with Poseidon hash...');
      
      // Register user (this will compute and store the public hash)
      const computedPublicHash = await registerUser(username, secret);
      setPublicHash(computedPublicHash);
      
      console.log('✅ Registration successful!');
      
      // Call success callback after a short delay to show the hash
      setTimeout(() => {
        onRegisterSuccess();
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Registration failed:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  // If registration was successful, show success screen
  if (publicHash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Success Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Registration Successful!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account has been created with zero-knowledge authentication
            </p>
          </div>

          {/* Success Info */}
          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm font-mono text-gray-900">{username}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Public Hash (Stored Securely)
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-xs font-mono text-gray-600 break-all">{publicHash}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This is the Poseidon hash of your secret. Only this hash is stored - your secret remains private.
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={onSwitchToLogin}
                  className="w-full btn-primary"
                >
                  Continue to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create ZeroGate Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Register with zero-knowledge authentication
          </p>
        </div>

        {/* Registration Form */}
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
                    disabled={isRegistering}
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
                    autoComplete="new-password"
                    required
                    className="input"
                    placeholder="Enter your secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-secret" className="block text-sm font-medium text-gray-700">
                  Confirm Secret
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-secret"
                    name="confirm-secret"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input"
                    placeholder="Confirm your secret"
                    value={confirmSecret}
                    onChange={(e) => setConfirmSecret(e.target.value)}
                    disabled={isRegistering}
                  />
                </div>
                {validationError && (
                  <p className="mt-2 text-sm text-red-600">{validationError}</p>
                )}
              </div>

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
                        Registration Failed
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
                  disabled={isRegistering}
                  className="w-full btn-primary h-12"
                >
                  {isRegistering ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Computing Poseidon Hash...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              {/* Switch to Login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-sm text-purple-600 hover:text-purple-500 font-medium"
                  disabled={isRegistering}
                >
                  Already have an account? Sign in
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
                      How registration works
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        We compute a Poseidon hash of your secret and store only that hash. 
                        Your actual secret never leaves your browser and is never stored anywhere.
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

export default Register;

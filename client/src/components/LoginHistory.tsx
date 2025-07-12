import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { LoginEntry, HistoryResponse } from '../types/loginHistory';

const LoginHistory: React.FC = () => {
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.getLoginHistory(20);
        const data: HistoryResponse = response.data;
        setHistory(data.history);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to fetch login history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Login History</h3>
          <p className="text-sm text-gray-500">Recent authentication attempts</p>
        </div>
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Login History</h3>
          <p className="text-sm text-gray-500">Recent authentication attempts</p>
        </div>
        <div className="card-content">
          <div className="alert-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Login History</h3>
        <p className="text-sm text-gray-500">Recent authentication attempts</p>
      </div>
      <div className="card-content">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No login history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg p-4 ${
                  entry.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        entry.success ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="font-medium">
                      {entry.success ? 'Successful Login' : 'Failed Login'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(entry.timestamp)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Username:</span>
                    <span className="ml-2 font-mono">{entry.username}</span>
                  </div>
                  {entry.ipAddress && (
                    <div>
                      <span className="text-gray-600">IP Address:</span>
                      <span className="ml-2 font-mono">{entry.ipAddress}</span>
                    </div>
                  )}
                </div>

                {entry.metrics && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h4 className="font-medium text-sm mb-2">Performance Metrics</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Verification Time:</span>
                        <span className="ml-2 font-mono text-blue-600">
                          {formatDuration(entry.metrics.verificationTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Proof Size:</span>
                        <span className="ml-2 font-mono text-green-600">
                          {formatBytes(entry.metrics.proofSize)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Public Inputs:</span>
                        <span className="ml-2 font-mono text-purple-600">
                          {entry.metrics.publicInputsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {entry.errorMessage && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                    <span className="text-sm text-red-800">{entry.errorMessage}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginHistory;

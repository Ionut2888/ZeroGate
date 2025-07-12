import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { LoginHistoryStats, StatsResponse } from '../types/loginHistory';

const LoginStats: React.FC = () => {
  const [stats, setStats] = useState<LoginHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getLoginStats();
        const data: StatsResponse = response.data;
        setStats(data.stats);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to fetch login statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Login Statistics</h3>
          <p className="text-sm text-gray-500">Your authentication metrics</p>
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
          <h3 className="text-lg font-medium text-gray-900">Login Statistics</h3>
          <p className="text-sm text-gray-500">Your authentication metrics</p>
        </div>
        <div className="card-content">
          <div className="alert-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Login Statistics</h3>
          <p className="text-sm text-gray-500">Your authentication metrics</p>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <p className="text-gray-500">No statistics available</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const successRate = stats.totalLogins > 0 
    ? ((stats.successfulLogins / stats.totalLogins) * 100).toFixed(1)
    : '0';

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Login Statistics</h3>
        <p className="text-sm text-gray-500">Your authentication metrics</p>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Login Counts */}
          <div className="text-center">
            <div className="bg-blue-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalLogins}</div>
              <div className="text-sm text-blue-800">Total Logins</div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-green-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.successfulLogins}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-red-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{stats.failedLogins}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
              <div className="text-sm text-purple-800">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {stats.averageVerificationTime > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Average Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-2 mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDuration(stats.averageVerificationTime)}
                    </div>
                    <div className="text-sm text-gray-600">Verification Time</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-full p-2 mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatBytes(stats.averageProofSize)}
                    </div>
                    <div className="text-sm text-gray-600">Proof Size</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-purple-500 rounded-full p-2 mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDuration(stats.averageGenerationTime)}
                    </div>
                    <div className="text-sm text-gray-600">Generation Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">First Login</div>
              <div className="text-md font-medium text-gray-900">{formatDate(stats.firstLogin)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Last Login</div>
              <div className="text-md font-medium text-gray-900">{formatDate(stats.lastLogin)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginStats;

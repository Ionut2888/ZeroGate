import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../utils/api';
import type { LoginEntry, MetricsResponse } from '../types/loginHistory';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MetricsCharts: React.FC = () => {
  const [metricsData, setMetricsData] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(7); // days

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.getMetricsHistory(timeRange);
        const data: MetricsResponse = response.data;
        setMetricsData(data.metricsHistory);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to fetch metrics data');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Performance Charts</h3>
          <p className="text-sm text-gray-500">Visualization of your authentication metrics</p>
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
          <h3 className="text-lg font-medium text-gray-900">Performance Charts</h3>
          <p className="text-sm text-gray-500">Visualization of your authentication metrics</p>
        </div>
        <div className="card-content">
          <div className="alert-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (metricsData.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Performance Charts</h3>
          <p className="text-sm text-gray-500">Visualization of your authentication metrics</p>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <p className="text-gray-500">No metrics data available for the selected time range</p>
            <div className="mt-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 3 months</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const labels = metricsData.map(entry => {
    const date = new Date(entry.timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const verificationTimes = metricsData.map(entry => entry.metrics?.verificationTime || 0);
  const proofSizes = metricsData.map(entry => entry.metrics?.proofSize || 0);
  const publicInputsCounts = metricsData.map(entry => entry.metrics?.publicInputsCount || 0);

  // Verification Time Chart
  const verificationTimeChart = {
    labels,
    datasets: [
      {
        label: 'Verification Time (ms)',
        data: verificationTimes,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  // Proof Size Chart
  const proofSizeChart = {
    labels,
    datasets: [
      {
        label: 'Proof Size (bytes)',
        data: proofSizes,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  };

  // Public Inputs Chart
  const publicInputsChart = {
    labels,
    datasets: [
      {
        label: 'Public Inputs Count',
        data: publicInputsCounts,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        display: true,
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Performance Charts</h3>
              <p className="text-sm text-gray-500">Visualization of your authentication metrics</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 3 months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verification Time Chart */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-md font-medium text-gray-900">Verification Time Trend</h4>
          <p className="text-sm text-gray-500">How quickly proofs are being verified over time</p>
        </div>
        <div className="card-content">
          <div style={{ height: '300px' }}>
            <Line data={verificationTimeChart} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Proof Size Chart */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-md font-medium text-gray-900">Proof Size Trend</h4>
          <p className="text-sm text-gray-500">Size of generated proofs over time</p>
        </div>
        <div className="card-content">
          <div style={{ height: '300px' }}>
            <Line data={proofSizeChart} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Public Inputs Chart */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-md font-medium text-gray-900">Public Inputs Distribution</h4>
          <p className="text-sm text-gray-500">Number of public inputs used in proofs</p>
        </div>
        <div className="card-content">
          <div style={{ height: '300px' }}>
            <Bar data={publicInputsChart} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-md font-medium text-gray-900">Period Summary</h4>
          <p className="text-sm text-gray-500">Statistics for the selected time range</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length)}ms
              </div>
              <div className="text-sm text-blue-800">Avg Verification</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(proofSizes.reduce((a, b) => a + b, 0) / proofSizes.length)} B
              </div>
              <div className="text-sm text-green-800">Avg Proof Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(publicInputsCounts.reduce((a, b) => a + b, 0) / publicInputsCounts.length)}
              </div>
              <div className="text-sm text-purple-800">Avg Public Inputs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metricsData.length}</div>
              <div className="text-sm text-orange-800">Total Logins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCharts;

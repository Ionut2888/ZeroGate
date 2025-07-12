export interface ProofMetrics {
  generationTime: number; // milliseconds
  verificationTime: number; // milliseconds
  proofSize: number; // bytes
  publicInputsCount: number;
  circuitConstraints?: number;
}

export interface LoginEntry {
  id: string;
  username: string;
  timestamp: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  metrics?: ProofMetrics;
  errorMessage?: string;
}

export interface LoginHistoryStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  averageGenerationTime: number;
  averageVerificationTime: number;
  averageProofSize: number;
  lastLogin: string;
  firstLogin: string;
}

export interface HistoryResponse {
  success: boolean;
  history: LoginEntry[];
  count: number;
}

export interface StatsResponse {
  success: boolean;
  stats: LoginHistoryStats;
}

export interface MetricsResponse {
  success: boolean;
  metricsHistory: LoginEntry[];
  count: number;
  period: string;
}

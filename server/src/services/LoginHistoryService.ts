import fs from 'fs/promises';
import path from 'path';
import { LoginEntry, LoginHistoryStats, ProofMetrics } from '../models/LoginHistory';

class LoginHistoryService {
  private historyFilePath: string;

  constructor() {
    this.historyFilePath = path.join(process.cwd(), 'data', 'login_history.json');
  }

  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(this.historyFilePath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private async loadHistory(): Promise<LoginEntry[]> {
    try {
      await this.ensureDataDirectory();
      const data = await fs.readFile(this.historyFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, return empty array
      return [];
    }
  }

  private async saveHistory(history: LoginEntry[]): Promise<void> {
    await this.ensureDataDirectory();
    await fs.writeFile(this.historyFilePath, JSON.stringify(history, null, 2));
  }

  async addLoginEntry(entry: Omit<LoginEntry, 'id' | 'timestamp'>): Promise<LoginEntry> {
    const history = await this.loadHistory();
    
    const newEntry: LoginEntry = {
      ...entry,
      id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    history.push(newEntry);
    
    // Keep only last 1000 entries per user to prevent unlimited growth
    const userHistory = history.filter(h => h.username === entry.username);
    if (userHistory.length > 1000) {
      const otherUsersHistory = history.filter(h => h.username !== entry.username);
      const recentUserHistory = userHistory.slice(-1000);
      await this.saveHistory([...otherUsersHistory, ...recentUserHistory]);
    } else {
      await this.saveHistory(history);
    }

    return newEntry;
  }

  async getUserHistory(username: string, limit = 50): Promise<LoginEntry[]> {
    const history = await this.loadHistory();
    return history
      .filter(entry => entry.username === username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getUserStats(username: string): Promise<LoginHistoryStats> {
    const history = await this.loadHistory();
    const userHistory = history.filter(entry => entry.username === username);

    if (userHistory.length === 0) {
      return {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        averageGenerationTime: 0,
        averageVerificationTime: 0,
        averageProofSize: 0,
        lastLogin: '',
        firstLogin: ''
      };
    }

    const successfulLogins = userHistory.filter(entry => entry.success);
    const failedLogins = userHistory.filter(entry => !entry.success);
    
    // Calculate averages for successful logins with metrics
    const loginsWithMetrics = successfulLogins.filter(entry => entry.metrics);
    
    const averageGenerationTime = loginsWithMetrics.length > 0 
      ? loginsWithMetrics.reduce((sum, entry) => sum + (entry.metrics?.generationTime || 0), 0) / loginsWithMetrics.length 
      : 0;
    
    const averageVerificationTime = loginsWithMetrics.length > 0 
      ? loginsWithMetrics.reduce((sum, entry) => sum + (entry.metrics?.verificationTime || 0), 0) / loginsWithMetrics.length 
      : 0;
    
    const averageProofSize = loginsWithMetrics.length > 0 
      ? loginsWithMetrics.reduce((sum, entry) => sum + (entry.metrics?.proofSize || 0), 0) / loginsWithMetrics.length 
      : 0;

    // Sort by timestamp to get first and last
    const sortedHistory = userHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      totalLogins: userHistory.length,
      successfulLogins: successfulLogins.length,
      failedLogins: failedLogins.length,
      averageGenerationTime: Math.round(averageGenerationTime),
      averageVerificationTime: Math.round(averageVerificationTime),
      averageProofSize: Math.round(averageProofSize),
      firstLogin: sortedHistory[0].timestamp,
      lastLogin: sortedHistory[sortedHistory.length - 1].timestamp
    };
  }

  async getMetricsHistory(username: string, days = 30): Promise<LoginEntry[]> {
    const history = await this.loadHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history
      .filter(entry => 
        entry.username === username && 
        entry.success && 
        entry.metrics &&
        new Date(entry.timestamp) >= cutoffDate
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}

export const loginHistoryService = new LoginHistoryService();

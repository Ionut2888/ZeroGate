import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from './logger';
const snarkjs = require('snarkjs');

const logger = createLogger();

/**
 * ZoKrates service for proof verification
 */
export class ZoKratesService {
  private circuitsPath: string;
  
  constructor() {
    // Use absolute path or relative to process.cwd() for better reliability
    this.circuitsPath = process.env.CIRCUITS_PATH || path.join(process.cwd(), '../circuits');
  }

  /**
   * Verify a zk-SNARK proof using snarkjs (Circom/Groth16)
   */
  async verifyProof(proof: any, publicInputs: string[]): Promise<boolean> {
    try {
      logger.info('🔍 Starting proof verification with snarkjs...');
      
      // Path to the verification key (from Circom circuit)
      const vkeyPath = path.join(this.circuitsPath, 'setup', 'simple_test_vkey.json');
      
      // Check if verification key exists
      try {
        await fs.access(vkeyPath);
      } catch (error) {
        logger.error('❌ Verification key not found. Circom circuit setup required.');
        throw new Error('Verification key not found. Circuit setup required.');
      }
      
      // Load verification key
      const vkeyContent = await fs.readFile(vkeyPath, 'utf8');
      const vkey = JSON.parse(vkeyContent);
      
      logger.info('� Verifying proof with snarkjs...');
      logger.info('🔍 Proof:', JSON.stringify(proof));
      logger.info('🔍 Public inputs:', JSON.stringify(publicInputs));
      
      // Verify proof using snarkjs
      const isValid = await snarkjs.groth16.verify(vkey, publicInputs, proof);
      
      logger.info(`✅ Proof verification result: ${isValid}`);
      return isValid;
    } catch (error: any) {
      logger.error('💥 Error verifying proof:', error.message);
      return false;
    }
  }

  /**
   * Generate a proof for testing purposes
   */
  async generateTestProof(secret: string): Promise<{ proof: any; publicInputs: string[] }> {
    try {
      logger.info('🧪 Generating test proof...');
      
      // Create temporary directory
      const tempDir = path.join(this.circuitsPath, 'temp');
      await this.ensureDirectoryExists(tempDir);
      
      // Compute witness
      const witnessCommand = `echo "${secret}" | zokrates compute-witness --stdin`;
      execSync(witnessCommand, { cwd: this.circuitsPath });
      
      // Generate proof
      execSync('zokrates generate-proof', { cwd: this.circuitsPath });
      
      // Read generated proof
      const proofPath = path.join(this.circuitsPath, 'proof.json');
      const proofData = await fs.readFile(proofPath, 'utf-8');
      const proof = JSON.parse(proofData);
      
      // Extract public inputs from proof
      const publicInputs = proof.inputs || [];
      
      logger.info('✅ Test proof generated successfully!');
      
      return { proof, publicInputs };
      
    } catch (error: any) {
      logger.error('💥 Error generating test proof:', error.message);
      throw new Error(`Test proof generation error: ${error.message}`);
    }
  }

  /**
   * Check if Circom circuit is properly set up
   */
  async isCircuitSetup(): Promise<boolean> {
    try {
      logger.info('🔍 Checking circuit setup...');
      logger.info('🔍 Circuits path:', this.circuitsPath);
      
      const requiredFiles = [
        'setup/simple_test_vkey.json',      // Verification key
        'setup/simple_test_0001.zkey',     // Proving key
        'build/simple_test_js/simple_test.wasm'  // WASM file
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(this.circuitsPath, file);
        logger.info(`🔍 Checking file: ${filePath}`);
        try {
          await fs.access(filePath);
          logger.info(`✅ File exists: ${file}`);
        } catch (error) {
          logger.error(`❌ File missing: ${file} at ${filePath}`);
          return false;
        }
      }
      
      logger.info('✅ All circuit files found');
      return true;
    } catch (error: any) {
      logger.error('❌ Circuit setup check failed:', error.message);
      return false;
    }
  }

  /**
   * Get circuit setup status
   */
  async getSetupStatus(): Promise<{
    isSetup: boolean;
    missingFiles: string[];
    circuitsPath: string;
  }> {
    const requiredFiles = [
      'setup/simple_test_vkey.json',      // Verification key
      'setup/simple_test_0001.zkey',     // Proving key  
      'build/simple_test_js/simple_test.wasm'  // WASM file
    ];
    
    const missingFiles: string[] = [];
    
    for (const file of requiredFiles) {
      try {
        const filePath = path.join(this.circuitsPath, file);
        await fs.access(filePath);
      } catch {
        missingFiles.push(file);
      }
    }
    
    return {
      isSetup: missingFiles.length === 0,
      missingFiles,
      circuitsPath: this.circuitsPath
    };
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanup(tempDir: string): Promise<void> {
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      logger.warn('⚠️ Failed to clean up temporary files:', error);
    }
  }
}

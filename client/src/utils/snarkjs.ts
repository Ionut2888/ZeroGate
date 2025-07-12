// Dynamic import of snarkjs to handle module compatibility issues
let snarkjsModule: any = null;

/**
 * Lazy load snarkjs module
 */
const getSnarkjs = async () => {
  if (!snarkjsModule) {
    try {
      // Try different import methods for compatibility
      snarkjsModule = await import('snarkjs');
      // If default export exists, use it, otherwise use the module itself
      snarkjsModule = snarkjsModule.default || snarkjsModule;
    } catch (error) {
      console.error('Failed to load snarkjs:', error);
      throw new Error('snarkjs module could not be loaded');
    }
  }
  return snarkjsModule;
};

/**
 * snarkjs integration utilities for browser-based zero-knowledge proof generation
 * 
 * This module provides a complete implementation of snarkjs integration for generating
 * and verifying zk-SNARKs in the browser using Circom circuits.
 * 
 * Features:
 * - Proof generation for hash preimage knowledge
 * - Proof verification
 * - Poseidon hash computation
 * - Circuit artifact management
 * 
 * Usage Example:
 * ```typescript
 * import { generateProof, verifyProof, getSnarkjsStatus } from './utils/snarkjs';
 * 
 * // Check if snarkjs is available
 * const status = await getSnarkjsStatus();
 * console.log('snarkjs available:', status.isAvailable);
 * 
 * // Generate a proof
 * const proof = await generateProof('my-secret');
 * console.log('Generated proof:', proof);
 * 
 * // Verify the proof
 * const isValid = await verifyProof(proof);
 * console.log('Proof is valid:', isValid);
 * ```
 */

// snarkjs proof interface
export interface SnarkProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

// Circuit artifacts cache
interface CircuitArtifacts {
  wasm?: ArrayBuffer;
  zkey?: ArrayBuffer;
  vkey?: object;
}

let circuitArtifacts: CircuitArtifacts = {};

/**
 * Load circuit artifacts (WASM, proving key, verification key)
 * Now loads REAL circuit artifacts for hash preimage circuit
 */
export const loadCircuitArtifacts = async (): Promise<void> => {
  try {
    console.log('🔧 Loading hash preimage circuit artifacts...');
    
    // Base URL for circuit artifacts - adjust this to your actual hosting
    const baseUrl = '/circuits';
    
    // Load WASM file for hash preimage circuit
    const wasmResponse = await fetch(`${baseUrl}/build/hash_preimage_js/hash_preimage.wasm`);
    if (!wasmResponse.ok) throw new Error('Failed to load hash preimage WASM file');
    circuitArtifacts.wasm = await wasmResponse.arrayBuffer();
    
    // Load proving key (zkey file) for hash preimage circuit
    const zkeyResponse = await fetch(`${baseUrl}/setup/hash_preimage_0001.zkey`);
    if (!zkeyResponse.ok) throw new Error('Failed to load hash preimage proving key');
    circuitArtifacts.zkey = await zkeyResponse.arrayBuffer();
    
    // Load verification key for hash preimage circuit
    const vkeyResponse = await fetch(`${baseUrl}/setup/verification_key.json`);
    if (!vkeyResponse.ok) throw new Error('Failed to load hash preimage verification key');
    circuitArtifacts.vkey = await vkeyResponse.json();
    
    console.log('✅ Hash preimage circuit artifacts loaded successfully!');
    console.log('📊 WASM size:', circuitArtifacts.wasm.byteLength, 'bytes');
    console.log('🔑 Proving key size:', circuitArtifacts.zkey.byteLength, 'bytes');
    console.log('📊 Verification key loaded');
    
  } catch (error) {
    console.error('❌ Failed to load hash preimage circuit artifacts:', error);
    throw new Error(`Hash preimage circuit artifacts loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert string to field element compatible with Circom
 */
export const stringToField = (input: string): string => {
  try {
    // Browser-compatible string to bytes conversion
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    
    // Convert bytes to hex string
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const bigintValue = BigInt('0x' + hex);
    
    // Ensure the value fits in the field (for BN254, field size is ~254 bits)
    const fieldSize = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
    const fieldValue = bigintValue % fieldSize;
    
    return fieldValue.toString();
  } catch (error) {
    console.error('String to field conversion failed:', error);
    // Fallback to simple conversion using char codes
    let result = BigInt(0);
    for (let i = 0; i < input.length; i++) {
      result = result * BigInt(256) + BigInt(input.charCodeAt(i));
    }
    
    // Ensure it fits in the field
    const fieldSize = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
    return (result % fieldSize).toString();
  }
};

/**
 * Compute Poseidon hash using snarkjs or fallback implementation
 */
export const poseidonHash = async (input: string): Promise<string> => {
  try {
    // Convert string to field element
    const fieldValue = stringToField(input);
    
    console.log('🔧 Computing Poseidon hash for field value:', fieldValue);
    
    // First, try using snarkjs built-in Poseidon if available
    try {
      const snarkjs = await getSnarkjs();
      if (snarkjs && snarkjs.poseidon) {
        const hash = snarkjs.poseidon([BigInt(fieldValue)]);
        const hashString = hash.toString();
        console.log('✅ Poseidon hash computed using snarkjs:', hashString);
        return hashString;
      }
    } catch (snarkjsError) {
      console.log('⚠️ snarkjs Poseidon not available, trying circomlibjs...');
    }
    
    // Try poseidon-lite for Poseidon hash (more browser-compatible)
    try {
      const { poseidon1 } = await import('poseidon-lite');
      
      const hash = poseidon1([BigInt(fieldValue)]);
      const hashString = hash.toString();
      console.log('✅ Poseidon hash computed using poseidon-lite:', hashString);
      return hashString;
      
    } catch (poseidonLiteError) {
      console.error('❌ Failed to load poseidon-lite:', poseidonLiteError);
    }
    
    // Fallback to circomlibjs for Poseidon hash
    try {
      const circomlibjs = await import('circomlibjs');
      
      // Try different ways to access poseidon1
      const poseidon1 = circomlibjs.poseidon1 || 
                       circomlibjs.default?.poseidon1 || 
                       (circomlibjs as any).poseidon1;
      
      if (typeof poseidon1 !== 'function') {
        throw new Error('poseidon1 function not found in circomlibjs');
      }
      
      const hash = poseidon1([BigInt(fieldValue)]);
      const hashString = hash.toString();
      console.log('✅ Poseidon hash computed using circomlibjs:', hashString);
      return hashString;
      
    } catch (circomlibError) {
      console.error('❌ Failed to load circomlibjs Poseidon:', circomlibError);
      throw new Error(`Poseidon hash not available: ${circomlibError instanceof Error ? circomlibError.message : 'circomlibjs not found'}`);
    }
    
  } catch (error) {
    console.error('❌ Poseidon hash computation failed:', error);
    throw new Error(`Failed to compute Poseidon hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a zk-SNARK proof for knowledge of secret preimage using hash preimage circuit
 * This function creates a proof that the user knows a secret that hashes to a given public hash
 */
export const generateProof = async (secret: string, publicHash?: string): Promise<SnarkProof> => {
  try {
    // Ensure circuit artifacts are loaded
    if (!circuitArtifacts.wasm || !circuitArtifacts.zkey) {
      await loadCircuitArtifacts();
    }

    // Load snarkjs module
    const snarkjs = await getSnarkjs();
    
    // Convert secret to field element
    const secretField = stringToField(secret);
    console.log('🔍 Secret field value:', secretField);
    
    // If no public hash provided, compute it from the secret
    const hashValue = publicHash || await poseidonHash(secret);
    console.log('🔍 Public hash value:', hashValue);
    
    // For the hash preimage circuit: prove we know the preimage of the given hash
    const circuitInputs = {
      preimage: secretField,  // Private input - the secret
      hash: hashValue         // Public input - the expected hash
    };
    
    console.log('🔍 Hash preimage circuit inputs:', circuitInputs);
    console.log('🔧 Generating zk-SNARK proof for hash preimage...');
    
    // Convert ArrayBuffer to Uint8Array for snarkjs compatibility
    const wasmBuffer = new Uint8Array(circuitArtifacts.wasm!);
    const zkeyBuffer = new Uint8Array(circuitArtifacts.zkey!);
    
    console.log('🔍 WASM buffer type:', wasmBuffer.constructor.name, 'length:', wasmBuffer.length);
    console.log('🔍 ZKey buffer type:', zkeyBuffer.constructor.name, 'length:', zkeyBuffer.length);
    
    // Generate REAL proof using snarkjs with hash preimage circuit
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmBuffer,
      zkeyBuffer
    );
    
    // Convert snarkjs proof format to our interface
    const snarkProof: SnarkProof = {
      proof: {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c,
        protocol: proof.protocol || 'groth16',
        curve: proof.curve || 'bn128'
      },
      publicSignals: publicSignals
    };
    
    console.log('✅ REAL zk-SNARK proof generated successfully!');
    console.log('🔍 Public signals:', publicSignals);
    console.log('🔍 Proof type:', typeof proof);
    
    return snarkProof;
  } catch (error) {
    console.error('❌ Proof generation failed:', error);
    throw new Error(`Proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Verify a zk-SNARK proof
 * Now uses REAL snarkjs verification
 */
export const verifyProof = async (proof: SnarkProof): Promise<boolean> => {
  try {
    // Ensure circuit artifacts are loaded
    if (!circuitArtifacts.vkey) {
      await loadCircuitArtifacts();
    }

    // Load snarkjs module
    const snarkjs = await getSnarkjs();
    
    console.log('🔧 Verifying REAL zk-SNARK proof...');
    console.log('🔍 Proof to verify:', proof);
    console.log('🔍 Verification key available:', !!circuitArtifacts.vkey);
    
    // Perform REAL verification using snarkjs
    const isValid = await snarkjs.groth16.verify(
      circuitArtifacts.vkey,
      proof.publicSignals,
      proof.proof
    );
    
    console.log('✅ REAL proof verification completed');
    console.log('🔍 Verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('❌ Proof verification failed:', error);
    return false;
  }
};

/**
 * Utility to format proof for API submission
 */
export const formatProofForSubmission = (proof: SnarkProof) => {
  return {
    proof: proof.proof,
    publicInputs: proof.publicSignals
  };
};

/**
 * Validation utilities
 */
export const validateSecret = (secret: string): { isValid: boolean; error?: string } => {
  if (!secret || secret.trim().length === 0) {
    return { isValid: false, error: 'Secret cannot be empty' };
  }
  
  if (secret.length < 3) {
    return { isValid: false, error: 'Secret must be at least 3 characters long' };
  }
  
  if (secret.length > 1000) {
    return { isValid: false, error: 'Secret must be less than 1000 characters' };
  }
  
  return { isValid: true };
};

/**
 * Check snarkjs availability and status
 */
export const getSnarkjsStatus = async (): Promise<{
  isAvailable: boolean;
  version?: string;
  error?: string;
}> => {
  try {
    // Try to load snarkjs module
    const snarkjs = await getSnarkjs();
    
    // Check if snarkjs is available
    if (!snarkjs) {
      return {
        isAvailable: false,
        error: 'snarkjs module is not available'
      };
    }
    
    // Check if circuit artifacts are loaded
    const artifactsLoaded = Object.keys(circuitArtifacts).length > 0;
    
    return {
      isAvailable: true,
      version: 'snarkjs module loaded successfully',
      error: artifactsLoaded ? undefined : 'Circuit artifacts not loaded'
    };
  } catch (error) {
    return {
      isAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get circuit information
 */
export const getCircuitInfo = async (): Promise<{
  isLoaded: boolean;
  hasWasm: boolean;
  hasProvingKey: boolean;
  hasVerifyingKey: boolean;
  error?: string;
}> => {
  try {
    return {
      isLoaded: Object.keys(circuitArtifacts).length > 0,
      hasWasm: !!circuitArtifacts.wasm,
      hasProvingKey: !!circuitArtifacts.zkey,
      hasVerifyingKey: !!circuitArtifacts.vkey
    };
  } catch (error) {
    return {
      isLoaded: false,
      hasWasm: false,
      hasProvingKey: false,
      hasVerifyingKey: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Clear cached circuit artifacts (useful for development)
 */
export const clearCircuitCache = (): void => {
  circuitArtifacts = {};
  console.log('Circuit artifacts cache cleared');
};

/**
 * Debug helper to test string to field conversion
 */
export const debugStringToField = (input: string): void => {
  console.log('🔍 Debug string to field conversion:');
  console.log('Input:', input);
  try {
    const result = stringToField(input);
    console.log('Output:', result);
    console.log('Type:', typeof result);
    console.log('Is valid BigInt?', /^\d+$/.test(result));
  } catch (error) {
    console.error('Conversion failed:', error);
  }
};

/**
 * Utility functions for managing public hashes in localStorage
 */

/**
 * Store a public hash in localStorage for a user
 */
export const storePublicHash = (username: string, publicHash: string): void => {
  try {
    const stored = localStorage.getItem('zerogate_users') || '{}';
    const users = JSON.parse(stored);
    users[username] = { publicHash, timestamp: Date.now() };
    localStorage.setItem('zerogate_users', JSON.stringify(users));
    console.log('✅ Public hash stored for user:', username);
  } catch (error) {
    console.error('❌ Failed to store public hash:', error);
    throw new Error('Failed to store public hash in localStorage');
  }
};

/**
 * Retrieve a public hash from localStorage for a user
 */
export const getPublicHash = (username: string): string | null => {
  try {
    const stored = localStorage.getItem('zerogate_users');
    if (!stored) return null;
    
    const users = JSON.parse(stored);
    const userData = users[username];
    
    return userData?.publicHash || null;
  } catch (error) {
    console.error('❌ Failed to retrieve public hash:', error);
    return null;
  }
};

/**
 * Check if a user exists (has a registered public hash)
 */
export const userExists = (username: string): boolean => {
  return getPublicHash(username) !== null;
};

/**
 * Get all registered users
 */
export const getRegisteredUsers = (): string[] => {
  try {
    const stored = localStorage.getItem('zerogate_users');
    if (!stored) return [];
    
    const users = JSON.parse(stored);
    return Object.keys(users);
  } catch (error) {
    console.error('❌ Failed to get registered users:', error);
    return [];
  }
};

/**
 * Register a new user with their secret (computes and stores public hash)
 */
export const registerUser = async (username: string, secret: string): Promise<string> => {
  try {
    // Check if user already exists
    if (userExists(username)) {
      throw new Error('Username already exists');
    }
    
    // Validate inputs
    const secretValidation = validateSecret(secret);
    if (!secretValidation.isValid) {
      throw new Error(secretValidation.error || 'Invalid secret');
    }
    
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    
    // Compute public hash of the secret
    console.log('🔧 Computing public hash for registration...');
    const publicHash = await poseidonHash(secret);
    
    // Store the public hash
    storePublicHash(username, publicHash);
    
    console.log('✅ User registered successfully:', username);
    console.log('🔍 Public hash:', publicHash);
    
    return publicHash;
  } catch (error) {
    console.error('❌ User registration failed:', error);
    throw error;
  }
};

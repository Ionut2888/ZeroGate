// Test script for our Circom circuit using snarkjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import snarkjs dynamically
const snarkjs = await import('snarkjs');

console.log('🧪 Testing hash preimage circuit...');

try {
  // Test input: we want to prove we know the preimage of a hash
  const secret = "123"; // Our secret
  console.log('🔑 Secret:', secret);

  // Step 1: Calculate the witness (this proves we know the secret)
  const secretField = BigInt(secret); // Simple conversion for testing
  console.log('🔍 Secret as field element:', secretField.toString());

  // For our circuit, we need to calculate the expected hash first
  // In a real implementation, this would use the actual Poseidon hash
  // For testing, let's use a simple mock hash
  const expectedHash = (secretField * BigInt(7)) % BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
  console.log('🔍 Expected hash:', expectedHash.toString());

  // Circuit inputs
  const input = {
    preimage: secretField.toString(),
    hash: expectedHash.toString()
  };

  console.log('📝 Circuit inputs:', input);

  // Load circuit artifacts
  const wasmPath = join(__dirname, 'build', 'hash_preimage_js', 'hash_preimage.wasm');
  const zkeyPath = join(__dirname, 'setup', 'hash_preimage_0001.zkey');
  
  console.log('🔧 Generating witness and proof...');
  
  // Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log('✅ Proof generated successfully!');
  console.log('🔍 Public signals:', publicSignals);
  console.log('🔍 Proof:', proof);

  // Load verification key
  const vKeyPath = join(__dirname, 'setup', 'verification_key.json');
  const vKey = JSON.parse(readFileSync(vKeyPath, 'utf8'));

  // Verify the proof
  console.log('🔧 Verifying proof...');
  const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  console.log('✅ Proof verification result:', isValid);

  if (isValid) {
    console.log('🎉 SUCCESS: Circuit works correctly!');
    console.log('📋 Proof structure:');
    console.log('   - pi_a:', proof.pi_a);
    console.log('   - pi_b:', proof.pi_b);
    console.log('   - pi_c:', proof.pi_c);
    console.log('   - protocol:', proof.protocol);
    console.log('   - curve:', proof.curve);
  } else {
    console.log('❌ FAILED: Proof verification failed!');
  }

} catch (error) {
  console.error('❌ Test failed:', error);
}

#!/bin/bash
# ZoKrates Circuit Setup Script

set -e

echo "🔧 Setting up ZoKrates circuit for ZeroGate..."

# Navigate to circuits directory
cd "$(dirname "$0")"

# Step 1: Compile the circuit
echo "📝 Compiling hash_preimage.zok..."
zokrates compile -i hash_preimage.zok
echo "✅ Circuit compiled successfully!"

# Step 2: Perform trusted setup
echo "🔐 Performing trusted setup..."
zokrates setup
echo "✅ Trusted setup completed!"

# Step 3: Export verification key
echo "🔑 Exporting verification key..."
zokrates export-verifier
echo "✅ Verification key exported!"

# Step 4: Generate sample proof for testing
echo "🧪 Generating sample proof..."
# Using example values: secret=123, hash=poseidon(123)
echo "123" | zokrates compute-witness --stdin
zokrates generate-proof
echo "✅ Sample proof generated!"

# Step 5: Verify the sample proof
echo "🔍 Verifying sample proof..."
zokrates verify
echo "✅ Sample proof verified!"

echo ""
echo "🎉 ZoKrates setup complete! Generated files:"
ls -la | grep -E "\.(json|key|sol|out|wtns|proof)$" || echo "No generated files found yet"

echo ""
echo "📋 Next steps:"
echo "1. Start the backend server: cd ../server && npm run dev"
echo "2. Start the frontend: cd ../client && npm run dev"
echo "3. Or use Docker: docker-compose up --build"

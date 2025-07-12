# Trusted Setup Script for Groth16 - PowerShell Version

Write-Host "🔧 Starting trusted setup for Groth16..." -ForegroundColor Cyan

# Create setup directory
$setupDir = "circuits/setup"
if (!(Test-Path $setupDir)) {
    New-Item -ItemType Directory -Path $setupDir -Force
    Write-Host "📁 Created setup directory: $setupDir" -ForegroundColor Green
}

Set-Location $setupDir

try {
    # Step 1: Start a new powers of tau ceremony (for testing - use small size)
    Write-Host "🎯 Step 1: Powers of Tau ceremony..." -ForegroundColor Yellow
    npx snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

    # Step 2: Contribute to the ceremony (in production, multiple parties would contribute)
    Write-Host "🎯 Step 2: Contributing to ceremony..." -ForegroundColor Yellow
    npx snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v

    # Step 3: Prepare phase 2
    Write-Host "🎯 Step 3: Preparing phase 2..." -ForegroundColor Yellow
    npx snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

    # Step 4: Generate circuit-specific setup (for our hash_preimage circuit)
    Write-Host "🎯 Step 4: Generating circuit keys..." -ForegroundColor Yellow
    npx snarkjs groth16 setup ../build/hash_preimage.r1cs pot12_final.ptau hash_preimage_0000.zkey

    # Step 5: Contribute to the circuit-specific ceremony
    Write-Host "🎯 Step 5: Circuit-specific contribution..." -ForegroundColor Yellow
    npx snarkjs zkey contribute hash_preimage_0000.zkey hash_preimage_0001.zkey --name="First circuit contribution" -v

    # Step 6: Export verification key
    Write-Host "🎯 Step 6: Exporting verification key..." -ForegroundColor Yellow
    npx snarkjs zkey export verificationkey hash_preimage_0001.zkey verification_key.json

    Write-Host "✅ Trusted setup completed!" -ForegroundColor Green
    Write-Host "📂 Files generated:" -ForegroundColor Cyan
    Write-Host "   - hash_preimage_0001.zkey (proving key)" -ForegroundColor White
    Write-Host "   - verification_key.json (verification key)" -ForegroundColor White

} catch {
    Write-Host "❌ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location ../..
}

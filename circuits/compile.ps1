# Circuit Compilation Script for Windows PowerShell

Write-Host "🔧 Compiling Circom circuit..." -ForegroundColor Cyan

# Create build directory
$buildDir = "circuits/build"
if (!(Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir -Force
    Write-Host "📁 Created build directory: $buildDir" -ForegroundColor Green
}

# Compile the circuit
Write-Host "🏗️ Compiling hash_preimage.circom..." -ForegroundColor Yellow
$compileCommand = ".\circom.exe circuits/hash_preimage.circom --r1cs --wasm --sym -o $buildDir"
Invoke-Expression $compileCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Circuit compiled successfully!" -ForegroundColor Green
    Write-Host "📂 Output files are in: $buildDir" -ForegroundColor Green
    
    # List generated files
    Write-Host "`n📋 Generated files:" -ForegroundColor Cyan
    Get-ChildItem -Path $buildDir -Recurse | ForEach-Object {
        Write-Host "   $($_.FullName)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Circuit compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run trusted setup (powers of tau ceremony)" -ForegroundColor White
Write-Host "   2. Generate proving and verification keys" -ForegroundColor White
Write-Host "   3. Test the circuit with sample inputs" -ForegroundColor White

@echo off
REM ZoKrates Circuit Setup Script for Windows

echo 🔧 Setting up ZoKrates circuit for ZeroGate...

REM Navigate to circuits directory
cd /d "%~dp0"

REM Step 1: Compile the circuit
echo 📝 Compiling hash_preimage.zok...
zokrates compile -i hash_preimage.zok
if %ERRORLEVEL% neq 0 (
    echo ❌ Circuit compilation failed!
    exit /b %ERRORLEVEL%
)
echo ✅ Circuit compiled successfully!

REM Step 2: Perform trusted setup
echo 🔐 Performing trusted setup...
zokrates setup
if %ERRORLEVEL% neq 0 (
    echo ❌ Trusted setup failed!
    exit /b %ERRORLEVEL%
)
echo ✅ Trusted setup completed!

REM Step 3: Export verification key
echo 🔑 Exporting verification key...
zokrates export-verifier
if %ERRORLEVEL% neq 0 (
    echo ❌ Verification key export failed!
    exit /b %ERRORLEVEL%
)
echo ✅ Verification key exported!

REM Step 4: Generate sample proof for testing
echo 🧪 Generating sample proof...
echo 123 | zokrates compute-witness --stdin
if %ERRORLEVEL% neq 0 (
    echo ❌ Witness computation failed!
    exit /b %ERRORLEVEL%
)
zokrates generate-proof
if %ERRORLEVEL% neq 0 (
    echo ❌ Proof generation failed!
    exit /b %ERRORLEVEL%
)
echo ✅ Sample proof generated!

REM Step 5: Verify the sample proof
echo 🔍 Verifying sample proof...
zokrates verify
if %ERRORLEVEL% neq 0 (
    echo ❌ Proof verification failed!
    exit /b %ERRORLEVEL%
)
echo ✅ Sample proof verified!

echo.
echo 🎉 ZoKrates setup complete! Generated files:
dir *.json *.key *.sol *.out *.wtns *.proof 2>nul || echo No generated files found yet

echo.
echo 📋 Next steps:
echo 1. Start the backend server: cd ..\server ^&^& npm run dev
echo 2. Start the frontend: cd ..\client ^&^& npm run dev
echo 3. Or use Docker: docker-compose up --build

pause

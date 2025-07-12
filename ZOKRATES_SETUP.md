# ZoKrates Installation Guide for Windows

## Prerequisites Installation

### 1. Install Rust (Required for ZoKrates)

Run this command in PowerShell (as Administrator):
```powershell
# Download and install Rust
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
.\rustup-init.exe -y
```

Or visit: https://rustup.rs/ and follow the installation instructions.

After installation, restart your terminal and verify:
```bash
rustc --version
cargo --version
```

### 2. Install ZoKrates CLI

Once Rust is installed, install ZoKrates:
```bash
cargo install --git https://github.com/Zokrates/ZoKrates zokrates_cli
```

Verify installation:
```bash
zokrates --version
```

## Alternative: Use Docker (Recommended for Windows)

If you encounter issues with the native installation, use Docker:

### Build the ZoKrates Docker image:
```bash
cd C:\Users\Ionut\Documents\ZeroGate
docker build -f Dockerfile.zokrates -t zerogate-zokrates .
```

### Run ZoKrates commands via Docker:
```bash
# Compile circuit
docker run --rm -v ${PWD}/circuits:/app/circuits zerogate-zokrates zokrates compile -i circuits/hash_preimage.zok

# Setup
docker run --rm -v ${PWD}/circuits:/app/circuits zerogate-zokrates zokrates setup

# Export verifier
docker run --rm -v ${PWD}/circuits:/app/circuits zerogate-zokrates zokrates export-verifier
```

## Option 1: Install Pre-built ZoKrates Binary (Recommended - No Rust Required)

### Download and Install ZoKrates Binary:
```powershell
# Create ZoKrates directory
New-Item -ItemType Directory -Force -Path "C:\ZoKrates"

# Download the latest Windows binary
Invoke-WebRequest -Uri "https://github.com/Zokrates/ZoKrates/releases/latest/download/zokrates-0.8.8-x86_64-pc-windows-msvc.zip" -OutFile "C:\ZoKrates\zokrates.zip"

# Extract the binary
Expand-Archive -Path "C:\ZoKrates\zokrates.zip" -DestinationPath "C:\ZoKrates" -Force

# Add to PATH (run as Administrator)
$env:PATH += ";C:\ZoKrates"
[Environment]::SetEnvironmentVariable("Path", $env:PATH, [EnvironmentVariableTarget]::Machine)
```

### Verify Installation:
```bash
zokrates --version
```

## Option 2: Install via Rust/Cargo (If you prefer building from source)

If you prefer to build from source instead of using the pre-built binary, you can use the Rust package manager, Cargo:

```bash
cargo install --git https://github.com/Zokrates/ZoKrates zokrates_cli
```

Verify installation:
```bash
zokrates --version
```

## Next Steps

After installing ZoKrates CLI (either natively or via Docker), proceed to the circuit setup phase.

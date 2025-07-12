"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoKratesService = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)();
class ZoKratesService {
    constructor() {
        this.circuitsPath = process.env.CIRCUITS_PATH || path_1.default.join(__dirname, '../../circuits');
    }
    async verifyProof(proof, publicInputs) {
        try {
            logger.info('🔍 Starting proof verification...');
            const tempDir = path_1.default.join(this.circuitsPath, 'temp');
            await this.ensureDirectoryExists(tempDir);
            const proofFile = path_1.default.join(tempDir, 'proof.json');
            const publicInputsFile = path_1.default.join(tempDir, 'public_inputs.json');
            await fs_1.promises.writeFile(proofFile, JSON.stringify(proof, null, 2));
            await fs_1.promises.writeFile(publicInputsFile, JSON.stringify(publicInputs));
            const verificationKeyPath = path_1.default.join(this.circuitsPath, 'verification.key');
            try {
                await fs_1.promises.access(verificationKeyPath);
            }
            catch (error) {
                logger.error('❌ Verification key not found. Run circuit setup first.');
                throw new Error('Verification key not found. Circuit setup required.');
            }
            const command = `zokrates verify -v "${verificationKeyPath}" -j "${proofFile}"`;
            logger.info(`📋 Executing: ${command}`);
            try {
                (0, child_process_1.execSync)(command, {
                    cwd: this.circuitsPath,
                    stdio: 'pipe'
                });
                logger.info('✅ Proof verification successful!');
                await this.cleanup(tempDir);
                return true;
            }
            catch (execError) {
                logger.error('❌ Proof verification failed:', execError.message);
                await this.cleanup(tempDir);
                return false;
            }
        }
        catch (error) {
            logger.error('💥 Error during proof verification:', error.message);
            throw new Error(`Proof verification error: ${error.message}`);
        }
    }
    async generateTestProof(secret) {
        try {
            logger.info('🧪 Generating test proof...');
            const tempDir = path_1.default.join(this.circuitsPath, 'temp');
            await this.ensureDirectoryExists(tempDir);
            const witnessCommand = `echo "${secret}" | zokrates compute-witness --stdin`;
            (0, child_process_1.execSync)(witnessCommand, { cwd: this.circuitsPath });
            (0, child_process_1.execSync)('zokrates generate-proof', { cwd: this.circuitsPath });
            const proofPath = path_1.default.join(this.circuitsPath, 'proof.json');
            const proofData = await fs_1.promises.readFile(proofPath, 'utf-8');
            const proof = JSON.parse(proofData);
            const publicInputs = proof.inputs || [];
            logger.info('✅ Test proof generated successfully!');
            return { proof, publicInputs };
        }
        catch (error) {
            logger.error('💥 Error generating test proof:', error.message);
            throw new Error(`Test proof generation error: ${error.message}`);
        }
    }
    async isCircuitSetup() {
        try {
            const requiredFiles = [
                'out',
                'proving.key',
                'verification.key'
            ];
            for (const file of requiredFiles) {
                const filePath = path_1.default.join(this.circuitsPath, file);
                await fs_1.promises.access(filePath);
            }
            return true;
        }
        catch {
            return false;
        }
    }
    async getSetupStatus() {
        const requiredFiles = [
            'hash_preimage.zok',
            'out',
            'proving.key',
            'verification.key'
        ];
        const missingFiles = [];
        for (const file of requiredFiles) {
            try {
                const filePath = path_1.default.join(this.circuitsPath, file);
                await fs_1.promises.access(filePath);
            }
            catch {
                missingFiles.push(file);
            }
        }
        return {
            isSetup: missingFiles.length === 0,
            missingFiles,
            circuitsPath: this.circuitsPath
        };
    }
    async ensureDirectoryExists(dirPath) {
        try {
            await fs_1.promises.access(dirPath);
        }
        catch {
            await fs_1.promises.mkdir(dirPath, { recursive: true });
        }
    }
    async cleanup(tempDir) {
        try {
            await fs_1.promises.rmdir(tempDir, { recursive: true });
        }
        catch (error) {
            logger.warn('⚠️ Failed to clean up temporary files:', error);
        }
    }
}
exports.ZoKratesService = ZoKratesService;
//# sourceMappingURL=zokrates.js.map
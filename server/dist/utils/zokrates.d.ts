export declare class ZoKratesService {
    private circuitsPath;
    constructor();
    verifyProof(proof: any, publicInputs: string[]): Promise<boolean>;
    generateTestProof(secret: string): Promise<{
        proof: any;
        publicInputs: string[];
    }>;
    isCircuitSetup(): Promise<boolean>;
    getSetupStatus(): Promise<{
        isSetup: boolean;
        missingFiles: string[];
        circuitsPath: string;
    }>;
    private ensureDirectoryExists;
    private cleanup;
}
//# sourceMappingURL=zokrates.d.ts.map
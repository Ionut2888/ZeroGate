declare module 'snarkjs' {
  export interface SnarkJSProof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }

  export interface SnarkJSPublicSignals {
    [key: string]: string;
  }

  export namespace groth16 {
    export function prove(
      circuitWasm: Uint8Array | string,
      circuitZkey: Uint8Array | string,
      input: any
    ): Promise<{ proof: SnarkJSProof; publicSignals: string[] }>;

    export function verify(
      vKey: any,
      publicSignals: string[],
      proof: SnarkJSProof
    ): Promise<boolean>;
  }

  export namespace plonk {
    export function prove(
      circuitWasm: Uint8Array | string,
      circuitZkey: Uint8Array | string,
      input: any
    ): Promise<{ proof: SnarkJSProof; publicSignals: string[] }>;

    export function verify(
      vKey: any,
      publicSignals: string[],
      proof: SnarkJSProof
    ): Promise<boolean>;
  }

  export function getCurveFromR1cs(r1csFile: Uint8Array): Promise<any>;
  export function getCurveFromName(name: string): Promise<any>;
}

import { ClinicalProtocol, PatientCategory } from '../types';

export class ProtocolRegistry {
  private static protocols: Map<PatientCategory, ClinicalProtocol> = new Map();

  static register(protocol: ClinicalProtocol): void {
    this.protocols.set(protocol.category, protocol);
  }

  static get(category: PatientCategory): ClinicalProtocol {
    const protocol = this.protocols.get(category);
    if (!protocol) {
      throw new Error(`No protocol registered for category: ${category}`);
    }
    return protocol;
  }

  static has(category: PatientCategory): boolean {
    return this.protocols.has(category);
  }

  static getAll(): ClinicalProtocol[] {
    return Array.from(this.protocols.values());
  }

  static getByPhase(phase: string): ClinicalProtocol[] {
    return this.getAll().filter(p => p.phase === phase);
  }

  static registerAll(protocols: ClinicalProtocol[]): void {
    for (const p of protocols) {
      this.register(p);
    }
  }

  static clear(): void {
    this.protocols.clear();
  }

  static count(): number {
    return this.protocols.size;
  }
}

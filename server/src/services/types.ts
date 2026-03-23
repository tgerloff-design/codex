import { CanonicalWorkItem, Resource, WorkloadRequest } from '../../../shared/types';

export interface DataProvider {
  getResources(): Promise<Resource[]>;
  getWorkItems(request: WorkloadRequest): Promise<CanonicalWorkItem[]>;
}

export interface SsrsAuthProvider {
  getHeaders(): Promise<Record<string, string>>;
}

export class BasicAuthProvider implements SsrsAuthProvider {
  constructor(private username: string, private password: string, private domain?: string) {}

  async getHeaders(): Promise<Record<string, string>> {
    const user = this.domain ? `${this.domain}\\${this.username}` : this.username;
    const token = Buffer.from(`${user}:${this.password}`).toString('base64');
    return {
      Authorization: `Basic ${token}`
    };
  }
}

export class PluggableAuthProvider implements SsrsAuthProvider {
  async getHeaders(): Promise<Record<string, string>> {
    throw new Error('SSRS pluggable auth provider is not configured. Implement Kerberos/NTLM integration for your environment.');
  }
}
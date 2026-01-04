/**
 * Policy-related types and interfaces
 */

export type PolicyType = 'refund' | 'return' | 'terms' | 'privacy' | 'shipping';

export interface Policy {
  id: number;
  type: PolicyType;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


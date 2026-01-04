/**
 * Email template-related types and interfaces
 */

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string | null;
  createdAt: string;
  updatedAt: string;
}


// Database entity types matching the SQL schema

export interface RFP {
  id: string;
  title: string;
  description: string | null;
  raw_input: string | null;
  budget: number | null;
  delivery_timeline: string | null;
  requirements: Record<string, unknown> | null;
  status: 'draft' | 'sent' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  contact_person: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  rfp_id: string;
  supplier_id: string;
  content: string | null;
  raw_email: string | null;
  pricing: Record<string, unknown> | null;
  terms: string | null;
  status: 'received' | 'reviewed' | 'accepted' | 'rejected';
  ai_score: number | null;
  ai_summary: string | null;
  ai_evaluation: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface RFPSupplier {
  id: string;
  rfp_id: string;
  supplier_id: string;
  sent_at: string | null;
  email_status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

// Extended types for UI display
export interface ProposalWithSupplier extends Proposal {
  supplier: Supplier;
}

export interface RFPWithDetails extends RFP {
  suppliers?: Supplier[];
  proposals?: ProposalWithSupplier[];
  proposal_count?: number;
}

// Form input types
export interface CreateRFPInput {
  raw_input: string;
}

export interface CreateSupplierInput {
  name: string;
  email: string;
  contact_person?: string;
  phone?: string;
  notes?: string;
}

export interface CreateProposalInput {
  rfp_id: string;
  supplier_id: string;
  raw_email: string;
}

// AI API types
export interface LLMMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface LLMResponse {
  candidates: Array<{
    content: {
      role: string;
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
}

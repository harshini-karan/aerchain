import { supabase } from './supabase';
import type { RFP, Supplier, Proposal, RFPSupplier, ProposalWithSupplier, RFPWithDetails } from '@/types/types';

// RFP Operations
export async function getAllRFPs(): Promise<RFP[]> {
  const { data, error } = await supabase
    .from('rfps')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getRFPById(id: string): Promise<RFP | null> {
  const { data, error } = await supabase
    .from('rfps')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRFPWithDetails(id: string): Promise<RFPWithDetails | null> {
  const { data: rfp, error: rfpError } = await supabase
    .from('rfps')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (rfpError) throw rfpError;
  if (!rfp) return null;

  const { data: rfpSuppliers, error: suppliersError } = await supabase
    .from('rfp_suppliers')
    .select('supplier_id, suppliers(*)')
    .eq('rfp_id', id);

  if (suppliersError) throw suppliersError;

  const { data: proposals, error: proposalsError } = await supabase
    .from('proposals')
    .select('*, suppliers(*)')
    .eq('rfp_id', id)
    .order('created_at', { ascending: false });

  if (proposalsError) throw proposalsError;

  return {
    ...rfp,
    suppliers: Array.isArray(rfpSuppliers) ? rfpSuppliers.map((rs: any) => rs.suppliers).filter(Boolean) : [],
    proposals: Array.isArray(proposals) ? proposals.map((p: any) => ({
      ...p,
      supplier: p.suppliers
    })) : [],
    proposal_count: Array.isArray(proposals) ? proposals.length : 0
  };
}

export async function createRFP(rfp: Partial<RFP>): Promise<RFP> {
  const { data, error } = await supabase
    .from('rfps')
    .insert({
      title: rfp.title || 'Untitled RFP',
      description: rfp.description || null,
      raw_input: rfp.raw_input || null,
      budget: rfp.budget || null,
      delivery_timeline: rfp.delivery_timeline || null,
      requirements: rfp.requirements || null,
      status: rfp.status || 'draft'
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create RFP');
  return data;
}

export async function updateRFP(id: string, updates: Partial<RFP>): Promise<RFP> {
  const { data, error } = await supabase
    .from('rfps')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to update RFP');
  return data;
}

export async function deleteRFP(id: string): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Supplier Operations
export async function getAllSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      name: supplier.name || '',
      email: supplier.email || '',
      contact_person: supplier.contact_person || null,
      phone: supplier.phone || null,
      notes: supplier.notes || null
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create supplier');
  return data;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to update supplier');
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Proposal Operations
export async function getProposalsByRFP(rfpId: string): Promise<ProposalWithSupplier[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*, suppliers(*)')
    .eq('rfp_id', rfpId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data.map((p: any) => ({
    ...p,
    supplier: p.suppliers
  })) : [];
}

export async function getProposalById(id: string): Promise<ProposalWithSupplier | null> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*, suppliers(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  
  return {
    ...data,
    supplier: data.suppliers
  };
}

export async function createProposal(proposal: Partial<Proposal>): Promise<Proposal> {
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      rfp_id: proposal.rfp_id || '',
      supplier_id: proposal.supplier_id || '',
      content: proposal.content || null,
      raw_email: proposal.raw_email || null,
      pricing: proposal.pricing || null,
      terms: proposal.terms || null,
      status: proposal.status || 'received',
      ai_score: proposal.ai_score || null,
      ai_summary: proposal.ai_summary || null,
      ai_evaluation: proposal.ai_evaluation || null
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create proposal');
  return data;
}

export async function updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to update proposal');
  return data;
}

export async function deleteProposal(id: string): Promise<void> {
  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// RFP-Supplier Junction Operations
export async function addSuppliersToRFP(rfpId: string, supplierIds: string[]): Promise<void> {
  const records = supplierIds.map(supplierId => ({
    rfp_id: rfpId,
    supplier_id: supplierId,
    email_status: 'pending' as const
  }));

  const { error } = await supabase
    .from('rfp_suppliers')
    .insert(records);

  if (error) throw error;
}

export async function getRFPSuppliers(rfpId: string): Promise<RFPSupplier[]> {
  const { data, error } = await supabase
    .from('rfp_suppliers')
    .select('*')
    .eq('rfp_id', rfpId);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updateRFPSupplierStatus(
  rfpId: string,
  supplierId: string,
  status: 'pending' | 'sent' | 'failed',
  sentAt?: string
): Promise<void> {
  const updates: any = { email_status: status };
  if (sentAt) updates.sent_at = sentAt;

  const { error } = await supabase
    .from('rfp_suppliers')
    .update(updates)
    .eq('rfp_id', rfpId)
    .eq('supplier_id', supplierId);

  if (error) throw error;
}

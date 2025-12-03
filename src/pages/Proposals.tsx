import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Inbox, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import { getAllRFPs, getAllSuppliers, createProposal } from '@/db/api';
import { parseProposalEmail, scoreProposal } from '@/services/ai';
import type { ProposalWithSupplier, RFP, Supplier } from '@/types/types';

export default function Proposals() {
  const [proposals, setProposals] = useState<ProposalWithSupplier[]>([]);
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    rfp_id: '',
    supplier_id: '',
    raw_email: ''
  });
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [proposalsData, rfpsData, suppliersData] = await Promise.all([
        supabase.from('proposals').select('*, suppliers(*)').order('created_at', { ascending: false }),
        getAllRFPs(),
        getAllSuppliers()
      ]);

      if (proposalsData.error) throw proposalsData.error;

      setProposals(
        Array.isArray(proposalsData.data)
          ? proposalsData.data.map((p: any) => ({
              ...p,
              supplier: p.suppliers
            }))
          : []
      );
      setRfps(rfpsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proposals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.rfp_id || !formData.supplier_id || !formData.raw_email.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const rfp = rfps.find(r => r.id === formData.rfp_id);
      if (!rfp) throw new Error('RFP not found');

      const rfpContext = `Title: ${rfp.title}\nDescription: ${rfp.description}\nBudget: ${rfp.budget}\nRequirements: ${JSON.stringify(rfp.requirements)}`;

      const parsed = await parseProposalEmail(formData.raw_email, rfpContext);
      
      const scoring = await scoreProposal(
        rfpContext,
        parsed.content,
        parsed.pricing,
        parsed.terms
      );

      await createProposal({
        rfp_id: formData.rfp_id,
        supplier_id: formData.supplier_id,
        raw_email: formData.raw_email,
        content: parsed.content,
        pricing: parsed.pricing,
        terms: parsed.terms,
        ai_score: scoring.score,
        ai_summary: scoring.summary,
        ai_evaluation: scoring.evaluation,
        status: 'received'
      });

      toast({
        title: 'Success',
        description: 'Proposal processed and saved successfully'
      });

      setDialogOpen(false);
      setFormData({ rfp_id: '', supplier_id: '', raw_email: '' });
      loadData();
    } catch (error: any) {
      console.error('Error processing proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process proposal',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proposals</h1>
          <p className="text-muted-foreground">
            View and manage supplier proposals
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add Proposal</DialogTitle>
              <DialogDescription>
                Paste the supplier's email response. AI will extract and structure the information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rfp">RFP</Label>
                  <Select value={formData.rfp_id} onValueChange={(value) => setFormData({ ...formData, rfp_id: value })}>
                    <SelectTrigger id="rfp">
                      <SelectValue placeholder="Select RFP" />
                    </SelectTrigger>
                    <SelectContent>
                      {rfps.map((rfp) => (
                        <SelectItem key={rfp.id} value={rfp.id}>
                          {rfp.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Content</Label>
                <Textarea
                  id="email"
                  value={formData.raw_email}
                  onChange={(e) => setFormData({ ...formData, raw_email: e.target.value })}
                  placeholder="Paste the supplier's email response here..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={processing}>
                  {processing ? 'Processing...' : 'Process Proposal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No proposals yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              When suppliers respond to your RFPs, add their proposals here for AI-powered analysis.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Proposal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Proposals</CardTitle>
            <CardDescription>
              {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>RFP</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id} className="cursor-pointer hover:bg-muted">
                    <TableCell className="font-medium">{proposal.supplier.name}</TableCell>
                    <TableCell>
                      <Link to={`/rfps/${proposal.rfp_id}`} className="hover:underline">
                        View RFP
                      </Link>
                    </TableCell>
                    <TableCell>
                      {proposal.ai_score !== null ? (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-chart-4 fill-chart-4" />
                          <span className="font-semibold">{proposal.ai_score}/100</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {proposal.ai_summary || 'No summary'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          proposal.status === 'accepted'
                            ? 'default'
                            : proposal.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {proposal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

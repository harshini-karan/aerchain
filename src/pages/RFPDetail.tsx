import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getRFPWithDetails, getAllSuppliers, addSuppliersToRFP, updateRFP } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { RFPWithDetails, Supplier } from '@/types/types';

export default function RFPDetail() {
  const { id } = useParams<{ id: string }>();
  const [rfp, setRfp] = useState<RFPWithDetails | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    try {
      const [rfpData, suppliersData] = await Promise.all([
        getRFPWithDetails(id!),
        getAllSuppliers()
      ]);
      
      setRfp(rfpData);
      setAllSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading RFP:', error);
      toast({
        title: 'Error',
        description: 'Failed to load RFP details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSendToSuppliers() {
    if (selectedSuppliers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one supplier',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      await addSuppliersToRFP(id!, selectedSuppliers);
      
      const { error } = await supabase.functions.invoke('send-rfp-email', {
        body: {
          rfp_id: id,
          supplier_ids: selectedSuppliers
        }
      });

      if (error) {
        console.error('Email sending error:', error);
        toast({
          title: 'Warning',
          description: 'RFP saved but email sending failed. Please check email configuration.',
          variant: 'destructive'
        });
      } else {
        await updateRFP(id!, { status: 'sent' });
        toast({
          title: 'Success',
          description: `RFP sent to ${selectedSuppliers.length} supplier(s)`
        });
      }

      setDialogOpen(false);
      setSelectedSuppliers([]);
      loadData();
    } catch (error) {
      console.error('Error sending RFP:', error);
      toast({
        title: 'Error',
        description: 'Failed to send RFP',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  }

  function toggleSupplier(supplierId: string) {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">RFP Not Found</h2>
        <Link to="/rfps">
          <Button variant="outline">Back to RFPs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/rfps">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{rfp.title}</h1>
            <p className="text-muted-foreground">RFP Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={rfp.status === 'sent' ? 'default' : 'secondary'}>
            {rfp.status}
          </Badge>
          {rfp.status === 'draft' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Suppliers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select Suppliers</DialogTitle>
                  <DialogDescription>
                    Choose which suppliers should receive this RFP
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {allSuppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No suppliers available</p>
                      <Link to="/suppliers">
                        <Button variant="outline">Add Suppliers</Button>
                      </Link>
                    </div>
                  ) : (
                    allSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-start space-x-3 rounded-lg border border-border p-4"
                      >
                        <Checkbox
                          id={supplier.id}
                          checked={selectedSuppliers.includes(supplier.id)}
                          onCheckedChange={() => toggleSupplier(supplier.id)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={supplier.id}
                            className="text-base font-medium cursor-pointer"
                          >
                            {supplier.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{supplier.email}</p>
                          {supplier.contact_person && (
                            <p className="text-sm text-muted-foreground">
                              Contact: {supplier.contact_person}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {allSuppliers.length > 0 && (
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={sending}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendToSuppliers} disabled={sending}>
                      {sending ? 'Sending...' : `Send to ${selectedSuppliers.length} Supplier(s)`}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {rfp.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {rfp.requirements && Object.keys(rfp.requirements).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-foreground whitespace-pre-wrap">
                  {JSON.stringify(rfp.requirements, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {rfp.raw_input && (
            <Card>
              <CardHeader>
                <CardTitle>Original Input</CardTitle>
                <CardDescription>Natural language procurement request</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{rfp.raw_input}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rfp.budget && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Budget</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${rfp.budget.toLocaleString()}
                  </div>
                </div>
              )}
              {rfp.delivery_timeline && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Delivery Timeline</div>
                  <div className="text-foreground">{rfp.delivery_timeline}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="text-foreground">
                  {new Date(rfp.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invited Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rfp.suppliers && rfp.suppliers.length > 0 ? (
                <div className="space-y-2">
                  {rfp.suppliers.map((supplier) => (
                    <div key={supplier.id} className="text-sm">
                      <div className="font-medium text-foreground">{supplier.name}</div>
                      <div className="text-muted-foreground">{supplier.email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No suppliers invited yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rfp.proposals && rfp.proposals.length > 0 ? (
                <div className="space-y-2">
                  {rfp.proposals.map((proposal) => (
                    <Link
                      key={proposal.id}
                      to={`/proposals/${proposal.id}`}
                      className="block text-sm hover:underline"
                    >
                      <div className="font-medium text-foreground">{proposal.supplier.name}</div>
                      <div className="text-muted-foreground">
                        Score: {proposal.ai_score || 'N/A'}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No proposals received yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

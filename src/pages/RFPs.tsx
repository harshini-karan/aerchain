import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAllRFPs, createRFP } from '@/db/api';
import { parseRFPFromNaturalLanguage } from '@/services/ai';
import type { RFP } from '@/types/types';

export default function RFPs() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRFPs();
  }, []);

  async function loadRFPs() {
    try {
      const data = await getAllRFPs();
      setRfps(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load RFPs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRFP() {
    if (!naturalLanguageInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your procurement requirements',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const parsed = await parseRFPFromNaturalLanguage(naturalLanguageInput);
      
      const newRFP = await createRFP({
        title: parsed.title,
        description: parsed.description,
        raw_input: naturalLanguageInput,
        budget: parsed.budget,
        delivery_timeline: parsed.delivery_timeline,
        requirements: parsed.requirements,
        status: 'draft'
      });

      toast({
        title: 'Success',
        description: 'RFP created successfully'
      });

      setRfps([newRFP, ...rfps]);
      setDialogOpen(false);
      setNaturalLanguageInput('');
    } catch (error) {
      console.error('Error creating RFP:', error);
      toast({
        title: 'Error',
        description: 'Failed to create RFP. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading RFPs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">RFPs</h1>
          <p className="text-muted-foreground">
            Manage your Request for Proposals
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create RFP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New RFP</DialogTitle>
              <DialogDescription>
                Describe your procurement needs in natural language. AI will convert it to a structured RFP.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="requirements">Procurement Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  rows={8}
                  className="resize-none"
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
                <Button onClick={handleCreateRFP} disabled={processing}>
                  {processing ? 'Processing...' : 'Create RFP'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rfps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No RFPs yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first RFP by describing your procurement needs in natural language.
              AI will help structure it for you.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First RFP
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rfps.map((rfp) => (
            <Link key={rfp.id} to={`/rfps/${rfp.id}`}>
              <Card className="h-full transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{rfp.title}</CardTitle>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        rfp.status === 'sent'
                          ? 'bg-accent/10 text-accent'
                          : rfp.status === 'closed'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {rfp.status}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {rfp.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rfp.budget && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Budget: ${rfp.budget.toLocaleString()}
                    </div>
                  )}
                  {rfp.delivery_timeline && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {rfp.delivery_timeline}
                    </div>
                  )}
                  <div className="pt-2 text-xs text-muted-foreground">
                    Created {new Date(rfp.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

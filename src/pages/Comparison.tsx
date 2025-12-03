import { useEffect, useState } from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAllRFPs, getProposalsByRFP } from '@/db/api';
import { evaluateProposals } from '@/services/ai';
import type { RFP, ProposalWithSupplier } from '@/types/types';
import ReactMarkdown from 'react-markdown';

export default function Comparison() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [selectedRFP, setSelectedRFP] = useState<string>('');
  const [proposals, setProposals] = useState<ProposalWithSupplier[]>([]);
  const [evaluation, setEvaluation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRFPs();
  }, []);

  useEffect(() => {
    if (selectedRFP) {
      loadProposals();
    }
  }, [selectedRFP]);

  async function loadRFPs() {
    try {
      const data = await getAllRFPs();
      setRfps(data.filter(rfp => rfp.status !== 'draft'));
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

  async function loadProposals() {
    try {
      const data = await getProposalsByRFP(selectedRFP);
      setProposals(data);
      setEvaluation('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load proposals',
        variant: 'destructive'
      });
    }
  }

  async function handleEvaluate() {
    if (proposals.length < 2) {
      toast({
        title: 'Error',
        description: 'Need at least 2 proposals to compare',
        variant: 'destructive'
      });
      return;
    }

    setEvaluating(true);
    setEvaluation('');

    try {
      const rfp = rfps.find(r => r.id === selectedRFP);
      if (!rfp) throw new Error('RFP not found');

      const rfpContext = `Title: ${rfp.title}\nDescription: ${rfp.description}\nBudget: ${rfp.budget}\nRequirements: ${JSON.stringify(rfp.requirements)}`;

      const proposalsData = proposals.map(p => ({
        supplier_name: p.supplier.name,
        content: p.content || '',
        pricing: p.pricing || {},
        terms: p.terms || ''
      }));

      await evaluateProposals(rfpContext, proposalsData, (chunk) => {
        setEvaluation(prev => prev + chunk);
      });

      toast({
        title: 'Success',
        description: 'AI evaluation completed'
      });
    } catch (error: any) {
      console.error('Error evaluating proposals:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to evaluate proposals',
        variant: 'destructive'
      });
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Proposal Comparison</h1>
        <p className="text-muted-foreground">
          AI-powered analysis and recommendations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select RFP</CardTitle>
          <CardDescription>Choose an RFP to compare its proposals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="rfp-select">RFP</Label>
              <Select value={selectedRFP} onValueChange={setSelectedRFP}>
                <SelectTrigger id="rfp-select">
                  <SelectValue placeholder="Select an RFP" />
                </SelectTrigger>
                <SelectContent>
                  {rfps.map((rfp) => (
                    <SelectItem key={rfp.id} value={rfp.id}>
                      {rfp.title} ({rfp.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleEvaluate}
                disabled={!selectedRFP || proposals.length < 2 || evaluating}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {evaluating ? 'Evaluating...' : 'AI Evaluate'}
              </Button>
            </div>
          </div>

          {selectedRFP && proposals.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Found {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} for comparison
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRFP && proposals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No proposals yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              This RFP hasn't received any proposals yet. Check back later or add proposals manually.
            </p>
          </CardContent>
        </Card>
      )}

      {proposals.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Proposals Overview</CardTitle>
              <CardDescription>Side-by-side comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {proposal.supplier.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {proposal.supplier.email}
                        </p>
                      </div>
                      {proposal.ai_score !== null && (
                        <Badge variant="secondary" className="text-base">
                          {proposal.ai_score}/100
                        </Badge>
                      )}
                    </div>

                    {proposal.ai_summary && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          AI Summary
                        </div>
                        <p className="text-sm text-foreground">{proposal.ai_summary}</p>
                      </div>
                    )}

                    {proposal.pricing && Object.keys(proposal.pricing).length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Pricing
                        </div>
                        <pre className="text-xs text-foreground bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(proposal.pricing, null, 2)}
                        </pre>
                      </div>
                    )}

                    {proposal.terms && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Terms
                        </div>
                        <p className="text-sm text-foreground">{proposal.terms}</p>
                      </div>
                    )}

                    {proposal.ai_evaluation && Object.keys(proposal.ai_evaluation).length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Detailed Evaluation
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(proposal.ai_evaluation).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-medium text-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                AI Evaluation & Recommendation
              </CardTitle>
              <CardDescription>
                Comprehensive analysis and decision support
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evaluating ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                  <p className="text-muted-foreground">AI is analyzing proposals...</p>
                </div>
              ) : evaluation ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{evaluation}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center max-w-md">
                    Click "AI Evaluate" to get a comprehensive comparison and recommendation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

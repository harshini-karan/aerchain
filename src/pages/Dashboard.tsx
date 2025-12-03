import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Inbox, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllRFPs, getAllSuppliers } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { RFP, Supplier } from '@/types/types';

export default function Dashboard() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [proposalCount, setProposalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rfpsData, suppliersData] = await Promise.all([
        getAllRFPs(),
        getAllSuppliers()
      ]);
      
      setRfps(rfpsData);
      setSuppliers(suppliersData);

      const { count } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true });
      
      setProposalCount(count || 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      name: 'Total RFPs',
      value: rfps.length,
      icon: FileText,
      href: '/rfps',
      color: 'text-primary'
    },
    {
      name: 'Suppliers',
      value: suppliers.length,
      icon: Users,
      href: '/suppliers',
      color: 'text-accent'
    },
    {
      name: 'Proposals',
      value: proposalCount,
      icon: Inbox,
      href: '/proposals',
      color: 'text-chart-3'
    },
    {
      name: 'Active RFPs',
      value: rfps.filter(r => r.status === 'sent').length,
      icon: TrendingUp,
      href: '/rfps',
      color: 'text-chart-4'
    }
  ];

  const recentRFPs = rfps.slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your RFP management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} to={stat.href}>
              <Card className="transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent RFPs</CardTitle>
            <CardDescription>Your latest procurement requests</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRFPs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No RFPs yet</p>
                <Link to="/rfps">
                  <Button>Create Your First RFP</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRFPs.map((rfp) => (
                  <Link
                    key={rfp.id}
                    to={`/rfps/${rfp.id}`}
                    className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{rfp.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {rfp.description || 'No description'}
                        </p>
                      </div>
                      <span
                        className={`ml-4 rounded-full px-3 py-1 text-xs font-medium ${
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
                  </Link>
                ))}
                <Link to="/rfps">
                  <Button variant="outline" className="w-full">
                    View All RFPs
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/rfps">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Create New RFP
              </Button>
            </Link>
            <Link to="/suppliers">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Suppliers
              </Button>
            </Link>
            <Link to="/proposals">
              <Button className="w-full justify-start" variant="outline">
                <Inbox className="mr-2 h-4 w-4" />
                View Proposals
              </Button>
            </Link>
            <Link to="/comparison">
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Compare Proposals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

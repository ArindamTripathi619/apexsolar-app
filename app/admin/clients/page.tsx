'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientPaymentModal from '@/app/components/ClientPaymentModal';
import { formatIndianCurrency } from '@/app/lib/indianLocalization';
import ThemeToggle from '@/app/components/ui/ThemeToggle';
import ButtonComponent from '@/app/components/ui/ButtonComponent';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Client {
  id: string;
  companyName: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  totalInvoiceAmount?: number;
  totalPayments?: number;
  dueAmount?: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Authentication check
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (data.success && data.data.role === 'ADMIN') {
        setUser(data.data);
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients', {
        credentials: 'include'
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, [router]);

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert("Client deleted successfully!");
        fetchClients(); // Refresh the client list
      } else {
        alert(data.error || "Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error deleting client");
    }
  };

  const handleAddPayment = (client: Client) => {
    setSelectedClient(client);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedClient(null);
    fetchClients(); // Refresh clients to update due amounts
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, fetchClients]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading clients...</p>
        </div>
      </div>
    );
  }

  const totalDue = clients.reduce((sum, client) => sum + (client.dueAmount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Client Management
              </h1>
              <p className="text-foreground/60 mt-1">Manage your clients and track payments</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <ThemeToggle />
            <Link href="/admin/clients/add">
              <ButtonComponent variant="primary" size="md">
                Add New Client
              </ButtonComponent>
            </Link>
            <Link href="/admin/dashboard">
              <ButtonComponent variant="outline" size="md">
                Back to Dashboard
              </ButtonComponent>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-foreground">{clients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Total Due Amount</p>
                <p className="text-3xl font-bold text-red-600">{formatIndianCurrency(totalDue)}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Overdue Clients</p>
                <p className="text-3xl font-bold text-orange-600">
                  {clients.filter(client => (client.dueAmount || 0) > 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No clients found</h3>
            <p className="text-foreground/60 mb-6">Add your first client to get started with client management.</p>
            <Link href="/admin/clients/add">
              <ButtonComponent variant="primary" size="lg">
                Add Your First Client
              </ButtonComponent>
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h3 className="text-lg font-semibold text-foreground">Clients List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Due Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">{client.companyName}</div>
                          <div className="text-sm text-foreground/60">{client.addressLine1}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{client.contactPerson || 'N/A'}</div>
                        <div className="text-sm text-foreground/60">{client.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${(client.dueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatIndianCurrency(client.dueAmount || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link href={`/admin/clients/edit?id=${client.id}`}>
                            <ButtonComponent variant="outline" size="sm">
                              Edit
                            </ButtonComponent>
                          </Link>
                          {(client.dueAmount || 0) > 0 && (
                            <ButtonComponent 
                              variant="success" 
                              size="sm"
                              onClick={() => handleAddPayment(client)}
                            >
                              Add Payment
                            </ButtonComponent>
                          )}
                          <ButtonComponent 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDeleteClient(client.id.toString())}
                          >
                            Delete
                          </ButtonComponent>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedClient && (
        <ClientPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedClient(null);
          }}
          onSuccess={handlePaymentSuccess}
          client={selectedClient}
        />
      )}
    </div>
  );
}

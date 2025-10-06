'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientPaymentModal from '@/app/components/ClientPaymentModal';
import { formatIndianCurrency } from '@/app/lib/indianLocalization';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  const totalDue = clients.reduce((sum, client) => sum + (client.dueAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="mt-2 text-gray-600">Manage your clients and track payments</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin/clients/add"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add New Client
              </Link>
              <Link
                href="/admin/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">₹</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Due Amount</dt>
                    <dd className="text-lg font-medium text-red-600">{formatIndianCurrency(totalDue)}</dd>
                  </dl>
                </div>
                <div className="ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                    <dd className="text-lg font-medium text-gray-900">{clients.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No clients found. Add your first client to get started.</p>
            <Link
              href="/admin/clients/add"
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Your First Client
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.companyName}</div>
                        <div className="text-sm text-gray-500">{client.addressLine1}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.contactPerson || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{client.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${(client.dueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatIndianCurrency(client.dueAmount || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/clients/edit?id=${client.id}`}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 border border-blue-200 rounded text-xs"
                        >
                          Edit
                        </Link>
                        {(client.dueAmount || 0) > 0 && (
                          <button
                            onClick={() => handleAddPayment(client)}
                            className="text-green-600 hover:text-green-900 px-2 py-1 border border-green-200 rounded text-xs"
                          >
                            Add Payment
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClient(client.id.toString())}
                          className="text-red-600 hover:text-red-900 px-2 py-1 border border-red-200 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

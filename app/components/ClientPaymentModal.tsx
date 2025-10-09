'use client';

import { useState } from 'react';
import { formatIndianCurrency } from '@/app/lib/indianLocalization';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: {
    id: string;
    companyName: string;
    dueAmount?: number;
  };
}

export default function PaymentModal({ isOpen, onClose, onSuccess, client }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!date) {
      alert('Please select a payment date');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          date,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Payment recorded successfully!');
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        onSuccess();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const dueAmount = client.dueAmount || 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Record Payment</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Client: <span className="font-medium text-foreground">{client.companyName}</span></p>
          <p className="text-sm text-muted-foreground">Current Due Amount: <span className="font-medium text-destructive">{formatIndianCurrency(dueAmount)}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
              Payment Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0.01"
                max={dueAmount || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter amount in rupees"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dueAmount > 0 && `Maximum: ${formatIndianCurrency(dueAmount)}`}
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Payment description or notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

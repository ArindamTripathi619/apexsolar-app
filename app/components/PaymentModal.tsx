'use client';

import { useState } from 'react';
import { formatIndianCurrency } from '@/app/lib/indianLocalization';
import IndianDateInput from './IndianDateInput';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  employeeName: string;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, employeeId, employeeName }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('DUE');
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
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employeeId,
          type,
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

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Record Employee Payment</h2>
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
          <p className="text-sm text-muted-foreground">Employee: <span className="font-medium text-foreground">{employeeName}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
              Payment Type *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option value="DUE">Due Payment</option>
              <option value="ADVANCE">Advance Payment</option>
              <option value="DUE_CLEARED">Due Cleared</option>
              <option value="ADVANCE_REPAID">Advance Repaid</option>
            </select>
          </div>

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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter amount in rupees"
                required
              />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Amount: {formatIndianCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          <div className="mb-4">
            <IndianDateInput
              id="date"
              label="Payment Date"
              value={date}
              onChange={setDate}
              required
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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

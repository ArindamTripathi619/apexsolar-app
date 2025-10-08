'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { InvoiceGeneration, InvoiceLineItem, CustomerForInvoice, CompanySettings } from '@/app/types/invoice-generation';
import { numberToWordsIndian, getCurrentFinancialYear } from '@/app/lib/numberToWords';
import { generateInvoicePDF, downloadPDF } from '@/app/lib/pdfGenerator';
import { formatIndianCurrency } from '@/app/lib/indianLocalization';
import IndianDateInput from '@/app/components/IndianDateInput';

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
}

export default function InvoiceGenerationForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Invoice form state
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [financialYear] = useState<string>(getCurrentFinancialYear());
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workOrderReference, setWorkOrderReference] = useState<string>('');
  const [workOrderDate, setWorkOrderDate] = useState<string>('');

  // Customer details
  const [companyName, setCompanyName] = useState<string>('');
  const [addressLine1, setAddressLine1] = useState<string>('');
  const [addressLine2, setAddressLine2] = useState<string>('');
  const [addressLine3, setAddressLine3] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [gstNumber, setGstNumber] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      serialNumber: 1,
      description: '',
      hsnSacCode: '',
      rate: 0,
      quantity: 0,
      unit: 'kWp',
      amount: 0,
    },
  ]);

  const [cgstPercentage, setCgstPercentage] = useState<number>(9);
  const [sgstPercentage, setSgstPercentage] = useState<number>(9);

  useEffect(() => {
    fetchClients();
    fetchCompanySettings();
    fetchNextInvoiceNumber();
  }, [financialYear]); // Add financialYear as dependency since fetchNextInvoiceNumber uses it

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.clients)) {
          setClients(data.clients);
        } else {
          console.warn('Invalid clients data received:', data);
          setClients([]); // Ensure it remains an array
        }
      } else {
        console.error('Failed to fetch clients - HTTP status:', response.status);
        setClients([]); // Ensure it remains an array
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]); // Ensure it remains an array
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company-settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompanySettings(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await fetch(`/api/invoice-generation?financialYear=${financialYear}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInvoiceNumber(data.data.nextInvoiceNumber);
        }
      }
    } catch (error) {
      console.error('Failed to fetch next invoice number:', error);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients && clients.find(c => c.id === clientId);
    if (client) {
      setCompanyName(client.companyName);
      setAddressLine1(client.addressLine1);
      setAddressLine2(client.addressLine2 || '');
      setAddressLine3(client.addressLine3 || '');
      setCity(client.city || '');
      setState(client.state || '');
      setPinCode(client.pinCode || '');
      setGstNumber(client.gstNumber || '');
      setPanNumber(client.panNumber || '');
    }
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate amount when rate or quantity changes
    if (field === 'rate' || field === 'quantity') {
      // Rate is in ₹ per Wp, quantity is in kWp (1 kWp = 1000 Wp)
      // So: Amount = rate (₹/Wp) × quantity (kWp) × 1000 (Wp/kWp)
      const rate = updatedItems[index].rate;
      const quantity = updatedItems[index].quantity;
      const calculatedAmount = rate * quantity * 1000;
      
      console.log('Calculation Debug:', {
        rate,
        quantity,
        calculatedAmount,
        field,
        value
      });
      
      updatedItems[index].amount = calculatedAmount;
    }
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        serialNumber: lineItems.length + 1,
        description: '',
        hsnSacCode: '',
        rate: 0,
        quantity: 0,
        unit: 'kWp',
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      const updatedItems = lineItems.filter((_, i) => i !== index);
      // Update serial numbers
      updatedItems.forEach((item, i) => {
        item.serialNumber = i + 1;
      });
      setLineItems(updatedItems);
    }
  };

  const calculateTotals = () => {
    const totalBasicAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const cgstAmount = (totalBasicAmount * cgstPercentage) / 100;
    const sgstAmount = (totalBasicAmount * sgstPercentage) / 100;
    const grandTotal = totalBasicAmount + cgstAmount + sgstAmount;
    
    return {
      totalBasicAmount,
      cgstAmount,
      sgstAmount,
      grandTotal,
      amountInWords: numberToWordsIndian(grandTotal)
    };
  };

  const validateForm = (): boolean => {
    if (!companyName.trim()) {
      alert('Company name is required');
      return false;
    }
    if (!addressLine1.trim()) {
      alert('Address line 1 is required');
      return false;
    }
    if (lineItems.some(item => !item.description.trim() || item.rate <= 0 || item.quantity <= 0)) {
      alert('All line items must have description, rate, and quantity greater than 0');
      return false;
    }
    if (!workOrderReference.trim()) {
      alert('Work order reference is required');
      return false;
    }
    return true;
  };

  const handleGenerateInvoice = async () => {
    console.log('🚀 Starting invoice generation...');
    
    if (!validateForm() || !companySettings) {
      console.log('❌ Validation failed or no company settings');
      return;
    }

    setIsGenerating(true);

    try {
      const totals = calculateTotals();
      console.log('📊 Calculated totals:', totals);
      
      const customer: CustomerForInvoice = {
        companyName,
        addressLine1,
        addressLine2,
        addressLine3,
        city,
        state,
        pinCode,
        gstNumber,
        panNumber
      };

      const invoiceData: InvoiceGeneration = {
        invoiceNumber,
        financialYear,
        invoiceDate,
        workOrderReference,
        workOrderDate: workOrderDate || undefined,
        customer,
        lineItems,
        totalBasicAmount: totals.totalBasicAmount,
        cgstPercentage,
        cgstAmount: totals.cgstAmount,
        sgstPercentage,
        sgstAmount: totals.sgstAmount,
        grandTotal: totals.grandTotal,
        amountInWords: totals.amountInWords
      };

      console.log('📝 Invoice data to send:', invoiceData);

      // Create invoice record in database
      console.log('🌐 Sending request to API...');
      const response = await fetch('/api/invoice-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(invoiceData)
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response error:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response data:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }

      console.log('📄 Generating PDF...');
      // Generate PDF
      const pdfBlob = await generateInvoicePDF(
        result.data,
        companySettings,
        companySettings.stampSignatureUrl,
        companySettings.companyLogoUrl
      );

      console.log('📁 PDF generated, uploading...');
      // Upload PDF to server
      const formData = new FormData();
      formData.append('file', pdfBlob, `${invoiceNumber.replace(/\//g, '_')}.pdf`);
      formData.append('invoiceId', result.data.id);

      const uploadResponse = await fetch('/api/invoice-generation/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('📤 Upload response status:', uploadResponse.status);

      if (uploadResponse.ok) {
        console.log('🎉 Invoice generated and saved successfully!');
        alert('Invoice generated and saved successfully!');
        
        // Download PDF for user
        downloadPDF(pdfBlob, `${invoiceNumber.replace(/\//g, '_')}.pdf`);
        
        // Reset form
        resetForm();
        fetchNextInvoiceNumber();
      } else {
        const uploadError = await uploadResponse.text();
        console.warn('⚠️ Upload failed:', uploadError);
        // Even if upload fails, still download the PDF
        downloadPDF(pdfBlob, `${invoiceNumber.replace(/\//g, '_')}.pdf`);
        alert('Invoice generated and downloaded, but failed to save to server. Please upload manually if needed.');
      }

    } catch (error) {
      console.error('💥 Error generating invoice:', error);
      alert(`Failed to generate invoice: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setCompanyName('');
    setAddressLine1('');
    setAddressLine2('');
    setAddressLine3('');
    setCity('');
    setState('');
    setPinCode('');
    setGstNumber('');
    setPanNumber('');
    setWorkOrderReference('');
    setWorkOrderDate('');
    setLineItems([
      {
        serialNumber: 1,
        description: '',
        hsnSacCode: '',
        rate: 0,
        quantity: 0,
        unit: 'kWp',
        amount: 0,
      },
    ]);
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Invoice</h1>
        <p className="text-gray-600">Create professional invoices for your solar projects</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  value={financialYear}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <IndianDateInput
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Order Date (Optional)
                </label>
                <IndianDateInput
                  value={workOrderDate}
                  onChange={setWorkOrderDate}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Order Reference
                </label>
                <input
                  type="text"
                  value={workOrderReference}
                  onChange={(e) => setWorkOrderReference(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter work order reference"
                />
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Details</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Existing Customer (Optional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a customer or enter new details below</option>
                {clients && clients.length > 0 ? clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                )) : (
                  <option value="" disabled>Loading customers...</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 3
                </label>
                <input
                  type="text"
                  value={addressLine3}
                  onChange={(e) => setAddressLine3(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Services/Products</h2>
              <button
                onClick={addLineItem}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded border">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    {lineItems.length > 1 && (
                      <button
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 overflow-hidden">
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Service description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        HSN/SAC Code
                      </label>
                      <input
                        type="text"
                        value={item.hsnSacCode}
                        onChange={(e) => handleLineItemChange(index, 'hsnSacCode', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Rate (₹) *
                      </label>
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => handleLineItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <div className="flex w-full">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="flex-1 border border-gray-300 rounded-l px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                          min="0"
                          step="0.01"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                          className="border-l-0 border border-gray-300 rounded-r px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-16 flex-shrink-0"
                        >
                          <option value="kWp">kWp</option>
                          <option value="kW">kW</option>
                          <option value="Nos">Nos</option>
                          <option value="Sq.ft">Sq.ft</option>
                          <option value="Meter">Meter</option>
                          <option value="Set">Set</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="text"
                        value={formatIndianCurrency(item.amount)}
                        disabled
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Settings */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CGST (%)
                </label>
                <input
                  type="number"
                  value={cgstPercentage}
                  onChange={(e) => setCgstPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SGST (%)
                </label>
                <input
                  type="number"
                  value={sgstPercentage}
                  onChange={(e) => setSgstPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Basic Amount:</span>
                <span className="font-medium">{formatIndianCurrency(totals.totalBasicAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CGST ({cgstPercentage}%):</span>
                <span className="font-medium">{formatIndianCurrency(totals.cgstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST ({sgstPercentage}%):</span>
                <span className="font-medium">{formatIndianCurrency(totals.sgstAmount)}</span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Grand Total:</span>
                <span className="text-green-600">{formatIndianCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount in Words:
              </label>
              <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                {totals.amountInWords}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleGenerateInvoice}
                disabled={isGenerating || !companySettings}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Generate Invoice</span>
                  </>
                )}
              </button>
              
              <button
                onClick={resetForm}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2"
              >
                <span>Reset Form</span>
              </button>
            </div>

            {!companySettings && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-700">
                  Company settings not found. Please configure bank details and company information.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

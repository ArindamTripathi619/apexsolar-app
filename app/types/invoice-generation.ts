export interface InvoiceLineItem {
  id?: string;
  serialNumber: number;
  description: string;
  hsnSacCode: string;
  rate: number;
  quantity: number;
  unit: string;
  amount: number;
}

export interface CustomerForInvoice {
  id?: string;
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

export interface InvoiceGeneration {
  id?: string;
  invoiceNumber: string;
  financialYear: string;
  invoiceDate: string;
  workOrderReference: string;
  workOrderDate?: string;
  customer: CustomerForInvoice;
  lineItems: InvoiceLineItem[];
  totalBasicAmount: number;
  cgstPercentage: number;
  cgstAmount: number;
  sgstPercentage: number;
  sgstAmount: number;
  grandTotal: number;
  amountInWords: string;
}

export interface CompanySettings {
  id?: string;
  accountName: string;
  bankName: string;
  ifscCode: string;
  accountNumber: string;
  gstNumber: string;
  stampSignatureUrl?: string;
  companyLogoUrl?: string;
}

export interface InvoiceDraft {
  invoiceNumber?: string;
  financialYear?: string;
  invoiceDate?: string;
  workOrderReference?: string;
  workOrderDate?: string;
  customer?: Partial<CustomerForInvoice>;
  lineItems?: InvoiceLineItem[];
  cgstPercentage?: number;
  sgstPercentage?: number;
}

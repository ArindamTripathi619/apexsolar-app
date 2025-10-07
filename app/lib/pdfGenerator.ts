import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceGeneration, CompanySettings } from '@/app/types/invoice-generation';

// Extend jsPDF interface
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export async function generateInvoicePDF(
  invoice: InvoiceGeneration,
  companySettings: CompanySettings,
  stampSignatureDataUrl?: string,
  companyLogoDataUrl?: string
): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Initialize autoTable
  (doc as any).autoTable = autoTable;
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  let currentY = 8;

  // Create letterhead
  if (companyLogoDataUrl) {
    try {
      doc.addImage(companyLogoDataUrl, 'PNG', margin, currentY, 40, 35);
    } catch (error) {
      console.error('Error adding company logo:', error);
    }
  }

  // Company name with special styling
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 98, 184); // Blue color for APEX SOLAR
  
  doc.setFontSize(36);
  doc.text('A', 55, currentY + 12);
  
  doc.setFontSize(30);
  doc.text('PEX', 64, currentY + 12);
  
  doc.setFontSize(36);
  doc.text('S', 92, currentY + 12);
  
  doc.setFontSize(30);
  doc.text('OLAR', 99, currentY + 12);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(0, 128, 0);
  doc.text('for green energy', 55, currentY + 21);

  // Service description on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text('Solar Power Plant Installation', pageWidth - 75, currentY + 10, { align: 'left' });
  doc.text('and Commissioning', pageWidth - 75, currentY + 18, { align: 'left' });

  // Address and contact info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  doc.text('Ramkrishna Nagar, Paschimpara, P.O.- Panchpota, P.S.- Narendrapur, Kolkata - 700 152', margin, currentY + 40);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Ph : ', margin, currentY + 44);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.text('+91-97327 33031', margin + 12, currentY + 44);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('E-mail : ', margin + 50, currentY + 44);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.text('partha.apexsolar@gmail.com', margin + 66, currentY + 44);

  // Line separator
  doc.setDrawColor(139, 69, 19);
  doc.setLineWidth(2);
  doc.line(margin, currentY + 49, pageWidth - margin, currentY + 49);
  
  doc.setDrawColor(41, 98, 184);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY + 50.5, pageWidth - margin, currentY + 50.5);

  currentY += 58;

  // Tax Invoice header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('Tax Invoice', pageWidth / 2, currentY, { align: 'center' });

  currentY += 15;

  // Customer and Invoice details section
  const customerDetailsX = margin;
  const invoiceDetailsX = pageWidth - 90;

  // Customer Details (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Bill To:', customerDetailsX, currentY);

  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.customer.companyName, customerDetailsX, currentY);

  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  if (invoice.customer.addressLine1) {
    doc.text(invoice.customer.addressLine1, customerDetailsX, currentY);
    currentY += 4;
  }
  
  if (invoice.customer.addressLine2) {
    doc.text(invoice.customer.addressLine2, customerDetailsX, currentY);
    currentY += 4;
  }
  
  if (invoice.customer.addressLine3) {
    doc.text(invoice.customer.addressLine3, customerDetailsX, currentY);
    currentY += 4;
  }

  if (invoice.customer.city || invoice.customer.state || invoice.customer.pinCode) {
    const cityStatePin = [
      invoice.customer.city,
      invoice.customer.state,
      invoice.customer.pinCode
    ].filter(Boolean).join(', ');
    
    if (cityStatePin) {
      doc.text(cityStatePin, customerDetailsX, currentY);
      currentY += 4;
    }
  }

  if (invoice.customer.gstNumber) {
    doc.text(`GST No.: ${invoice.customer.gstNumber}`, customerDetailsX, currentY);
    currentY += 4;
  }

  if (invoice.customer.panNumber) {
    doc.text(`PAN No.: ${invoice.customer.panNumber}`, customerDetailsX, currentY);
  }

  // Invoice Details (Right)
  let rightColumnY = currentY - (customerDetailsX === margin ? 35 : 20); // Reset to start of customer details

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text('Invoice No.:', invoiceDetailsX, rightColumnY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, invoiceDetailsX + 25, rightColumnY);

  rightColumnY += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', invoiceDetailsX, rightColumnY);
  doc.setFont('helvetica', 'normal');
  const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }).replace(/\//g, '.');
  doc.text(formattedDate, invoiceDetailsX + 25, rightColumnY);

  currentY = Math.max(currentY, rightColumnY) + 10;

  // Work Order Section
  if (invoice.workOrderReference) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    let workOrderText = `Work Order Ref.: ${invoice.workOrderReference}`;
    if (invoice.workOrderDate) {
      const workOrderDateFormatted = new Date(invoice.workOrderDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '.');
      workOrderText += ` dated ${workOrderDateFormatted}`;
    }
    
    doc.text(workOrderText, margin, currentY);
    currentY += 8;
  }

  // Service Table
  const tableData = invoice.lineItems.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.hsnSacCode || '',
    item.rate.toFixed(2),
    `${item.quantity} ${item.unit}`,
    item.amount.toFixed(2)
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['S.No.', 'Description of Services', 'HSN/SAC', 'Rate', 'Qty', 'Amount (₹)']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [240, 240, 240],
      fontStyle: 'bold',
      halign: 'center',
      textColor: [0, 0, 0]
    },
    bodyStyles: {
      halign: 'left'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 25 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // Financial Summary
  const summaryX = pageWidth - 80;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text('Total Basic Amount:', summaryX, currentY);
  doc.text(`₹ ${invoice.totalBasicAmount.toFixed(2)}`, summaryX + 50, currentY, { align: 'right' });

  currentY += 5;

  doc.text(`CGST @ ${invoice.cgstPercentage}%:`, summaryX, currentY);
  doc.text(`₹ ${invoice.cgstAmount.toFixed(2)}`, summaryX + 50, currentY, { align: 'right' });

  currentY += 5;

  doc.text(`SGST @ ${invoice.sgstPercentage}%:`, summaryX, currentY);
  doc.text(`₹ ${invoice.sgstAmount.toFixed(2)}`, summaryX + 50, currentY, { align: 'right' });

  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total:', summaryX, currentY);
  doc.text(`₹ ${invoice.grandTotal.toFixed(2)}`, summaryX + 50, currentY, { align: 'right' });

  currentY += 10;

  // Amount in words
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const amountInWords = `Amount in Words: ${invoice.amountInWords}`;
  const splitWords = doc.splitTextToSize(amountInWords, pageWidth - 2 * margin);
  doc.text(splitWords, margin, currentY);
  
  currentY += splitWords.length * 4 + 5;

  // Tax Summary Table
  const taxTableData = [
    ['Total Basic Amount', `₹ ${invoice.totalBasicAmount.toFixed(2)}`],
    [`CGST @ ${invoice.cgstPercentage}%`, `₹ ${invoice.cgstAmount.toFixed(2)}`],
    [`SGST @ ${invoice.sgstPercentage}%`, `₹ ${invoice.sgstAmount.toFixed(2)}`],
    ['Grand Total', `₹ ${invoice.grandTotal.toFixed(2)}`]
  ];

  doc.autoTable({
    startY: currentY,
    body: taxTableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 40 },
      1: { halign: 'right', cellWidth: 30 }
    },
    margin: { left: margin, right: pageWidth - 80 }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Bank Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Bank Details:', margin, currentY);

  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Account Name: ${companySettings.accountName}`, margin, currentY);
  
  currentY += 4;
  doc.text(`Bank Name: ${companySettings.bankName}`, margin, currentY);
  
  currentY += 4;
  doc.text(`IFSC Code: ${companySettings.ifscCode}`, margin, currentY);
  
  currentY += 4;
  doc.text(`Account Number: ${companySettings.accountNumber}`, margin, currentY);

  // Stamp and Signature
  if (stampSignatureDataUrl) {
    try {
      doc.addImage(stampSignatureDataUrl, 'PNG', pageWidth - 80, currentY - 10, 60, 30);
    } catch (error) {
      console.error('Error adding stamp/signature:', error);
    }
  }

  currentY += 25;

  // GST Number at bottom
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`GST No.: ${companySettings.gstNumber}`, pageWidth / 2, currentY, { align: 'center' });

  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

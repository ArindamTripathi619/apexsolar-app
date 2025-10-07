import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { InvoiceGeneration } from '@/app/types/invoice-generation'
import { numberToWordsIndian, generateInvoiceNumber } from '@/app/lib/numberToWords'
import { formatIndianDate } from '@/app/lib/indianLocalization'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as InvoiceGeneration
    
    // Calculate amounts
    const totalBasicAmount = body.lineItems.reduce((sum, item) => sum + item.amount, 0)
    const cgstAmount = (totalBasicAmount * body.cgstPercentage) / 100
    const sgstAmount = (totalBasicAmount * body.sgstPercentage) / 100
    const grandTotal = totalBasicAmount + cgstAmount + sgstAmount
    const amountInWords = numberToWordsIndian(grandTotal)

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        companyName: body.customer.companyName
      }
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          companyName: body.customer.companyName,
          addressLine1: body.customer.addressLine1,
          addressLine2: body.customer.addressLine2,
          addressLine3: body.customer.addressLine3,
          city: body.customer.city,
          state: body.customer.state,
          pinCode: body.customer.pinCode,
          gstNumber: body.customer.gstNumber,
          panNumber: body.customer.panNumber
        }
      })
    }

    // Generate unique invoice number
    const currentYear = new Date().getFullYear()
    const financialYear = body.financialYear || `${currentYear.toString().slice(-2)}-${(currentYear + 1).toString().slice(-2)}`
    
    const existingInvoices = await prisma.invoice.count({
      where: {
        financialYear: financialYear
      }
    })
    
    const invoiceNumber = body.invoiceNumber || generateInvoiceNumber(financialYear, existingInvoices + 1)

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        clientName: body.customer.companyName,
        amount: grandTotal,
        date: new Date(body.invoiceDate),
        fileName: `${invoiceNumber.replace(/\//g, '_')}.pdf`,
        fileUrl: '', // Will be updated after PDF upload
        clientId: client.id,
        invoiceNumber,
        financialYear,
        workOrderReference: body.workOrderReference,
        workOrderDate: body.workOrderDate ? new Date(body.workOrderDate) : null,
        totalBasicAmount,
        cgstPercentage: body.cgstPercentage,
        cgstAmount,
        sgstPercentage: body.sgstPercentage,
        sgstAmount,
        grandTotal,
        amountInWords,
        isGenerated: true
      }
    })

    // Create line items
    await Promise.all(
      body.lineItems.map((item) =>
        prisma.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            serialNumber: item.serialNumber,
            description: item.description,
            hsnSacCode: item.hsnSacCode,
            rate: item.rate,
            quantity: item.quantity,
            unit: item.unit,
            amount: item.amount
          }
        })
      )
    )

    // Return the complete invoice data for PDF generation
    const completeInvoice: InvoiceGeneration = {
      id: invoice.id,
      invoiceNumber,
      financialYear,
      invoiceDate: body.invoiceDate,
      workOrderReference: body.workOrderReference,
      workOrderDate: body.workOrderDate,
      customer: body.customer,
      lineItems: body.lineItems,
      totalBasicAmount,
      cgstPercentage: body.cgstPercentage,
      cgstAmount,
      sgstPercentage: body.sgstPercentage,
      sgstAmount,
      grandTotal,
      amountInWords
    }

    return NextResponse.json({
      success: true,
      data: completeInvoice
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const financialYear = searchParams.get('financialYear')

    // Get next invoice number for the financial year
    const currentYear = new Date().getFullYear()
    const fy = financialYear || `${currentYear.toString().slice(-2)}-${(currentYear + 1).toString().slice(-2)}`
    
    const existingInvoices = await prisma.invoice.count({
      where: {
        financialYear: fy
      }
    })
    
    const nextInvoiceNumber = generateInvoiceNumber(fy, existingInvoices + 1)

    return NextResponse.json({
      success: true,
      data: {
        nextInvoiceNumber,
        financialYear: fy
      }
    })
  } catch (error) {
    console.error('Error fetching invoice info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice info' },
      { status: 500 }
    )
  }
}

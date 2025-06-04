const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Payment, Booking, User } = require('../models');
const nodemailer = require('../utils/nodemailer');
const { Invoice } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Make sure the temp directory exists
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper function to send invoice email
const sendInvoiceEmail = async (payment, filePath, fileName, recipientEmail) => {
  try {
    await nodemailer.sendMail({
      to: recipientEmail,
      subject: `Your Invoice #${fileName.replace('invoice-', '').replace('.pdf', '')}`,
      html: `
        <h2>Thank you for your payment</h2>
        <p>Please find your invoice attached.</p>
        <p>Payment amount: ${payment.amount.toFixed(2)}</p>
        <p>Payment date: ${new Date(payment.createdAt).toLocaleDateString()}</p>
      `,
      attachments: [
        {
          filename: fileName,
          path: filePath,
          content_type: 'application/pdf'
        }
      ]
    });
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
};

// Generate invoice for a payment
exports.generateInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Find payment with relations
    const payment = await Payment.findByPk(paymentId, {
      include: [{
        model: Booking,
        include: [
          { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] },
          { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'email', 'businessName'] }
        ]
      }]
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Create PDF
    const doc = new PDFDocument();
    const invoiceNumber = `INV-${payment.id.substring(0, 6)}`;
    const fileName = `invoice-${invoiceNumber}.pdf`;
    const filePath = path.join(tempDir, fileName);
    
    // Pipe PDF to writable stream
    doc.pipe(fs.createWriteStream(filePath));
    
    // Add content to PDF
    doc.fontSize(25).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(15).text(`Invoice Number: ${invoiceNumber}`);
    doc.fontSize(15).text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`);
    doc.moveDown();
    
    // Customer details
    const customer = payment.Booking.customer;
    doc.fontSize(12).text('Bill To:');
    doc.fontSize(10).text(`${customer.firstName} ${customer.lastName}`);
    doc.fontSize(10).text(customer.email);
    doc.fontSize(10).text(customer.phoneNumber || 'No phone provided');
    doc.fontSize(10).text(customer.address || 'No address provided');
    doc.moveDown();
    
    // Service details
    const provider = payment.Booking.provider;
    doc.fontSize(12).text('Service Details:');
    doc.fontSize(10).text(`Service: ${payment.Booking.title || 'Service'}`);
    doc.fontSize(10).text(`Provider: ${provider.businessName || `${provider.firstName} ${provider.lastName}`}`);
    doc.fontSize(10).text(`Booking Date: ${new Date(payment.Booking.date).toLocaleDateString()}`);
    doc.moveDown();
    
    // Payment details
    doc.fontSize(12).text('Payment Details:');
    doc.fontSize(10).text(`Amount: $${payment.amount.toFixed(2)}`);
    doc.fontSize(10).text(`Status: ${payment.paymentStatus}`);
    doc.fontSize(10).text(`Payment Method: ${payment.paymentMethod || 'Card'}`);
    doc.fontSize(10).text(`Transaction ID: ${payment.transactionId || payment.id}`);
    
    // Finalize PDF
    doc.end();
    
    // Wait for PDF creation to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create invoice record in database
    const invoice = await Invoice.create({
      userId: customer.id,
      transactionId: payment.id,
      amount: payment.amount,
      status: 'generated'
    });
    
    // Send email with PDF
    const emailSent = await sendInvoiceEmail(payment, filePath, fileName, customer.email);
    
    // Return success response
    res.status(200).json({
      message: 'Invoice generated successfully',
      invoiceId: invoice.id,
      invoiceNumber,
      emailSent
    });
    
    // Clean up temp file after response
    setTimeout(() => {
      fs.unlink(filePath, err => {
        if (err) console.error('Error removing temp invoice:', err);
      });
    }, 5000);
    
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Failed to generate invoice', error: error.message });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;
    
    const invoice = await Invoice.findOne({
      where: { id: invoiceId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Check authorization
    const isOwner = invoice.userId === userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }
    
    res.status(200).json({ invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoice', error: error.message });
  }
};

// Get invoice by payment ID
exports.getInvoiceByPaymentId = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;
    
    const invoice = await Invoice.findOne({
      where: { transactionId: paymentId }
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this payment' });
    }
    
    // Check authorization
    const payment = await Payment.findByPk(paymentId, {
      include: [{ 
        model: Booking, 
        include: [
          { model: User, as: 'customer' },
          { model: User, as: 'provider' }
        ]
      }]
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    const isCustomer = payment.Booking.customer.id === userId;
    const isProvider = payment.Booking.provider.id === userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }
    
    res.status(200).json({ invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoice', error: error.message });
  }
};

// Get user invoices
exports.getUserInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.status(200).json({
      invoices,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoices', error: error.message });
  }
};
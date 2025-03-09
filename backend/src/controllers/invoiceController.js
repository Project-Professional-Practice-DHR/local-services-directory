const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const nodemailer = require('../utils/nodemailer');

// Make sure the temp directory exists
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Export the controller functions
exports.generateInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Find payment with relations
    const payment = await Payment.findById(paymentId)
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'userId', select: 'name email phone address' },
          { path: 'serviceId', populate: { path: 'providerId', select: 'name email businessName' } }
        ]
      });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Create PDF
    const doc = new PDFDocument();
    const invoiceNumber = `INV-${payment._id.toString().slice(-6)}`;
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
    const customer = payment.bookingId.userId;
    doc.fontSize(12).text('Bill To:');
    doc.fontSize(10).text(customer.name);
    doc.fontSize(10).text(customer.email);
    doc.fontSize(10).text(customer.phone || 'No phone provided');
    doc.fontSize(10).text(customer.address || 'No address provided');
    doc.moveDown();
    
    // Service details
    const service = payment.bookingId.serviceId;
    const provider = service.providerId;
    doc.fontSize(12).text('Service Details:');
    doc.fontSize(10).text(`Service: ${service.title}`);
    doc.fontSize(10).text(`Provider: ${provider.businessName || provider.name}`);
    doc.fontSize(10).text(`Booking Date: ${new Date(payment.bookingId.date).toLocaleDateString()}`);
    doc.moveDown();
    
    // Payment details
    doc.fontSize(12).text('Payment Details:');
    doc.fontSize(10).text(`Amount: $${(payment.amount / 100).toFixed(2)}`);
    doc.fontSize(10).text(`Status: ${payment.status}`);
    doc.fontSize(10).text(`Payment Method: ${payment.paymentMethod}`);
    doc.fontSize(10).text(`Transaction ID: ${payment.transactionId}`);
    
    // Finalize PDF
    doc.end();
    
    // Wait for PDF creation to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send email with PDF
    const emailSent = await sendInvoiceEmail(payment, filePath, fileName, customer.email);
    
    // Save invoice reference to payment
    payment.invoiceUrl = `/invoices/${fileName}`;
    payment.invoiceNumber = invoiceNumber;
    await payment.save();
    
    // Return success response
    res.status(200).json({
      message: 'Invoice generated successfully',
      invoiceUrl: payment.invoiceUrl,
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

const sendInvoiceEmail = async (payment, filePath, fileName, recipientEmail) => {
  try {
    await nodemailer.sendMail({
      to: recipientEmail,
      subject: `Your Invoice #${payment.invoiceNumber}`,
      html: `
        <h2>Thank you for your payment</h2>
        <p>Please find your invoice attached.</p>
        <p>Payment amount: $${(payment.amount / 100).toFixed(2)}</p>
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

exports.getInvoiceByPaymentId = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    
    if (!payment || !payment.invoiceUrl) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.status(200).json({
      invoiceUrl: payment.invoiceUrl,
      invoiceNumber: payment.invoiceNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoice', error: error.message });
  }
};
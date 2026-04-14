require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models
const Order = require('./models/Order');
const Product = require('./models/Product');
const User = require('./models/User');
const Category = require('./models/Category');
const Cart = require('./models/Cart');
// const Review = require('./models/Review'); // Terminated as per user request
const Testimonial = require('./models/Testimonial');
const Wishlist = require('./models/Wishlist');
const Payment = require('./models/Payment');

const app = express();
app.use(cors());
app.use((req, res, next) => {
    console.log(`[NETWORK-MONITOR] ${req.method} ${req.url}`);
    next();
});
app.use('/api/wishlist', (req, res, next) => {
    console.log(`[ROUTE-DEBUG] Wishlist ${req.method} called:`, req.url);
    next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-commerce')
  .then(() => console.log('[Backend-Relay] MongoDB Connected Successfully'))
  .catch(err => console.error('[Backend-Relay] MongoDB Connection Error:', err));

// PROFESSIONAL TRANSPORTER CONFIGURATION
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'thameejahamed73@gmail.com',
    pass: process.env.GMAIL_PASS || 'rygwfvserpuxmkua'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Helper function to convert number to words for USD format
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion'];

  const convertSection = (n) => {
    let s = '';
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      s += ones[n] + ' ';
    }
    return s.trim();
  };

  const amount = parseFloat(num);
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  let dollarStr = '';
  if (dollars === 0) {
    dollarStr = 'Zero ';
  } else {
    let d = dollars;
    let scaleIdx = 0;
    while (d > 0) {
      let section = d % 1000;
      if (section > 0) {
        dollarStr = convertSection(section) + (scales[scaleIdx] ? ' ' + scales[scaleIdx] : '') + ' ' + dollarStr;
      }
      d = Math.floor(d / 1000);
      scaleIdx++;
    }
  }

  let res = 'INR ' + dollarStr.trim() + ' Rupees';
  if (cents > 0) {
    res += ' and ' + convertSection(cents) + ' Paise';
  }
  return res + ' Only';
}

// VERIFY SMTP CONNECTION ON STARTUP
transporter.verify((error, success) => {
  if (error) {
    console.error('===========================================');
    console.error('[Backend-Relay] CRITICAL: SMTP Connection Failed');
    console.error('[Backend-Relay] Error Details:', error.message);
    console.error('[Backend-Relay] FIX: Check your Gmail App Password.');
    console.error('===========================================');
  } else {
    console.log('[Backend-Relay] SMTP Status: Connected & Ready');
  }
});

const generateInvoicePDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('error', (err) => {
        console.error('[PDF-Engine] Stream Error:', err);
        reject(err);
      });
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const taxableValue = parseFloat(data.total) || 0;
      const taxRate = 0.09;
      const cgst = taxableValue * taxRate;
      const sgst = taxableValue * taxRate;
      const grandTotal = taxableValue + cgst + sgst;

    // --- MAIN BORDER ---
    doc.rect(30, 30, 535, 780).stroke();

    // --- HEADER ---
    doc.fontSize(12).font('Helvetica-Bold').text('TAX INVOICE', 30, 40, { align: 'center', width: 535 });
    doc.moveDown(0.2);
    doc.moveTo(30, 55).lineTo(565, 55).stroke();

    // --- TOP GRID (COMPANY & LOGISTICS) ---
    doc.rect(30, 55, 270, 70).stroke(); // Company name box
    doc.fontSize(10).font('Helvetica-Bold').text('XYLO ELECTRONICS', 40, 65);
    doc.font('Helvetica').fontSize(8);
    doc.text('500 Innovation Way, Suite 10,', 40, 80);
    doc.text('Mumbai, MH 400001, India.', 40, 92);
    doc.text('GSTIN/UIN: 33ASQPK6831P1Z1', 40, 104);

    // Right Logistics Table
    doc.rect(300, 55, 100, 25).stroke(); // Invoice No header
    doc.fontSize(8).font('Helvetica-Bold').text('Invoice No.', 305, 65);
    doc.rect(400, 55, 165, 25).stroke(); // Invoice No value
    doc.font('Helvetica').text(data.orderNumber, 405, 65);

    doc.rect(300, 80, 100, 25).stroke(); // Dated header
    doc.fontSize(8).font('Helvetica-Bold').text('Dated', 305, 90);
    doc.rect(400, 80, 165, 25).stroke(); // Dated value
    doc.font('Helvetica').text(new Date().toLocaleDateString('en-US'), 405, 90);

    doc.rect(300, 105, 100, 25).stroke(); // Mode header
    doc.fontSize(8).font('Helvetica-Bold').text('Mode/Terms', 305, 115);
    doc.rect(400, 105, 165, 25).stroke(); // Mode value
    
    // Convert short method to readable label
    const methodLabels = { 'card': 'CREDIT/DEBIT CARD', 'upi': 'UPI / WALLET', 'netbanking': 'NET BANKING', 'cod': 'CASH ON DELIVERY' };
    doc.font('Helvetica').text(methodLabels[data.paymentMethod] || 'PAYMENT CONFIRMED', 405, 115);

    // --- LOGISTICS CONTINUED ---
    doc.rect(30, 125, 270, 85).stroke(); // Buyer box
    doc.fontSize(9).font('Helvetica-Bold').text('Buyer (Bill to):', 40, 132);
    doc.fontSize(10).text(data.customerName, 40, 145);
    doc.fontSize(8).font('Helvetica').text(data.customerAddress || 'No address provided', 40, 158, { width: 250 });
    
    // Solve overlap by calculating address height
    const addrHeight = doc.heightOfString(data.customerAddress || 'No address provided', { width: 250 });
    const dynamicY = 158 + Math.max(addrHeight, 10); // Minimum 10 units for address

    if (data.customerPhone) {
      doc.text(`Phone: ${data.customerPhone}`, 40, dynamicY + 2);
      doc.text(data.to, 40, dynamicY + 12);
    } else {
      doc.text(data.to, 40, dynamicY + 2);
    }

    doc.rect(300, 130, 100, 25).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text('Dispatch Doc No', 305, 140);
    doc.rect(400, 130, 165, 25).stroke();
    doc.font('Helvetica').text('PCP-GST-7468', 405, 140);

    doc.rect(300, 155, 100, 25).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text('Delivery Note', 305, 165);
    doc.rect(400, 155, 165, 25).stroke();
    doc.font('Helvetica').text(data.deliveryNote || 'HAND OVER CONFIRMED', 405, 165);

    doc.rect(300, 180, 100, 30).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text('Destination', 305, 192);
    doc.rect(400, 180, 165, 30).stroke();
    const dest = data.customerAddress ? data.customerAddress.split(',').slice(-2).join(', ').trim().toUpperCase() : 'INDIA';
    doc.font('Helvetica').text(dest, 405, 192);
    
    // --- PRODUCT TABLE ---
    const tableTop = 210;
    doc.rect(30, tableTop, 535, 200).stroke();
    
    // Headers and vertical lines
    doc.font('Helvetica-Bold').fontSize(7);
    doc.text('Sl No', 35, tableTop + 10);
    doc.moveTo(60, tableTop).lineTo(60, tableTop + 200).stroke();

    doc.text('Description of Goods and Services', 65, tableTop + 10);
    doc.moveTo(200, tableTop).lineTo(200, tableTop + 200).stroke();

    doc.text('HSN/SAC', 205, tableTop + 10);
    doc.moveTo(250, tableTop).lineTo(250, tableTop + 200).stroke();

    doc.text('Quantity', 255, tableTop + 10);
    doc.moveTo(300, tableTop).lineTo(300, tableTop + 200).stroke();

    doc.text('Rate', 305, tableTop + 10);
    doc.moveTo(360, tableTop).lineTo(360, tableTop + 200).stroke();

    doc.text('per', 365, tableTop + 10);
    doc.moveTo(410, tableTop).lineTo(410, tableTop + 200).stroke();

    doc.text('Disc %', 415, tableTop + 10);
    doc.moveTo(460, tableTop).lineTo(460, tableTop + 200).stroke();

    doc.text('Amount', 465, tableTop + 10);
    doc.moveTo(30, tableTop + 30).lineTo(565, tableTop + 30).stroke();

    // Fill Item Data
    let itemY = tableTop + 40;
    
    // Support both Array (New) and String (Old) formats
    let itemsList = [];
    if (Array.isArray(data.items)) {
      itemsList = data.items;
    } else if (typeof data.items === 'string') {
      itemsList = data.items.split('\n').map(name => ({ name }));
    }

    itemsList.forEach((item, i) => {
       const displayName = typeof item === 'string' ? item : (item.name || 'Product');
       const displayPrice = item.price || (taxableValue / itemsList.length);
       const displayQty = parseInt(item.quantity) || 1;
       const qtyUnit = displayQty > 1 ? 'nos' : 'no';

        doc.font('Helvetica').text(`${i+1}`, 35, itemY);
        doc.text(displayName, 65, itemY, { width: 130 });
        doc.text('8471', 205, itemY);
        doc.text(`${displayQty} ${qtyUnit}`, 255, itemY);
        doc.text(`Rs. ${Number(displayPrice).toLocaleString('en-IN')}`, 305, itemY);
        doc.text(qtyUnit, 365, itemY);
        doc.text('-', 415, itemY);
        doc.text(`Rs. ${(Number(displayPrice) * displayQty).toLocaleString('en-IN')}`, 465, itemY);
        itemY += 20;
     });

    // --- TOTALS AREA ---
    const totalY = tableTop + 210;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(`CGST OUTPUT TAX @ 9%`, 40, totalY);
    doc.text(`Rs. ${cgst.toFixed(2)}`, 465, totalY);
    
    doc.text(`SGST OUTPUT TAX @ 9%`, 40, totalY + 20);
    doc.text(`Rs. ${sgst.toFixed(2)}`, 465, totalY + 20);

    doc.fontSize(11).text(`Total: Rs. ${grandTotal.toFixed(2)}`, 40, totalY + 45);
    doc.fontSize(7).font('Helvetica').text(`Amount Chargeable (in words): ${numberToWords(grandTotal.toFixed(2))}`, 40, totalY + 65);

    // --- HSN SUMMARY TABLE ---
    const hsnTop = totalY + 90;
    doc.rect(30, hsnTop, 535, 80).stroke();
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('HSN/SAC', 40, hsnTop + 10);
    doc.text('Taxable Value', 120, hsnTop + 10);
    doc.text('Central Tax Rate', 200, hsnTop + 10);
    doc.text('Central Tax Amt', 280, hsnTop + 10);
    doc.text('State Tax Amt', 360, hsnTop + 10);
    doc.text('Total Tax', 460, hsnTop + 10);
    doc.moveTo(30, hsnTop + 25).lineTo(565, hsnTop + 25).stroke();

    doc.font('Helvetica').text('8471', 40, hsnTop + 35);
    doc.text(`${taxableValue.toFixed(2)}`, 120, hsnTop + 35);
    doc.text('9%', 200, hsnTop + 35);
    doc.text(`${cgst.toFixed(2)}`, 280, hsnTop + 35);
    doc.text(`${sgst.toFixed(2)}`, 360, hsnTop + 35);
    doc.text(`${(cgst + sgst).toFixed(2)}`, 460, hsnTop + 35);

    // --- TAX AMOUNT IN WORDS ---
    doc.fontSize(8).font('Helvetica').text(`Tax Amount (in words): ${numberToWords((cgst + sgst).toFixed(2))}`, 40, hsnTop + 90);

    // --- FOOTER ---
    doc.fontSize(8).font('Helvetica-Bold').text(`Company's PAN: ASQPK6831P`, 40, 750);
    doc.text(`for XYLO ELECTRONICS`, 380, 750);
    doc.fontSize(8).font('Helvetica').text(`Authorised Signatory`, 400, 800);

    doc.end();
    } catch (err) {
      console.error('[PDF-Engine] Render Failure:', err);
      reject(err);
    }
  });
};

// ==========================================
// STRIPE INTEGRATION (Backend)
// Replace 'sk_test_...' with your actual Stripe Secret Key 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  try {
    console.log(`[Stripe] Creating payment intent for ₹${amount}`);
    // Create a PaymentIntent with the final order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in smallest unit (paise)
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('[Stripe Error]', error.message);
    res.status(500).json({ error: "TEST_SERVER_UPDATE: " + error.message });
  }
});

// --- PRODUCT ENDPOINTS ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SIMILAR PRODUCTS ENDPOINT (Category-based fallback for AI Recommendations)
app.get('/api/products/:id/similar', async (req, res) => {
  try {
    // Find the current product to get its category
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find other products in the same category, excluding itself
    // We limit to 4 for a clean UI row
    const similar = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    console.log(`[API] Found ${similar.length} similar products for cat: ${product.category}`);
    res.json(similar);
  } catch (error) {
    console.error('[API] Similar Products Fetch Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- ORDER ENDPOINTS ---
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check if cancellable (not shipped/delivered)
    if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Order cannot be cancelled as it has already been shipped or delivered.' });
    }
    
    order.orderStatus = 'Cancelled';
    await order.save();
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Status is required' });

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    await order.save();

    // Trigger Notification for Status Change (SMS & EMAIL)
    const trackingLink = `http://localhost:3000/order-tracking?orderNumber=${order.orderNumber}&email=${order.customerEmail}`;
    
    // 1. SEND EMAIL UPDATE
    const statusMailOptions = {
        from: '"Xylo Electronics Support" <thameejahamed73@gmail.com>',
        to: order.customerEmail,
        subject: `Update on your Xylo Order #${order.orderNumber}: ${status}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 25px; border-radius: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                <h2 style="color: #2874f0;">Important Order Update</h2>
                <p>Hello <strong>${order.customerName}</strong>,</p>
                <p>The status of your order <strong>#${order.orderNumber}</strong> has been updated to:</p>
                <div style="background: #ffffff; padding: 20px; border-radius: 12px; border-left: 5px solid #2874f0; margin: 20px 0; font-size: 1.2rem; font-weight: bold; color: #1e293b;">
                   🚀 ${status}
                </div>
                <p>You can track your package's live progress anytime using the button below:</p>
                <a href="${trackingLink}" style="display: inline-block; padding: 12px 30px; background-color: #2874f0; color: white; text-decoration: none; border-radius: 99px; font-weight: bold; margin: 15px 0;">Track My Order</a>
                <p style="color: #64748b; font-size: 0.85rem; margin-top: 30px;">Thank you for shopping with Xylo Electronics! We're making sure your tech arrives safely.</p>
            </div>
        `
    };

    transporter.sendMail(statusMailOptions, (err) => {
        if (err) console.error('[ADMIN-EMAIL] Status update failed:', err.message);
        else console.log(`[ADMIN-EMAIL] Status update sent to ${order.customerEmail}`);
    });

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/return', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Return reason is required' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ message: 'Returns can only be requested for delivered orders.' });
    }

    order.orderStatus = 'Return Requested';
    order.returnReason = reason;
    await order.save();

    res.json({ message: 'Return request submitted successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/resend-details', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    console.log(`[Admin-Action] Resending details for ORD ${order.orderNumber} to ${order.customerEmail}`);

    // Generate Invoice PDF
    const pdfBuffer = await generateInvoicePDF({
      to: order.customerEmail,
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      customerPhone: order.customerPhone,
      orderNumber: order.orderNumber,
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod || 'card',
      deliveryNote: order.orderStatus === 'Return Requested' ? 'RETURN REQUEST ACCEPTED' : 'HAND OVER CONFIRMED'
    });

    const isReturn = order.orderStatus === 'Return Requested';
    const mailOptions = {
      from: '"Xylo Electronics" <thameejahamed73@gmail.com>',
      to: order.customerEmail,
      subject: isReturn ? `Return Request Accepted - #${order.orderNumber}` : `Order Details Confirmation - #${order.orderNumber}`,
      html: isReturn ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h1 style="color: #10b981; margin-top: 0;">Return Request Accepted</h1>
          <p>Hello <strong>${order.customerName}</strong>,</p>
          <p>We have reviewed and <strong>ACCEPTED</strong> your return request for order <strong>#${order.orderNumber}</strong>.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border-left: 5px solid #10b981; margin: 20px 0;">
             <strong style="color: #065f46;">Reason for Return:</strong> ${order.returnReason}<br/>
             <p style="margin-top: 10px; font-size: 0.9rem; color: #065f46;">Attached is your updated invoice reflecting this approval. Our pickup partner will arrive at your registered address within 2-3 business days.</p>
          </div>
          <p>Please ensure all original packaging and accessories are included.</p>
          <p>Thank you for shopping with Xylo Electronics.</p>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #2874f0;">Hello ${order.customerName}!</h1>
          <p>This is a following-up message regarding your order <strong>#${order.orderNumber}</strong>.</p>
          <p>We are ensuring you have all the necessary details. Attached to this email is your full digital tax invoice.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2874f0; margin: 20px 0;">
             <strong>Order Status:</strong> ${order.orderStatus}<br/>
             <strong>Total Amount:</strong> ₹${order.total}<br/>
          </div>
          <p>Thank you for choosing Xylo Electronics!</p>
        </div>
      `,
      attachments: [{
        filename: `Invoice_${order.orderNumber}.pdf`,
        content: pdfBuffer
      }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('[Admin-Action] Email Error:', error.message);
      else console.log(`[Admin-Action] Email resent to ${order.customerEmail}`);
    });

    res.json({ success: true, message: 'Details and Invoice resent successfully!' });
  } catch (error) {
    console.error('[Admin-Action] Failed to resend details:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/track', async (req, res) => {
  const { orderNumber, email } = req.body;
  if (!orderNumber || !email) {
    return res.status(400).json({ message: 'Order number and email are required' });
  }

  try {
    const order = await Order.findOne({ 
      orderNumber: orderNumber.trim().toUpperCase(), 
      customerEmail: email.trim().toLowerCase() 
    });

    if (!order) return res.status(404).json({ message: 'Order not found. Please check your details.' });

    // Status mapping for tracking flow
    const statusFlow = {
      'Order Placed': 'ORDER_PLACED',
      'Processing': 'PICKING_ITEMS',
      'Shipped': 'IN_TRANSIT',
      'Delivered': 'DELIVERED',
      'Cancelled': 'CANCELLED'
    };

    // Calculate simulated checkpoints based on creation time logic similar to Orders.jsx
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const elapsedHours = (now - orderDate) / (1000 * 60 * 60);

    const history = [];
    history.push({ code: 'ORDER_PLACED', label: 'Order placed', enteredAt: order.createdAt, description: 'Order received successfully.' });

    if (elapsedHours > 1) {
      history.push({ code: 'PAYMENT_VERIFIED', label: 'Payment verified', enteredAt: new Date(orderDate.getTime() + 1*60*60*1000), description: 'Payment confirmed via secure gateway.' });
    }
    if (elapsedHours > 4) {
      history.push({ code: 'PICKING_ITEMS', label: 'Picking items', enteredAt: new Date(orderDate.getTime() + 4*60*60*1000), description: 'Warehouse team is packing your items.' });
    }
    if (elapsedHours > 24) {
      history.push({ code: 'IN_TRANSIT', label: 'In transit', enteredAt: new Date(orderDate.getTime() + 24*60*60*1000), description: 'Handed over to our courier partner.' });
    }

    res.json({
      orderNumber: order.orderNumber,
      email: order.customerEmail,
      customerName: order.customerName,
      status: order.orderStatus,
      currentStatus: {
        code: statusFlow[order.orderStatus] || 'ORDER_PLACED',
        label: order.orderStatus,
        enteredAt: order.createdAt
      },
      statusHistory: history,
      items: order.items,
      total: order.total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- USER ENDPOINTS (BASIC) ---
// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    const finalUsername = username || name;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ username: finalUsername, name: finalUsername, email, password });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  console.log('[DEBUG-API] Login attempt for:', req.body?.email);
  try {
    const { email, password } = req.body;
    
    // Check if body existed
    if (!email || !password) {
      console.log('[DEBUG-API] Missing credentials in body');
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('[DEBUG-API] User not found for email:', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log('[DEBUG-API] User found. Comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[DEBUG-API] Password mismatch');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log('[DEBUG-API] Login successful for user:', user.email);
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[DEBUG-API] Login Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// VERIFY EMAIL (FORGOT PASSWORD)
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User with this email does not exist' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log(`[API-OTP] Generated OTP ${otp} for ${email}`);

    // Send OTP via Email
    const mailOptions = {
        from: '"Xylo Electronics" <thameejahamed73@gmail.com>',
        to: email,
        subject: 'Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                <h1 style="color: #2874f0; margin-bottom: 5px;">Security Verification</h1>
                <p>Hi <strong>${user.name || user.username}</strong>,</p>
                <p>Use the following 6-digit OTP to verify your account and reset your password:</p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2874f0; margin: 20px auto; display: inline-block;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 13px;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
                <div style="margin-top: 20px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
                    Team Xylo Electronics
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error('[API-OTP] Email Error:', error.message);
        else console.log(`[API-OTP] OTP Email sent to ${email}`);
    });

    res.json({ success: true, msg: 'OTP sent successfully' });
  } catch (error) {
    console.error('[API-VERIFY-EMAIL] Error:', error.message);
    res.status(500).json({ msg: 'Server error during email verification' });
  }
});

// VERIFY OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Optional: Clear OTP after successful verification (or wait until reset-password)
    res.json({ success: true, msg: 'OTP verified successfully' });
  } catch (error) {
    console.error('[API-VERIFY-OTP] Error:', error.message);
    res.status(500).json({ msg: 'Server error during OTP verification' });
  }
});


// RESET PASSWORD
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User with this email does not exist' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.updatedAt = Date.now();

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send confirmation email
    const mailOptions = {
      from: '"Xylo Electronics" <thameejahamed73@gmail.com>',
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #2874f0; margin-bottom: 5px;">Password Reset!</h1>
          <p>Hi <strong>${user.name || user.username}</strong>,</p>
          <p>Your password for <strong>Xylo Electronics</strong> has been successfully updated.</p>
          <p>If you did not perform this action, please contact our security team immediately.</p>
          <div style="margin-top: 20px; font-size: 13px; color: #999;">This is an automated security notification.</div>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[API-RESET-PASSWORD] SMTP ERROR:', error.message);
      } else {
        console.log(`[API-RESET-PASSWORD] Reset confirmation sent to ${email}`);
      }
    });

    res.json({ success: true, msg: 'Password reset successfully' });
  } catch (error) {

    console.error('[API-RESET-PASSWORD] Error:', error.message);
    res.status(500).json({ msg: 'Server error during password reset' });
  }
});


// GET CURRENT USER
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Real-time Order Count (Dynamic based on Role)
    let orderCount = 0;
    if (user.role === 'admin') {
      // For Admin: Show total platform volume
      orderCount = await Order.countDocuments({});
    } else {
      // For Customer: Show personal purchase history
      orderCount = await Order.countDocuments({ user: user._id });
    }
    user.totalOrders = orderCount;

    res.json(user);
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

// UPDATE CURRENT USER PROFILE
app.put('/api/auth/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { fullName, phone, gender, dob, avatar, addresses, notificationPreferences } = req.body;
    console.log('[DEBUG-API] Update profile request received for:', decoded.user.id, { hasAddresses: !!addresses, hasPrefs: !!notificationPreferences });

    // Fields to update
    const updateFields = {};
    if (fullName) {
      updateFields.username = fullName; // Map fullName to username
      updateFields.name = fullName;     // Also map to name for consistency
    }
    if (phone !== undefined) updateFields.phone = phone;
    if (gender !== undefined) updateFields.gender = gender;
    if (dob !== undefined) updateFields.dob = dob;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (addresses !== undefined) updateFields.address = addresses;
    if (notificationPreferences !== undefined) updateFields.notificationPreferences = notificationPreferences;

    let user = await User.findByIdAndUpdate(
      decoded.user.id,
      { $set: updateFields },
      { returnDocument: 'after' }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('[API] Profile Update Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// --- CATEGORY ENDPOINTS ---
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CART ENDPOINTS ---
app.get('/api/cart', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const cart = await Cart.findOne({ userId: decoded.user.id }).populate('items.productId');
    res.json(cart || { items: [], totalAmount: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId, quantity, price } = req.body;

    let cart = await Cart.findOne({ userId: decoded.user.id });
    if (!cart) {
      cart = new Cart({ userId: decoded.user.id, items: [] });
    }

    const itemIdx = cart.items.findIndex(p => p.productId.toString() === productId);
    if (itemIdx > -1) {
      cart.items[itemIdx].quantity += (quantity || 1);
    } else {
      cart.items.push({ productId, quantity, price });
    }

    cart.totalAmount = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cart', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await Cart.findOneAndUpdate({ userId: decoded.user.id }, { items: [], totalAmount: 0 });
    res.json({ msg: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- WISHLIST ENDPOINTS ---
app.delete('/api/wishlist/:productId', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId } = req.params;

    await Wishlist.findOneAndDelete({ 
      userId: decoded.user.id, 
      productId: productId 
    });
    res.json({ msg: 'Product removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/wishlist', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch all separate items for this user
    const items = await Wishlist.find({ userId: decoded.user.id }).populate('productId').sort({ addedAt: -1 });
    
    // Flatten and merge snapshot with live product data
    const flattened = items.map(item => {
      const prod = item.productId || {};
      return {
        ...item._doc,
        // Ensure ID is a string for frontend compatibility
        productId: prod._id || item.productId,
        // Prefer live data if available, fallback to snapshot
        name: prod.name || item.name || 'Product',
        price: (typeof prod.price === 'number' ? prod.price : item.price) || 0,
        image: (prod.images && prod.images.length) ? prod.images[0] : (item.image || prod.image),
        brand: prod.brand || item.brand,
        category: prod.category || item.category,
        stock: prod.stock // Add stock status while we're at it
      };
    });

    console.log(`[API-Wishlist] GET: Found ${items.length} records, populated live details.`);
    res.json({ products: flattened });
  } catch (error) {
    console.error('[API-Wishlist] GET ERR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wishlist', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId, name, price, image, brand, category } = req.body;

    console.log('[API-Wishlist] Adding:', { productId, name, price });

    if (!productId) return res.status(400).json({ msg: 'Product ID is required' });

    // Check for existing to prevent duplicate docs
    const existing = await Wishlist.findOne({ userId: decoded.user.id, productId });
    if (existing) {
      return res.status(200).json(existing);
    }

    const newItem = new Wishlist({
      userId: decoded.user.id,
      productId,
      name: name || 'Product',
      price: parseFloat(price) || 0,
      image,
      brand,
      category
    });

    await newItem.save();
    console.log('[API-Wishlist] SUCCESS: Separate record created for', name);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('[API-Wishlist] ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// REMOVE FROM WISHLIST
app.delete('/api/wishlist/:productId', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId } = req.params;
    
    console.log('[API-Wishlist] REMOVE REQ:', { userId: decoded.user.id, productId });
    
    const result = await Wishlist.findOneAndDelete({ 
      userId: decoded.user.id, 
      productId: productId 
    });

    if (result) {
      console.log('[API-Wishlist] SUCCESS: Deleted', productId);
      res.json({ msg: 'Removed successfully' });
    } else {
      console.log('[API-Wishlist] NOT FOUND:', productId);
      res.status(404).json({ msg: 'Item not in wishlist' });
    }
  } catch (error) {
    console.error('[API-Wishlist] DELETE ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET SHARED WISHLIST
app.get('/api/wishlist/shared/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const items = await Wishlist.find({ userId }).sort({ addedAt: -1 });
    const user = await User.findById(userId).select('username name');
    const userName = user ? (user.username || user.name) : 'A user';
    res.json({ userName, products: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TOGGLE PRICE DROP NOTIFICATION
app.put('/api/wishlist/:productId/notify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId } = req.params;
    
    const item = await Wishlist.findOne({ userId: decoded.user.id, productId });
    if (!item) return res.status(404).json({ msg: 'Item not found in wishlist' });
    
    item.notifyOnPriceDrop = !item.notifyOnPriceDrop;
    await item.save();
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// --- SEEDING ENDPOINT ---
app.post('/api/seed', async (req, res) => {
  try {
    // Seeds ALL 50+ PRODUCTS
    const seeds = [
      { name: 'iPhone 15 Pro Max', description: "Apple's latest flagship smartphone.", price: 1099, category: 'electronics', images: ['https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg'], stock: 100 },
      { name: 'MacBook Air M2', description: 'Powerful and lightweight laptop from Apple.', price: 1199, category: 'computers', images: ['https://cdn8.web4s.vn/media/products/mac-air-m2/macbookairm2-midnight%201.jpg'], stock: 50 },
      { name: 'MacBook Pro 14" M2 Pro', description: 'High-performance laptop with M2 Pro chip.', price: 1999, category: 'computers', images: ['https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/refurb-mbp14-m2-silver-202303?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=ZmdRZFZQaThmdmpsRzMrNlU0TnIrNVN1UEFsa2dENVBwbUVOOUlVZ3dMdmRxTENLaEJiU0o5a1FqaDFsUHhYNjE1UUxLT2t0cW42N3FvQzVqaGhrVVltRElNTjY0QXJtekNDMXFQT2xOSU4rYWpGdS9XeFgvbS9ITnNYOEhYaG4'], stock: 30 },
      { name: 'Sony WH-1000XM5 Headphones', description: 'Noise-canceling headphones.', price: 399, category: 'audio', images: ['https://media-ik.croma.com/prod/https://media.tatacroma.com/Croma%20Assets/Entertainment/Headphones%20and%20Earphones/Images/272419_jqvb9x.png?tr=w-600'], stock: 200 },
      { name: 'Samsung 65" QLED TV', description: 'Immersive 4K TV.', price: 1499, category: 'electronics', images: ['https://cdn.mediamart.vn/images/product/qled-tivi-4k-samsung-65-inch-65q80c-smart-tv_5304e716.png'], stock: 10 },
      { name: 'Canon EOS R5', description: 'High-performance mirrorless camera.', price: 3799, category: 'cameras', images: ['https://i1.adis.ws/i/canon/eos-r5_front_rf24-105mmf4lisusm_square_32c26ad194234d42b3cd9e582a21c99b'], stock: 5 },
      { name: 'Apple Watch Series 7', description: 'Latest Apple Watch.', price: 399, category: 'electronics', images: ['https://akbroshop.com/wp-content/uploads/2022/08/hinh-aw-s7-xanh.jpg'], stock: 100 },
      { name: 'Dell XPS 15', description: 'Powerful laptop.', price: 1799, category: 'computers', images: ['https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/touch-black/notebook-xps-15-9530-t-black-gallery-1.psd?fmt=pjpg&wid=800'], stock: 20 },
      { name: 'Samsung Galaxy Tab S7+', description: 'Premium Android tablet.', price: 849, category: 'electronics', images: ['https://hanoicomputercdn.com/media/product/60370_may_tinh_bang_samsung_galaxy_tab_s7_plus_128gb_den.png'], stock: 30 },
      { name: 'Sony A7 IV', description: '33MP full-frame camera.', price: 2499, category: 'cameras', images: ['https://zshop.vn/images/detailed/92/1634812545_1667800.jpg'], stock: 10 },
      { name: 'ROG Zephyrus G14', description: 'Gaming laptop.', price: 1599, category: 'computers', images: ['https://www.primeabgb.com/wp-content/uploads/2025/08/ASUS-ROG-Zephyrus-G14-14-inch-AMD-Ryzen-AI-9-HX-370-RTX-5070-Ti-GPU-32GB-RAM-2TB-SSD-Gaming-Laptop-GA403WR-QS123WS.jpg'], stock: 25 },
      { name: 'AirPods Pro 2', description: 'Noise-canceling earphones.', price: 249, category: 'audio', images: ['https://m.media-amazon.com/images/I/51emillNpWL._AC_UF350,350_QL80_.jpg'], stock: 300 },
      { name: 'Nintendo Switch OLED', description: 'Gaming console.', price: 349, category: 'electronics', images: ['https://i.etsystatic.com/22580149/r/il/db60d8/3602821419/il_fullxfull.3602821419_303e.jpg'], stock: 80 },
      { name: 'Sony PlayStation 5 Console', description: 'Ultra-high speed SSD immersion.', price: 499, category: 'electronics', images: ['https://m.media-amazon.com/images/I/61qM7CPPcrL.jpg'], stock: 15 },
      { name: 'Sony DualSense Edge Wireless Controller', description: 'Custom controls edge.', price: 199, category: 'electronics', images: ['https://m.media-amazon.com/images/I/61wcZaT2vkL._AC_UF894,1000_QL80_.jpg'], stock: 30 },
      { name: 'Sony PlayStation VR2', description: 'Stunning visual fidelity.', price: 549, category: 'electronics', images: ['https://gmedia.playstation.com/is/image/SIEPDC/PSVR2-thumbnail-01-en-22feb22?$facebook$'], stock: 10 },
      { name: 'Sony Pulse 3D Wireless Headset', description: 'Fine-tuned 3D audio.', price: 99, category: 'audio', images: ['https://m.media-amazon.com/images/I/41IfEf6+4CL.jpg'], stock: 45 },
      { name: 'Samsung Galaxy S24 Ultra', description: 'Mobile AI era.', price: 1299, category: 'electronics', images: ['https://m.media-amazon.com/images/I/717Q2swzhBL._AC_UF1000,1000_QL80_.jpg'], stock: 25 },
      { name: 'Google Pixel 8', description: 'Sleek and sophisticated.', price: 699, category: 'electronics', images: ['https://www.designinfo.in/wp-content/uploads/2024/11/Google-Pixel-8-5G-8GB-RAM-256GB-Hazel-Imported-1.webp'], stock: 20 },
      { name: 'OnePlus 12 (Emerald Green)', description: 'Flagship performance.', price: 799, category: 'electronics', images: ['https://m.media-amazon.com/images/I/717Qo4MH97L._AC_UF1000,1000_QL80_.jpg'], stock: 35 },
      { name: 'Nothing Phone (2) Dark Edition', description: 'New smartphone era.', price: 599, category: 'electronics', images: ['https://m.media-amazon.com/images/I/61cZJcKweLL._AC_UF1000,1000_QL80_.jpg'], stock: 50 },
    ];

    await Product.deleteMany({});
    await Product.insertMany(seeds);
    res.json({ success: true, message: `Database seeded with ${seeds.length} initial products!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, customerName, customerAddress, customerPhone, orderNumber, items, itemsText, total } = req.body;
  
  // EXTRACTION: Link this order to the logged-in user if token exists
  let userId = null;
  let userPrefs = { email: true, sms: false }; // Defaults
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.user.id;
      
      // Fetch user's notification preferences
      const user = await User.findById(userId);
      if (user && user.notificationPreferences) {
        userPrefs = user.notificationPreferences;
      }
    } catch (err) {
      console.warn('[Backend-Relay] Order linkage: User token could not be verified.');
    }
  }

  console.log('-------------------------------------------');
  console.log(`[Backend-Relay] NEW INVOICE REQUEST: ORD ${orderNumber}`);
  console.log(`[Backend-Relay] USER ID LINKED: ${userId || 'Guest (Blocked)'}`);

  // ENFORCE AUTHENTICATION: All orders must be linked to a customer account
  if (!userId) {
    console.warn(`[SECURITY] Blocked unauthenticated order attempt for ${to}`);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication Required',
      message: 'Please sign in or create an account to complete your purchase.' 
    });
  }

  // ROLE CHECK: Admins cannot place orders
  if (userId) {
    const user = await User.findById(userId);
    if (user && user.role === 'admin') {
      console.error(`[PROTECTION] Admin ${to} blocked from placing order.`);
      return res.status(403).json({ success: false, error: 'Administrator accounts cannot place orders. Please use a standard customer account.' });
    }
  }

  if (!to || !customerName) {
     console.error('[Backend-Relay] ABORT: Missing primary recipient data');
     return res.status(400).json({ success: false, error: 'Recipient email/name missing' });
  }

  try {
    console.log('[Backend-Relay] Rendering PDF Attachment...');
    const pdfBuffer = await generateInvoicePDF({ 
      to, 
      customerName, 
      customerAddress, 
      customerPhone, 
      orderNumber, 
      items, 
      total, 
      paymentMethod: req.body.paymentMethod || 'card' 
    });
    console.log('[Backend-Relay] PDF Size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');

    const mailOptions = {
      from: '"Xylo Electronics" <thameejahamed73@gmail.com>',
      to: to,
      subject: subject,
      text: `Dear ${customerName},\n\nYour professional invoice for Order #${orderNumber} is attached as a PDF.\n\nThank you for shopping with Xylo!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #2874f0; margin-bottom: 5px;">Order Placed Successfully!</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Receipt ID: ${orderNumber}</p>
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>Thank you for choosing <strong>Xylo Electronics</strong>. We've received your order and are currently processing it for shipment.</p>
          <p>A professional digital tax invoice has been generated and attached to this email as a PDF for your records.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2874f0;">
             <strong>Order Number:</strong> ${orderNumber}<br/>
             <strong>Total Amount Charged:</strong> ₹${total}<br/>
             <strong>Delivery Status:</strong> Processing
          </div>
          <p style="margin-top: 20px; font-size: 13px; color: #999;">If you have any questions, please reply to this email or visit our support page.</p>
        </div>
      `,
      attachments: [
        {
          filename: `TaxInvoice_${orderNumber}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    // --- 1. SAVE TO MONGODB FIRST (Independent of Email) ---
    let dbItems = [];
    if (Array.isArray(items)) {
      dbItems = items.map(i => ({
        product: mongoose.Types.ObjectId.isValid(i.productId) ? i.productId : null,
        name: i.name || 'Product',
        price: parseFloat(i.price) || 0,
        quantity: parseInt(i.quantity) || 1
      }));
    } else if (typeof items === 'string') {
      dbItems = items.split('\n').filter(Boolean).map(line => ({ name: line.trim(), quantity: 1, price: 0 }));
    }

    try {
      const newOrder = new Order({
        orderNumber,
        user: userId, // Link to User ID
        customerName,
        customerEmail: to,
        customerAddress,
        customerPhone,
        items: dbItems,
        total: parseFloat(total) || 0,
        paymentStatus: 'completed',
        orderStatus: 'Order Placed',
        paymentMethod: req.body.paymentMethod || 'card'
      });
      await newOrder.save();
      console.log(`[Backend-Relay] SUCCESS: Order ${orderNumber} written to MongoDB.`);

      // --- 1.1 CREATE PAYMENT RECORD ---
      const newPayment = new Payment({
        userId: userId,
        orderId: newOrder._id,
        paymentId: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        method: req.body.paymentMethod || 'Card',
        amount: parseFloat(total) || 0,
        status: 'Success'
      });
      await newPayment.save();
      console.log(`[Backend-Relay] SUCCESS: Payment record for ${orderNumber} created.`);
      
    } catch (err) {
      console.error('[Backend-Relay] DB-WRITE ERROR:', err.message);
      // We continue to send email even if DB fails, or we could stop here
    }

    // --- 2. SEND EMAIL NOTIFICATION (If user prefers) ---
    if (userPrefs.email !== false) {
      console.log('[Backend-Relay] Attempting SMTP Dispatch (Gmail)...');
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('[Backend-Relay] SMTP ERROR:', error.message);
        } else {
          console.log(`[Backend-Relay] EMAIL SUCCESS: Sent to ${to}`);
        }
      });
    }

    res.status(200).json({ success: true, orderNumber });
  } catch (pdfError) {
    console.error('[Backend-Relay] PDF ENGINE FAILURE:', pdfError);
    res.status(500).json({ success: false, error: 'PDF generation failed' });
  }
});

// --- TESTIMONIALS & SITE-WIDE REVIEWS ---
app.post('/api/testimonials', async (req, res) => {
  try {
    const { userId, userName, userRole, rating, message, avatar } = req.body;
    
    if (!userName || !rating || !message) {
      return res.status(400).json({ message: 'Name, Rating, and Message are required.' });
    }

    const newTestimonial = new Testimonial({
      userId,
      userName,
      userRole,
      rating,
      message,
      avatar,
    });

    await newTestimonial.save();
    res.status(201).json({ message: 'Thank you for your review!', testimonial: newTestimonial });
  } catch (err) {
    console.error('[Backend-Testimonial] Error saving testimonial:', err);
    res.status(500).json({ message: 'Unable to save your review at this time.' });
  }
});

app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).limit(6);
    res.json(testimonials);
  } catch (err) {
    console.error('[Backend-Testimonial] Error fetching testimonials:', err);
    res.status(500).json({ message: 'Unable to load reviews.' });
  }
});

app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'reviews.userId',
        select: 'name username avatar'
      });
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Sort reviews by date descending (latest first)
    const sortedReviews = (product.reviews || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedReviews);
  } catch (err) {
    res.status(500).json({ message: 'Fetching reviews failed' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { productId, rating, comment } = req.body;
    if (!productId || rating === undefined ) {
      return res.status(400).json({ message: 'Product ID and Rating are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Initialize reviews array if it doesn't exist
    if (!product.reviews) product.reviews = [];

    const newReview = {
      userId: decoded.user.id,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };

    // Recalculate global stats safely based on existing + new
    const numReviews = (product.reviews || []).length + 1;
    const totalRating = (product.reviews || []).reduce((sum, r) => sum + r.rating, 0) + Number(rating);
    const avgRating = numReviews > 0 ? (totalRating / numReviews) : Number(rating);

    // Atomically Update Product Document
    await Product.findByIdAndUpdate(productId, {
      $push: { reviews: newReview },
      $set: { 
        ratings: avgRating,
        numReviews: numReviews
      }
    });
    
    console.log(`[DEBUG-SUCCESS] Atomic Update for Product ${productId} complete.`);

    res.status(201).json(newReview);
  } catch (err) {
    console.error('[API-FAILURE-REVIEWS]', {
      msg: err.message,
      stack: err.stack,
      body: req.body
    });
    res.status(500).json({ 
      success: false, 
      message: 'MongoDB Write Failed: ' + err.message,
      error_code: err.code
    });
  }
});

app.get('/api/reviews/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Deep search across all products for this user's reviews
    const products = await Product.find({ 'reviews.userId': decoded.user.id })
      .select('name image price reviews');
    
    const userReviews = [];
    products.forEach(p => {
      p.reviews.forEach(r => {
        if (r.userId.toString() === decoded.user.id) {
          userReviews.push({
            ...r.toObject(),
            productId: {
               _id: p._id,
               name: p.name,
               image: p.image || (p.images && p.images[0])
            }
          });
        }
      });
    });

    res.json(userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error('[API] Me-Reviews Error:', err);
    res.status(500).json({ message: 'Fetching your reviews failed' });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pull the review from ANY product where the review ID matches
    const product = await Product.findOneAndUpdate(
      { 'reviews._id': req.params.id, 'reviews.userId': decoded.user.id },
      { $pull: { reviews: { _id: req.params.id } } },
      { returnDocument: 'after' }
    );

    if (!product) return res.status(404).json({ message: 'Review not found or unauthorized' });

    // Recalculate stats
    const numReviews = product.reviews.length;
    const avgRating = numReviews > 0 
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews
      : 0;

    product.numReviews = numReviews;
    product.ratings = avgRating;
    await product.save();

    res.json({ message: 'Review removed directly from product document' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

app.use((err, req, res, next) => {
  console.error('[GLOBAL-ERROR]', err);
  res.status(500).json({ message: 'Global Server Error: ' + err.message });
});

const PORT = process.env.PORT || 8100;
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`XYLO ELECTRONICS BACKEND ACTIVE ON PORT ${PORT}`);
  console.log('Now supporting INR Invoicing & PDF Logic');
  console.log('MongoDB: Connected & Collections Ready');
  console.log('===========================================');
});


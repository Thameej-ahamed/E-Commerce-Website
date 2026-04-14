import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Box, Paper, Button, Stack, Divider, Chip, List, ListItem, ListItemText } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EmailIcon from '@mui/icons-material/Email';
import PrintIcon from '@mui/icons-material/Print';
import { useNotifier } from '../context/NotificationProvider';
import { sendOrderEmail } from '../services/emailService';

function formatDate(dateString) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return null;
  }
}

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotifier();

  const userEmail = React.useMemo(() => {
    const profile = JSON.parse(localStorage.getItem('xyloProfile') || '{}');
    return profile.email || 'thameejahamed73@gmail.com';
  }, []);

  const fallbackMeta = React.useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('xyloLastOrder'));
      return stored || null;
    } catch (error) {
      return null;
    }
  }, []);

  const stateMeta = location.state || {};

  const orderNumber = stateMeta.orderNumber || fallbackMeta?.orderNumber;
  const email = stateMeta.email || fallbackMeta?.email;
  const estimatedDelivery = stateMeta.estimatedDelivery;
  const items = Array.isArray(stateMeta.items) ? stateMeta.items : fallbackMeta?.items || [];
  const total = typeof stateMeta.total === 'number' ? stateMeta.total : fallbackMeta?.total || 0;
  const customerName = stateMeta.customerName || fallbackMeta?.customerName || JSON.parse(localStorage.getItem('xyloProfile') || '{}').fullName;
  const customerAddress = stateMeta.shippingAddress || fallbackMeta?.shippingAddress || 'No address provided';

  const formattedETA = formatDate(estimatedDelivery);

  const handleTrackOrder = () => {
    if (!orderNumber || !email) {
      navigate('/order-tracking');
      return;
    }
    const params = new URLSearchParams({ orderNumber, email }).toString();
    navigate(`/order-tracking?${params}`);
  };

  const isDispatched = React.useRef(false);

  const dispatchEmail = React.useCallback(async () => {
    if (!orderNumber || isDispatched.current) return;
    isDispatched.current = true;

    try {
      console.log('[OrderSuccess] Initiating real-time invoice for:', orderNumber);
      const response = await sendOrderEmail({
        orderNumber,
        email: email || userEmail,
        total,
        items,
        customerName: customerName,
        shippingAddress: customerAddress, // NEW
      });

      if (response && response.status === 200) {
        notify({ severity: 'success', message: `Order Confirmation hit your Gmail at ${email || userEmail}!` });
      } else {
        console.warn('[Dispatch] Automatic dispatch pending or failed:', response);
        notify({
          severity: 'warning',
          message: 'Real-time email dispatch is being processed. If not received, please check your Spam folder or check your EmailJS Quota.',
          autoHideDuration: 6000,
        });
      }
    } catch (error) {
      console.error('Quiet dispatch failed:', error);
      isDispatched.current = false;
    }
  }, [orderNumber, email, userEmail, total, items, customerName, notify]);

  function numberToWords(num) {
    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];
    const convertSection = n => {
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

  const handlePrintInvoice = () => {
    const taxableValue = total;
    const cgst = taxableValue * 0.09;
    const sgst = taxableValue * 0.09;
    const grandTotal = taxableValue + cgst + sgst;

    const methodLabels = { card: 'CREDIT/DEBIT CARD', upi: 'UPI / WALLET', netbanking: 'NET BANKING', cod: 'CASH ON DELIVERY' };
    const displayMethod = methodLabels[stateMeta.paymentMethod] || 'PAYMENT CONFIRMED';
    const dest = customerAddress ? customerAddress.split(',').slice(-2).join(', ').trim().toUpperCase() : 'INDIA';

    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Tax Invoice - ${orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; color: #000; font-size: 9px; }
            .container { width: 595px; margin: 0 auto; border: 1.5px solid #000; }
            .header-title { text-align: center; font-weight: bold; border-bottom: 1px solid #000; padding: 4px; font-size: 11px; }
            .row { display: flex; border-bottom: 1px solid #000; min-height: 20px; }
            .col { flex: 1; padding: 4px; border-right: 1px solid #000; position: relative; }
            .col:last-child { border-right: none; }
            .label { font-size: 8px; font-weight: bold; margin-bottom: 2px; }
            .bold { font-weight: bold; }
            
            table { width: 100%; border-collapse: collapse; }
            th { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: left; }
            td { border-right: 1px solid #000; padding: 4px; vertical-align: top; font-size: 9px; }
            td:last-child, th:last-child { border-right: none; }

            .totals-area { padding: 4px; border-top: 1px solid #000; }
            .totals-grid { display: grid; grid-template-columns: 1fr 100px; gap: 4px; }
            
            .hsn-table { margin-top: 10px; border-top: 1px solid #000; }
            .hsn-table th, .hsn-table td { border: 1px solid #000; font-size: 7px; text-align: center; }
            
            .footer { padding: 10px; min-height: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="container">
            <div class="header-title">TAX INVOICE</div>
            
            <!-- Company & Invoice Info -->
            <div class="row" style="min-height: 80px;">
              <div class="col" style="flex: 1.2;">
                <div class="bold" style="font-size: 11px;">XYLO ELECTRONICS</div>
                <div style="font-size: 8px;">500 Innovation Way, Suite 10,</div>
                <div style="font-size: 8px;">Mumbai, MH 400001, India.</div>
                <div style="font-size: 8px;">GSTIN/UIN: 33ASQPK6831P1Z1</div>
              </div>
              <div class="col" style="padding: 0;">
                 <div style="display: flex; height: 100%;">
                    <div style="flex: 1; border-right: 1px solid #000; padding: 4px;">
                      <div class="label">Invoice No.</div>
                      <div class="bold">${orderNumber}</div>
                    </div>
                    <div style="flex: 1; padding: 4px;">
                      <div class="label">Dated</div>
                      <div class="bold">${new Date().toLocaleDateString()}</div>
                    </div>
                 </div>
              </div>
            </div>

            <div class="row">
              <div class="col" style="flex: 1.2;">&nbsp;</div>
              <div class="col" style="padding: 0;">
                <div style="display: flex;">
                  <div style="flex: 1; border-right: 1px solid #000; padding: 4px;">
                    <div class="label">Mode/Terms of Payment</div>
                    <div class="bold">${displayMethod}</div>
                  </div>
                  <div style="flex: 1; padding: 4px;">&nbsp;</div>
                </div>
              </div>
            </div>

            <!-- Buyer & Logistics -->
            <div class="row" style="min-height: 70px;">
               <div class="col" style="flex: 1.2;">
                  <div class="label">Buyer (Bill to):</div>
                  <div class="bold" style="font-size: 10px;">${customerName}</div>
                  <div style="font-size: 8px;">${customerAddress}</div>
                  <div style="font-size: 8px;">thameejahamed73@gmail.com</div>
               </div>
               <div class="col" style="padding: 0;">
                  <div style="display: flex; border-bottom: 1px solid #000;">
                    <div style="flex: 1; border-right: 1px solid #000; padding: 4px;">
                      <div class="label">Dispatch Doc No.</div>
                      <div class="bold">PCP-GST-7468</div>
                    </div>
                    <div style="flex: 1; padding: 4px;">
                      <div class="label">Delivery Note</div>
                      <div class="bold">HAND OVER CONFIRMED</div>
                    </div>
                  </div>
                  <div style="padding: 4px;">
                    <div class="label">Destination</div>
                    <div class="bold">${dest}</div>
                  </div>
               </div>
            </div>

            <!-- Product Table -->
            <table style="border-bottom: 1px solid #000;">
              <thead>
                <tr style="height: 30px;">
                  <th style="width: 25px; text-align: center;">Sl No.</th>
                  <th>Description of Goods and Services</th>
                  <th style="width: 45px; text-align: center;">HSN/SAC</th>
                  <th style="width: 45px; text-align: center;">Quantity</th>
                  <th style="width: 55px; text-align: right;">Rate</th>
                  <th style="width: 35px; text-align: center;">per</th>
                  <th style="width: 35px; text-align: center;">Disc %</th>
                  <th style="width: 65px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item, i) => `
                  <tr>
                    <td style="text-align: center;">${i + 1}</td>
                    <td class="bold">${item.name}</td>
                    <td style="text-align: center;">8471</td>
                    <td style="text-align: center; font-weight: bold;">${item.quantity} ${item.quantity > 1 ? 'nos' : 'no'}</td>
                    <td style="text-align: right;">₹${Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: center;">${item.quantity > 1 ? 'nos' : 'no'}</td>
                    <td style="text-align: center;">-</td>
                    <td style="text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `
                  )
                  .join('')}
                <tr style="height: 180px;">
                  <td style="border-bottom: 1px solid #000;"></td>
                  <td style="border-bottom: 1px solid #000;"></td>
                  <td style="border-bottom: 1px solid #000;"></td>
                  <td style="border-bottom: 1px solid #000;"></td>
                  <td style="border-bottom: 1px solid #000;"></td>
                  <td style="border-bottom: 1px solid #000;"></td>
                  <td style="border-bottom: 1px solid #000;"></td>
                  <td style="border-bottom: 1px solid #000; text-align: right; vertical-align: bottom; padding: 4px;">
                    <div style="border-top: 1px solid #000; padding-top: 2px;" class="bold">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div style="padding: 10px 0 10px 10px; display: flex; justify-content: space-between; border-bottom: 1.5px solid #000;">
              <div style="flex: 1.2;">
                 <div style="margin-top: 10px;">
                    <div style="font-size: 8px;">Amount Chargeable (in words):</div>
                    <div class="bold" style="font-size: 8px;">${numberToWords(grandTotal.toFixed(2))}</div>
                 </div>
              </div>
              <div style="width: 200px; padding-right: 10px;">
                 <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span class="bold">CGST OUTPUT TAX @ 9%</span>
                    <span class="bold">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span class="bold">SGST OUTPUT TAX @ 9%</span>
                    <span class="bold">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div style="display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 5px;">
                    <span class="bold" style="font-size: 11px;">Total</span>
                    <span class="bold" style="font-size: 11px;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                 </div>
              </div>
            </div>

            <!-- HSN Info -->
            <div style="padding: 5px; border-bottom: 1px solid #000;">
              <table class="hsn-table">
                <thead>
                  <tr>
                    <th>HSN/SAC</th>
                    <th>Taxable Value</th>
                    <th>Central Tax Rate</th>
                    <th>Central Tax Amt</th>
                    <th>State Tax Rate</th>
                    <th>State Tax Amt</th>
                    <th>Total Tax Amt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>8471</td>
                    <td>$${taxableValue.toFixed(2)}</td>
                    <td>9%</td>
                    <td>$${cgst.toFixed(2)}</td>
                    <td>9%</td>
                    <td>$${sgst.toFixed(2)}</td>
                    <td>$${(cgst + sgst).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div style="margin-top: 4px; font-size: 8px;">
                 Tax Amount (in words): <span class="bold">${numberToWords((cgst + sgst).toFixed(2))}</span>
              </div>
            </div>

            <!-- Final Footer -->
            <div class="footer">
              <div style="font-size: 8px;">Company's PAN: <span class="bold">ASQPK6831P</span></div>
              <div style="text-align: right;">
                 <div class="bold" style="margin-bottom: 30px;">for XYLO ELECTRONICS</div>
                 <div style="border-top: 1px solid #000; padding: 4px 20px; font-size: 8px;">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
    notify({ severity: 'success', message: 'Opening official tax invoice for printing...' });
  };

  React.useEffect(() => {
    // REDUNDANT DISPATCH REMOVED:
    // Email is now sent ONLY once from Checkout.jsx to ensure full data capture.
    console.log('[OrderSuccess] Confirmation for:', orderNumber);
  }, [orderNumber]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 10 }}>
      <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 4, maxWidth: 640 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Order Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Thank you for your purchase. We’re prepping your order and will send tracking updates shortly.
        </Typography>

        {orderNumber && (
          <Stack spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
            <Chip label={`Order #: ${orderNumber}`} color="primary" variant="outlined" />
            {email && (
              <Typography variant="caption" color="text.secondary">
                Confirmation sent to {email}
              </Typography>
            )}
            {formattedETA && (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <LocalShippingIcon fontSize="small" color="primary" />
                <Typography variant="caption" color="text.secondary">
                  Estimated delivery: {formattedETA}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        {items.length > 0 && (
          <Box sx={{ textAlign: 'left', mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Items in this shipment
            </Typography>
            <List dense>
              {items.map(item => (
                <ListItem key={`${item.productId}-${item.name}`} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText primary={item.name} secondary={`Qty ${item.quantity} • ₹${Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
                </ListItem>
              ))}
            </List>
            {typeof total === 'number' && <Divider sx={{ my: 2 }} />}
            {typeof total === 'number' && (
              <Typography variant="subtitle2" fontWeight={600}>
                Order total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            )}
          </Box>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="contained" color="primary" sx={{ px: 4, borderRadius: 6 }} onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} sx={{ borderRadius: 6 }} onClick={handlePrintInvoice}>
            Print Invoice
          </Button>
          <Button variant="outlined" startIcon={<LocalShippingIcon />} sx={{ borderRadius: 6 }} onClick={handleTrackOrder}>
            Track Order
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default OrderSuccess;

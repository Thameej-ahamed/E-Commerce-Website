import { apiClient } from './apiClient';

/**
 * Professional Backend Email Relay
 * COMPLETELY REMOVED EmailJS client-side sending.
 * Routes all receipts via the dedicated Node.js relay on port 5002 (PDF Optimized).
 */
export const sendOrderEmail = async (orderData) => {
  const numericTotal = Number(orderData.total) || 0;
  const totalVal = numericTotal.toFixed(2);
  const itemsText = (orderData.items || []).map(i => `${i.name || 'Product'} (x${i.quantity || 1}) - $${Number((i.price || 0) * (i.quantity || 1)).toFixed(2)}`).join('\n');

  const payload = {
    to: orderData.email || 'thameejahamed73@gmail.com',
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    customerName: orderData.customerName || 'Xylo Customer',
    customerAddress: orderData.shippingAddress || 'No Address Provided',
    customerPhone: orderData.phoneNumber || '',
    orderNumber: orderData.orderNumber || 'ORD-UNKNOWN',
    items: orderData.items || [], // SEND RAW ARRAY FOR DB
    itemsText: itemsText, // SEND FORMATTED TEXT FOR PDF Fallback
    total: totalVal,
    paymentMethod: orderData.paymentMethod || 'card',
    timestamp: new Date().toISOString()
  };

  try {
    console.log('[Backend-Relay] Initiating PDF-Invoicing dispatch via apiClient to:', payload.to);
    
    // Switch to apiClient (which adds Authorization header automatically)
    const response = await apiClient.post('send-email', payload);
    
    if (response.status === 200) {
      console.log('[Backend-Relay] SUCCESS: Dispatch confirmed with PDF attachment.');
      return { ok: true, status: 200, data: response.data };
    }
    
    return { ok: false, status: response.status, data: response.data };
  } catch (error) {
    console.error('[Backend-Relay] CRITICAL: Relay offline.', error);
    return { ok: false, status: 500, error: 'Relay unreachable' };
  }
};

import * as React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Divider,
  Button,
  Chip,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useNotifier } from '../context/NotificationProvider';
import { apiClient } from '../services/apiClient';

import { productSeeds } from '../utils/mockData';

const steps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

function Orders() {
  const [tabValue, setTabValue] = React.useState(0);
  const { notify } = useNotifier();
  const [orders, setOrders] = React.useState([]);
  const [returnDialogOpen, setReturnDialogOpen] = React.useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = React.useState(null);
  const [returnReason, setReturnReason] = React.useState('');

  const returnReasons = [
    'Manufacturing Defect',
    'Screen / Hardware Damage',
    'Wrong Product Received',
    'Performance / Quality Issues',
    'Wrong Size / Color / Specification'
  ];

  const loadOrders = async () => {
    try {
      const response = await apiClient.get('orders');
      if (response.data) {
        const parsed = response.data.map(order => {
          const status = order.orderStatus || 'Order Placed';
          
          // Map string status to stepper index
          const statusToIndex = {
            'Order Placed': 0,
            'Processing': 1,
            'Shipped': 2,
            'Out for Delivery': 3,
            'Delivered': 4,
            'Cancelled': -1
          };

          const trackingStep = statusToIndex[status] ?? 0;

          return {
            ...order,
            status: status,
            trackingStep: trackingStep,
            date: new Date(order.createdAt).toLocaleDateString(),
            items: (order.items || []).map(item => {
              const masterProduct = productSeeds.find(p => p.name === item.name);
              return {
                ...item,
                image: item.image || masterProduct?.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.name}`,
                name: item.name || 'Electronic Gadget',
              };
            }),
          };
        });
        setOrders(parsed);
      }
    } catch (e) {
      console.error('Error loading orders from DB:', e);
      notify({ severity: 'error', message: 'Failed to load orders from database.' });
    }
  };

  React.useEffect(() => {
    loadOrders();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDownloadInvoice = order => {
    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            h1 { color: #2874f0; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f9f9f9; }
            .total { font-weight: bold; font-size: 1.2rem; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h1>XYLO ELECTRONICS</h1>
            <p>Order Number: ${order.orderNumber}</p>
            <p>Date: ${order.date}</p>
          </div>
          <h3>Order Items</h3>
          ${order.items.map(item => `<div class="item"><span>${item.name} x1</span><span>₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>`).join('')}
          <div class="total">Total: ₹${order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <p style="margin-top: 50px; text-align: center; color: #999;">Thank you for your purchase!</p>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
    notify({ severity: 'success', message: `Invoice for ${order.orderNumber} prepared for printing.` });
  };

  const handleReturnRequest = order => {
    setSelectedReturnOrder(order);
    setReturnDialogOpen(true);
  };

  const submitReturnRequest = async () => {
    if (!returnReason) {
      notify({ severity: 'warning', message: 'Please select a reason for return.' });
      return;
    }
    
    try {
      await apiClient.put(`orders/${selectedReturnOrder._id}/return`, { reason: returnReason });
      notify({ severity: 'success', message: `Return request for ${selectedReturnOrder.orderNumber} submitted successfully.` });
      setReturnDialogOpen(false);
      setReturnReason('');
      loadOrders();
    } catch (e) {
      notify({ severity: 'error', message: 'Failed to submit return request.' });
    }
  };

  const handleCancelOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to cancel order ${orderNumber}?`)) return;

    try {
      await apiClient.put(`orders/${orderId}/cancel`);
      notify({ severity: 'success', message: `Order ${orderNumber} cancelled successfully.` });
      loadOrders(); // Refresh order list
    } catch (e) {
      console.error('Error cancelling order:', e);
      const errorMessage = e.response?.data?.message || 'Failed to cancel order.';
      notify({ severity: 'error', message: errorMessage });
    }
  };

  const filteredOrders = orders.filter(order => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return order.status === 'Shipped' || order.status === 'Processing';
    if (tabValue === 2) return order.status === 'Delivered';
    if (tabValue === 3) return order.status === 'Cancelled';
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <ShoppingBagIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ color: '#111827' }}>
            My Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your purchases, track shipments, and request returns.
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 6, border: '1px solid #e5e7eb', mb: 4, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: '#fafafa',
            '& .MuiTab-root': { fontWeight: 700, px: 4, textTransform: 'none' },
          }}
        >
          <Tab label="All Orders" />
          <Tab label="Ongoing / Pending" />
          <Tab label="Delivered" />
          <Tab label="Cancelled" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {filteredOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FilterListIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No orders found in this category.
              </Typography>
              <Button href="/shop" sx={{ mt: 2 }}>
                Browse Catalog
              </Button>
            </Box>
          ) : (
            <Stack spacing={4}>
              {filteredOrders.map(order => (
                <Card key={order.id} elevation={0} sx={{ borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          ORDER PLACED
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order.date}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          TOTAL AMOUNT
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          SHIP TO
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order.customerName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3} sx={{ textAlign: { sm: 'right' } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          ORDER # {order.orderNumber}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ mt: 0.5 }}>
                          <Button size="small" variant="text" onClick={() => handleDownloadInvoice(order)} startIcon={<DownloadIcon />}>
                            Invoice
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>

                  <CardContent sx={{ p: 4 }}>
                    <Stack spacing={4}>
                      {/* Tracking Section */}
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalShippingIcon color="primary" /> Shipment Tracking
                          </Typography>
                          <Chip 
                            label={order.status} 
                            color={order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'error' : 'primary'} 
                            variant="outlined" 
                            sx={{ fontWeight: 800 }} 
                          />
                        </Stack>
                        <Stepper activeStep={order.trackingStep} alternativeLabel>
                          {steps.map(label => (
                            <Step key={label}>
                              <StepLabel>{label}</StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>

                      <Divider />

                      {/* Items List */}
                      <Stack spacing={2}>
                        {order.items.map((item, idx) => (
                          <Grid container key={idx} spacing={2} alignItems="center">
                            <Grid item>
                              <Box
                                component="img"
                                src={item.image}
                                alt={item.name}
                                sx={{ width: 80, height: 80, borderRadius: 3, objectFit: 'cover', border: '1px solid #e5e7eb' }}
                              />
                            </Grid>
                            <Grid item xs>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {item.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Quantity: 1
                              </Typography>
                              <Typography variant="subtitle2" color="primary" fontWeight={700}>
                                ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </Typography>
                            </Grid>
                            <Grid item>
                              <Stack spacing={1}>
                                <Button size="small" variant="contained" href={`/order-tracking?orderNumber=${order.orderNumber}&email=${order.customerEmail}`}>
                                  Track Package
                                </Button>
                                {(order.status === 'Order Placed' || order.status === 'Processing') && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleCancelOrder(order._id, order.orderNumber)}
                                  >
                                    Cancel Order
                                  </Button>
                                )}
                                {order.status !== 'Cancelled' && order.status !== 'Returned' && (
                                  <Tooltip title={order.status === 'Delivered' ? "" : "Return requests are available once the order is delivered."}>
                                    <span>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={order.status !== 'Delivered'}
                                        onClick={() => handleReturnRequest(order)}
                                        startIcon={<AssignmentReturnIcon />}
                                      >
                                        Return Item
                                      </Button>
                                    </span>
                                  </Tooltip>
                                )}
                              </Stack>
                            </Grid>
                          </Grid>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

      <Box sx={{ p: 4, bgcolor: '#eff6ff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
        <InfoOutlinedIcon color="primary" />
        <Typography variant="body2" color="#1e40af">
          Items ordered cannot be cancelled once they are shipped. You can initiate a return within 30 days of delivery.
        </Typography>
      </Box>

      {/* Return Reason Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Initiate Return</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Order: <strong>#{selectedReturnOrder?.orderNumber}</strong>
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Reason for Return</Typography>
          <Stack spacing={1}>
            {returnReasons.map((reason) => (
              <Button
                key={reason}
                variant={returnReason === reason ? "contained" : "outlined"}
                onClick={() => setReturnReason(reason)}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none', 
                  py: 1.5, 
                  borderRadius: 3,
                  fontWeight: returnReason === reason ? 700 : 500
                }}
              >
                {reason}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitReturnRequest} sx={{ px: 4, borderRadius: 3 }}>Submit Request</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Orders;

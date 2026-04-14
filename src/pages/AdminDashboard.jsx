import * as React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Stack,
  Card,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { apiClient } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';

const statusSteps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

function AdminDashboard() {
  const [orders, setOrders] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [openDetail, setOpenDetail] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  
  // Product state
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState(null);
  const [productForm, setProductForm] = React.useState({
     name: '', price: 0, stock: 0, category: '', brand: '', description: '', image: ''
  });

  const { notify } = useNotifier();

  const fetchOrders = async () => {
    try {
      const { data } = await apiClient.get('orders');
      setOrders(data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('products');
      setProducts(data);
    } catch (err) {
      console.error('Fetch products error:', err);
    }
  };

  const initDashboard = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchProducts()]);
    setLoading(false);
  };

  React.useEffect(() => {
    initDashboard();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProductSubmit = async () => {
    try {
      if (editingProduct) {
        await apiClient.put(`products/${editingProduct._id}`, productForm);
        notify({ severity: 'success', message: 'Product updated successfully' });
      } else {
        await apiClient.post('products', productForm);
        notify({ severity: 'success', message: 'Product added successfully' });
      }
      setProductDialogOpen(false);
      fetchProducts();
    } catch (err) {
      notify({ severity: 'error', message: 'Failed to save product' });
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`products/${id}`);
        notify({ severity: 'success', message: 'Product deleted' });
        fetchProducts();
      } catch (err) {
        notify({ severity: 'error', message: 'Failed to delete product' });
      }
    }
  };

  const openAddProduct = () => {
     setEditingProduct(null);
     setProductForm({ name: '', price: 0, stock: 0, category: 'electronics', brand: '', description: '', image: '' });
     setProductDialogOpen(true);
  };

  const openEditProduct = (prod) => {
     setEditingProduct(prod);
     setProductForm({ ...prod });
     setProductDialogOpen(true);
  };

  const handleResendDetails = async (orderId) => {
    try {
      notify({ severity: 'info', message: 'Sending order details to customer...' });
      await apiClient.post(`orders/${orderId}/resend-details`);
      notify({ severity: 'success', message: 'Order details sent successfully!' });
    } catch (err) {
      notify({ severity: 'error', message: 'Failed to send order details.' });
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await apiClient.put(`orders/${orderId}/status`, { status: newStatus });
      notify({ severity: 'success', message: `Order updated to ${newStatus}` });
      setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, orderStatus: newStatus } : o)));
    } catch (err) {
      notify({ severity: 'error', message: 'Failed to update order status.' });
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
      case 'Shipped': return 'info';
      case 'Processing': return 'warning';
      default: return 'primary';
    }
  };

  if (loading) {
     return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
         <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
         <Box>
            <Typography variant="h3" fontWeight={800}>Administrative Dashboard</Typography>
            <Typography variant="body1" color="text.secondary">Manager Portal for Xylo Electronics Operations</Typography>
         </Box>
         <Box sx={{ flexGrow: 1 }} />
         <Button startIcon={<RefreshIcon />} variant="outlined" onClick={initDashboard} sx={{ borderRadius: 4 }}>Refresh</Button>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Orders Overview" sx={{ fontWeight: 700 }} />
          <Tab label="Inventory Management" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Grid container spacing={4} sx={{ mb: 6 }}>
             <Grid item xs={12} md={3}>
                <Card sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                   <Typography variant="h4" fontWeight={900} color="primary">{orders.length}</Typography>
                   <Typography variant="subtitle2" color="text.secondary">Total Transactions</Typography>
                </Card>
             </Grid>
             <Grid item xs={12} md={3}>
                <Card sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                   <Typography variant="h4" fontWeight={900} color="warning.main">
                      {orders.filter(o => o.orderStatus === 'Processing' || o.orderStatus === 'Order Placed').length}
                   </Typography>
                   <Typography variant="subtitle2" color="text.secondary">Pending Dispatch</Typography>
                </Card>
             </Grid>
             <Grid item xs={12} md={3}>
                <Card sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                   <Typography variant="h4" fontWeight={900} color="success.main">₹{(orders.reduce((sum, o) => sum + (o.total || 0), 0) / 100000).toFixed(1)}L</Typography>
                   <Typography variant="subtitle2" color="text.secondary">Gross Revenue</Typography>
                </Card>
             </Grid>
             <Grid item xs={12} md={3}>
                <Card sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                   <Typography variant="h4" fontWeight={900} color="error.main">{orders.filter(o => o.orderStatus === 'Cancelled').length}</Typography>
                   <Typography variant="subtitle2" color="text.secondary">Cancelled</Typography>
                </Card>
             </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, py: 2, pl: 3 }}>ORDER ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>CUSTOMER</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>ITEMS</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>AMOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>MANAGE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, pr: 3 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main', pl: 3, py: 1.5 }}>
                       {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.8rem' }}>
                           {order.customerName?.charAt(0)}
                        </Avatar>
                        <Box>
                           <Typography variant="body2" fontWeight={700}>{order.customerName}</Typography>
                           <Typography variant="caption" color="text.secondary">{order.customerEmail}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                       <Box sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                             {order.items?.[0]?.name || 'Product'}
                          </Typography>
                          {order.items?.length > 1 && (
                             <Typography variant="caption" color="primary" fontWeight={700}>
                                + {order.items.length - 1} more items
                             </Typography>
                          )}
                       </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                       {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>
                       ₹{order.total?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                         label={order.orderStatus} 
                         color={getStatusColor(order.orderStatus)} 
                         size="small" 
                         sx={{ fontWeight: 700, px: 1, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                       <FormControl size="small" fullWidth>
                          <Select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            sx={{ fontSize: '0.75rem', fontWeight: 600, borderRadius: 3 }}
                          >
                             {statusSteps.map(step => (
                                <MenuItem key={step} value={step} sx={{ fontSize: '0.8rem' }}>{step}</MenuItem>
                             ))}
                          </Select>
                       </FormControl>
                    </TableCell>
                     <TableCell align="right" sx={{ pr: 3 }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Send Details to Customer">
                          <IconButton size="small" color="primary" onClick={() => handleResendDetails(order._id)}>
                            <SendIcon fontSize="small" sx={{ transform: 'rotate(-45deg)', fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Order Details">
                          <IconButton size="small" color="primary" onClick={() => { setSelectedOrder(order); setOpenDetail(true); }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDetail} onClose={() => setOpenDetail(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 6, p: 2 } }}>
            <DialogTitle>
               <Typography variant="h5" fontWeight={800}>Order Details - {selectedOrder?.orderNumber}</Typography>
            </DialogTitle>
            <DialogContent dividers>
                {selectedOrder && (
                  <Grid container spacing={4}>
                     {selectedOrder.returnReason && (
                        <Grid item xs={12}>
                           <Box sx={{ p: 2.5, bgcolor: '#fff1f2', borderRadius: 4, border: '1px solid #fda4af', mb: 1 }}>
                              <Typography variant="overline" color="error.main" fontWeight={900}>Customer's Return Reason</Typography>
                              <Typography variant="h6" color="#9f1239" fontWeight={800}>⚠️ {selectedOrder.returnReason}</Typography>
                           </Box>
                        </Grid>
                     )}
                     <Grid item xs={12} md={6}>
                        <Typography variant="overline" color="text.secondary" fontWeight={800}>Customer Info</Typography>
                        <Typography variant="body1"><strong>Name:</strong> {selectedOrder.customerName}</Typography>
                        <Typography variant="body1"><strong>Email:</strong> {selectedOrder.customerEmail}</Typography>
                        <Typography variant="body1"><strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}><strong>Shipping:</strong> {selectedOrder.customerAddress}</Typography>
                     </Grid>
                     <Grid item xs={12} md={6}>
                        <Typography variant="overline" color="text.secondary" fontWeight={800}>Items Purchased</Typography>
                        <Stack spacing={1}>
                           {selectedOrder.items?.map((item, idx) => (
                              <Stack key={idx} direction="row" justifyContent="space-between" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 3 }}>
                                 <Typography variant="body2" fontWeight={600}>{item.name} x{item.quantity}</Typography>
                                 <Typography variant="body2" fontWeight={800}>₹{item.price?.toLocaleString()}</Typography>
                              </Stack>
                           ))}
                        </Stack>
                        <Box sx={{ mt: 3, textAlign: 'right' }}>
                           <Typography variant="h6" fontWeight={900} color="primary">Total: ₹{selectedOrder.total?.toLocaleString()}</Typography>
                        </Box>
                     </Grid>
                  </Grid>
               )}
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
               <Button variant="outlined" startIcon={<SendIcon sx={{ transform: 'rotate(-45deg)' }} />} onClick={() => handleResendDetails(selectedOrder?._id)}>
                  Send Details to User
               </Button>
               <Button variant="contained" onClick={() => setOpenDetail(false)} sx={{ fontWeight: 700, px: 3 }}>Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {tabValue === 1 && (
        <Box>
           <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={700}>Catalog & Stock Levels</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAddProduct} sx={{ borderRadius: 4 }}>
                 Add Product
              </Button>
           </Stack>

           <TableContainer component={Paper} sx={{ borderRadius: 6, border: '1px solid #e5e7eb' }}>
             <Table>
               <TableHead sx={{ bgcolor: '#f8fafc' }}>
                 <TableRow>
                   <TableCell sx={{ fontWeight: 800 }}>PRODUCT</TableCell>
                   <TableCell sx={{ fontWeight: 800 }}>CATEGORY</TableCell>
                   <TableCell sx={{ fontWeight: 800 }}>PRICE</TableCell>
                   <TableCell sx={{ fontWeight: 800 }}>STOCK</TableCell>
                   <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {products.map((prod) => (
                   <TableRow key={prod._id} hover>
                     <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                           <Avatar variant="rounded" src={prod.image} sx={{ width: 40, height: 40 }} />
                           <Typography variant="body2" fontWeight={700}>{prod.name}</Typography>
                        </Stack>
                     </TableCell>
                     <TableCell><Chip label={prod.category} size="small" variant="outlined" /></TableCell>
                     <TableCell>₹{prod.price?.toLocaleString()}</TableCell>
                     <TableCell>
                        <Chip 
                           label={`${prod.stock} in stock`} 
                           color={prod.stock > 10 ? 'success' : 'error'} 
                           variant={prod.stock > 10 ? 'outlined' : 'filled'}
                           size="small"
                        />
                     </TableCell>
                     <TableCell align="right">
                        <IconButton color="primary" onClick={() => openEditProduct(prod)}><EditIcon fontSize="small"/></IconButton>
                        <IconButton color="error" onClick={() => handleDeleteProduct(prod._id)}><DeleteIcon fontSize="small"/></IconButton>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>

           {/* Add/Edit Product Dialog */}
           <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} fullWidth maxWidth="sm">
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                 <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField label="Product Name" fullWidth value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                    <Stack direction="row" spacing={2}>
                       <TextField label="Price (₹)" type="number" fullWidth value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                       <TextField label="Stock Level" type="number" fullWidth value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                       <TextField label="Category" fullWidth value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} />
                       <TextField label="Brand" fullWidth value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} />
                    </Stack>
                    <TextField label="Image URL" fullWidth value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
                    <TextField label="Description" multiline rows={4} fullWidth value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                 </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                 <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
                 <Button variant="contained" onClick={handleProductSubmit}>Save Product</Button>
              </DialogActions>
           </Dialog>
        </Box>
      )}
    </Container>
  );
}

export default AdminDashboard;

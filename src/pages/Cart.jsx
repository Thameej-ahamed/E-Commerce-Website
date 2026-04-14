import React from 'react';
import { Container, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button, Typography, Divider, Paper, Stack, Box, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useNotifier } from '../context/NotificationProvider';
import { formatCurrency } from '../utils/currencyFormatter';

function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const { notify } = useNotifier();
  const { currency, t } = useSettings();
  
  React.useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('xyloProfile') || '{}');
    if (profile.role === 'admin') {
      notify({ severity: 'warning', message: 'Administrators are redirected to the dashboard for management tasks.' });
      navigate('/admin');
    }
  }, [navigate, notify]);

  const removeFromCart = productId => {
    setCart(cart.filter(item => item.id !== productId));
    notify({ severity: 'info', message: t('itemRemoved') || 'Removed from cart.' });
  };

  const calculateTotal = () =>
    cart.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      return total + price;
    }, 0);

  const handleCheckout = () => {
    const token = localStorage.getItem('xyloToken');
    if (!token) {
      notify({ severity: 'info', message: 'Please sign in or create an account to proceed to checkout.' });
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    const profile = JSON.parse(localStorage.getItem('xyloProfile') || '{}');
    if (profile.role === 'admin') {
      notify({ severity: 'error', message: 'Administrator accounts are restricted from placing orders. Please use a customer account.' });
      return;
    }

    if (!cart.length) {
      notify({ severity: 'warning', message: t('addItemsBeforeCheckout') || 'Add items before checking out.' });
      return;
    }
    navigate('/checkout');
  };

  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ my: 2, fontWeight: 700 }}>
          {t('shoppingCart')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip icon={<ShoppingBagIcon />} label={`${cart.length} ${t('itemsInCart')}`} color="primary" variant="outlined" />
        </Stack>
      </Stack>

      {cart.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: 4, bgcolor: 'action.hover' }}>
          <Box sx={{ mb: 2 }}>
            <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
          </Box>
          <Typography variant="h5" gutterBottom fontWeight={700}>
            {t('cartEmpty')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            {t('exploreArrivals')}
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/shop')} sx={{ px: 4 }}>
            {t('browseProducts')}
          </Button>
        </Paper>
      ) : (
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4} alignItems="flex-start">
          {/* Cart Items List */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <List disablePadding>
                {cart.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      secondaryAction={
                        <Button 
                          onClick={() => removeFromCart(item.id)} 
                          color="error" 
                          size="small"
                          sx={{ textTransform: 'none' }}
                        >
                          {t('removeProduct') || 'Remove'}
                        </Button>
                      }
                      sx={{ py: 3 }}
                    >
                      <ListItemAvatar sx={{ mr: 2 }}>
                        <Box
                          component="img"
                          src={item.image || (item.images && item.images[0])}
                          alt={item.name}
                          sx={{ 
                            width: 100, 
                            height: 100, 
                            objectFit: 'contain', 
                            borderRadius: 2,
                            p: 1,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1526733169359-ab1142275411?auto=format&fit=crop&q=100&w=200';
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body1" color="primary" fontWeight={700}>
                            {typeof item.price === 'number' ? formatCurrency(item.price, currency) : 'Price not available'}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < cart.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate('/shop')} 
              sx={{ mt: 3, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            >
              {t('continueShopping')}
            </Button>
          </Box>

          {/* Order Summary Sidebar */}
          <Box sx={{ width: { xs: '100%', lg: 380 } }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                bgcolor: '#f8faff', 
                border: '1px solid', 
                borderColor: 'rgba(0,0,0,0.05)',
                position: 'sticky',
                top: 20
              }}
            >
              <Typography variant="h5" fontWeight={700} sx={{ mb: 4, color: '#1a237e' }}>
                Order Summary
              </Typography>

              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" fontWeight={500}>Subtotal</Typography>
                  <Typography fontWeight={700} color="text.primary">
                    {formatCurrency(calculateTotal(), currency)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" fontWeight={500}>Shipping</Typography>
                  <Typography fontWeight={700} color="#2e7d32">Free</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" fontWeight={500}>Estimated Tax</Typography>
                  <Typography fontWeight={700} color="text.primary">
                    {formatCurrency(calculateTotal() * 0.08, currency)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1, borderColor: 'rgba(0,0,0,0.05)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                  <Typography variant="h5" fontWeight={800} color="text.primary">Total</Typography>
                  <Typography variant="h5" fontWeight={800} color="#1565c0">
                    {formatCurrency(calculateTotal() * 1.08, currency)}
                  </Typography>
                </Box>

                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  onClick={handleCheckout}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ 
                    mt: 3, 
                    py: 2, 
                    borderRadius: 8, 
                    fontSize: '1.1rem', 
                    fontWeight: 700, 
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #0d47a1 30%, #1976d2 90%)',
                    boxShadow: '0 8px 16px rgba(13, 71, 161, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 30%, #2196f3 90%)',
                      boxShadow: '0 12px 20px rgba(13, 71, 161, 0.3)',
                    }
                  }}
                >
                  Proceed to Checkout
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      )}
    </Container>
  );
}

export default Cart;

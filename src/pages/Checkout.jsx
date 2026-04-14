import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';
import PaymentForm from '../components/PaymentForm';
import {
  Typography,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Divider,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Checkbox,
  Button,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useNotifier } from '../context/NotificationProvider';
import { sendOrderEmail } from '../services/emailService';

function Checkout({ cartItems = [], onOrderComplete }) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0); // 0: Shipping, 1: Payment
  const [shippingData, setShippingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifier();
  const [selectedItems, setSelectedItems] = useState(new Set());

  // CRITICAL: Ensure selectedItems is updated with cartItems IDs
  useEffect(() => {
    const token = localStorage.getItem('xyloToken');
    if (!token) {
      notify({ severity: 'warning', message: 'Authentication required for checkout. Please log in.' });
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    const profile = JSON.parse(localStorage.getItem('xyloProfile') || '{}');
    if (profile.role === 'admin') {
      notify({ severity: 'warning', message: 'Checkout is disabled for administrator accounts.' });
      navigate('/admin');
      return;
    }

    if (Array.isArray(cartItems) && cartItems.length > 0) {
      const ids = cartItems.map(item => item._id || item.id).filter(Boolean);
      if (selectedItems.size === 0) {
        console.log('[DEBUG] INITIAL CART SYNC:', ids);
        setSelectedItems(new Set(ids));
      }
    }
  }, [cartItems, navigate, notify]);

  const itemsToShow = (cartItems || []).filter(item => {
    const id = item._id || item.id;
    return id && selectedItems.has(id);
  });

  const total = itemsToShow.reduce((sum, item) => {
    const p = parseFloat(item.price) || parseFloat(item.discountedPrice) || 0;
    return sum + p;
  }, 0);

  const handleNext = formData => {
    if (itemsToShow.length === 0 || total <= 0) {
      notify({ severity: 'error', message: `Cannot proceed: No items selected or Total is ₹0.00.` });
      return;
    }
    setShippingData(formData);
    setActiveStep(1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => setActiveStep(0);

  const handleFinalSubmit = async (paymentMethod = 'card') => {
    console.log('[DEBUG] PLACE ORDER TRIGGERED, Method:', paymentMethod);

    // SAFETY: If total is zero, we must stop and RESET loading
    if (total <= 0) {
      console.warn('[DEBUG] REJECTED: Total is 0');
      notify({ severity: 'error', message: 'ERROR: Your cart became empty during selection. Please go back.' });
      setLoading(false); // <--- CRITICAL FIX: RESET THE BUTTON STATE
      return;
    }

    if (!shippingData) {
      notify({ severity: 'error', message: 'Shipping data missing.' });
      setActiveStep(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const normalizedEmail = shippingData.email?.trim() || 'customer@example.com';

      const itemsToPurchase = itemsToShow.map(item => ({
        productId: item._id || item.id,
        name: item.name,
        quantity: item.quantity || 1,
        price: parseFloat(item.price) || parseFloat(item.discountedPrice) || 0,
        image: item.imageUrl || item.image, // Capture the dynamic image URL
      }));

      // SAVE TO LOCAL STORAGE
      const existingOrders = JSON.parse(localStorage.getItem('xyloOrders') || '[]');
      const newOrderObj = {
        orderNumber,
        email: normalizedEmail,
        date: new Date().toLocaleString('en-US'),
        total: total,
        items: itemsToPurchase,
        phoneNumber: shippingData.phoneNumber,
        customerName: shippingData.name,
        paymentMethod: paymentMethod, // NEW
      };
      localStorage.setItem('xyloOrders', JSON.stringify([...existingOrders, newOrderObj]));

      console.log('[DEBUG] DISPATCHING BACKGROUND EMAIL RELAY (8088)');
      // ASYNC: We don't await the email so the UI responds instantly
      sendOrderEmail({
        orderNumber,
        email: normalizedEmail,
        customerName: shippingData.name,
        shippingAddress: shippingData.shippingAddress,
        phoneNumber: shippingData.phoneNumber,
        items: itemsToPurchase,
        total: total.toFixed(2),
        paymentMethod: paymentMethod, // NEW
      });

      // FINALIZE: Clear cart and redirect
      // CRITICAL: We clear AFTER navigation is triggered in the success state
      onOrderComplete?.();

      notify({ severity: 'success', message: 'ORDER PLACED!' });
      setLoading(false);

      navigate('/order-success', {
        state: {
          orderNumber,
          email: normalizedEmail,
          items: itemsToPurchase,
          total: total,
          shippingAddress: shippingData.shippingAddress,
          phoneNumber: shippingData.phoneNumber,
          customerName: shippingData.name,
          paymentMethod: paymentMethod, // NEW
        },
      });
    } catch (error) {
      console.error('[DEBUG] SUBMISSION FAILED:', error);
      setLoading(false);
      notify({ severity: 'error', message: 'Checkout system error. Please try again.' });
    }
  };

  const toggleItem = id => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Container maxWidth="md" sx={{ pb: 10, mt: 4 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #eee' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <ShoppingBagIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" fontWeight={800} color="primary">
              {activeStep === 0 ? 'Shipping Details' : 'Payment Method'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Order Value: <strong style={{ color: '#000' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 4 }} />

        {activeStep === 0 ? (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Review Selected Items
              </Typography>
              <List sx={{ bgcolor: 'background.paper', borderRadius: 4, border: '1px solid #edf2f7', p: 1 }}>
                {cartItems.map((item, idx) => (
                  <React.Fragment key={item._id || item.id || idx}>
                    <ListItem
                      sx={{
                        py: 2,
                        px: 1,
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                        borderRadius: 2,
                      }}
                    >
                      <Checkbox checked={selectedItems.has(item._id || item.id)} onChange={() => toggleItem(item._id || item.id)} color="primary" />
                      <ListItemAvatar sx={{ mr: 2 }}>
                        <Box
                          component="img"
                          src={item.image || (item.images && item.images[0]) || item.imageUrl}
                          alt={item.name}
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 3,
                            objectFit: 'contain',
                            bgcolor: '#f8fafc',
                            border: '1px solid #f1f5f9',
                            p: 0.5,
                            display: 'block',
                          }}
                          onError={e => {
                            e.target.src = 'https://via.placeholder.com/80?text=Product';
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="subtitle1" fontWeight={700}>{item.name}</Typography>}
                        secondary={
                          <Typography variant="body2" color="primary" fontWeight={600} sx={{ mt: 0.5 }}>
                            ₹{(parseFloat(item.price) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {idx < cartItems.length - 1 && <Divider variant="inset" component="li" sx={{ opacity: 0.6 }} />}
                  </React.Fragment>
                ))}
                {cartItems.length === 0 && (
                  <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
                    No items in cart
                  </Typography>
                )}
              </List>
            </Box>
            <CheckoutForm onSubmit={handleNext} />
          </>
        ) : (
          <PaymentForm
            shippingData={shippingData}
            total={total}
            onBack={handleBack}
            onPay={method => {
              if (!loading) {
                setLoading(true);
                handleFinalSubmit(method);
              }
            }}
            loading={loading}
          />
        )}
      </Paper>
    </Container>
  );
}

export default Checkout;

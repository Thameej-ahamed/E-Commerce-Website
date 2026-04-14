import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  Divider,
  Link,
  Stack,
  TextField,
  Select,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CloseIcon from '@mui/icons-material/Close';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import StripeCheckout from './StripeCheckout';

function PaymentForm({ shippingData, total, onBack, onPay, loading }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiDrawerOpen, setUpiDrawerOpen] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const primaryBlue = '#2874f0'; // BRAND PRIMARY

  const handleMethodChange = method => {
    setPaymentMethod(method);
    if (method === 'upi' && !selectedUpiApp) {
      setUpiDrawerOpen(true);
    }
  };

  const selectUpiApp = app => {
    setSelectedUpiApp(app);
    setPaymentMethod('upi');
    setUpiDrawerOpen(false);
  };

  const upiApps = [
    { id: 'phonepe', name: 'PhonePe', logo: 'https://static.businessworld.in/1588580716_I5onmz_PhonePe.jpg' }, // MANUALLY UPDATE LOGO URL HERE
    {
      id: 'gpay',
      name: 'Google Pay',
      logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/13/ca/ad/13caad9e-2ea1-6c78-8227-3d64b0daa34b/GPayAppIcon-0-0-1x_U007ephone-0-0-0-1-0-0-0-85-220.png/1200x630wa.png',
    }, // MANUALLY UPDATE LOGO URL HERE
    { id: 'paytm', name: 'Paytm', logo: 'https://images.seeklogo.com/logo-png/50/1/paytm-logo-png_seeklogo-501241.png' }, // MANUALLY UPDATE LOGO URL HERE
    { id: 'navi', name: 'Navi', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_SWCBXC5dTJHAJ7vUdUVZbWzzwouewGRJmA&s' }, // MANUALLY UPDATE LOGO URL HERE
  ];

  return (
    <Box sx={{ maxWidth: 650, mx: 'auto', bgcolor: '#fff', pb: 2 }}>
      {/* Deliver-to Header (Amazon Style) - COMPACT */}
      <Box sx={{ mb: 3, p: 1.5, border: '1px solid #eee', borderRadius: 2, bgcolor: '#fafafa' }}>
        <Typography variant="body2" fontWeight={700}>
          Delivering to {shippingData?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {shippingData?.shippingAddress}
        </Typography>
        <Link component="button" variant="caption" onClick={onBack} sx={{ color: primaryBlue, mt: 0.5 }}>
          Change address
        </Link>
      </Box>

      {/* Main Payment Section */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Select a payment method
      </Typography>

      <FormControl component="fieldset" fullWidth>
        <RadioGroup value={paymentMethod} onChange={e => handleMethodChange(e.target.value)}>
          {/* Card Option */}
          <Paper variant="outlined" sx={{ mb: 1, p: 1.5, borderColor: paymentMethod === 'card' ? primaryBlue : '#eee' }}>
            <FormControlLabel
              value="card"
              control={<Radio size="small" />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <CreditCardIcon sx={{ color: primaryBlue, fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>
                    Credit or Debit Card
                  </Typography>
                </Stack>
              }
            />
            {paymentMethod === 'card' && (
              <Box sx={{ mt: 1, ml: 4 }}>
                {/* Secure Stripe Integration */}
                <StripeCheckout amount={total} onSuccess={() => onPay('card')} onFail={err => console.error('Stripe Checkout Failed:', err)} />
              </Box>
            )}
          </Paper>

          {/* UPI Option */}
          <Paper variant="outlined" sx={{ mb: 1, p: 1.5, borderColor: paymentMethod === 'upi' ? primaryBlue : '#eee' }}>
            <FormControlLabel
              value="upi"
              control={<Radio size="small" />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <PaymentIcon sx={{ color: primaryBlue, fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>
                    UPI App {selectedUpiApp ? `(${upiApps.find(a => a.id === selectedUpiApp)?.name})` : ''}
                  </Typography>
                </Stack>
              }
            />
            {paymentMethod === 'upi' && (
              <Box sx={{ mt: 1, ml: 4 }}>
                {!selectedUpiApp ? (
                  <Button variant="text" size="small" onClick={() => setUpiDrawerOpen(true)} sx={{ py: 0 }}>
                    + Choose App
                  </Button>
                ) : (
                  <>
                    <TextField label="Enter UPI ID" fullWidth variant="outlined" size="small" placeholder="user@upi" />
                    <Button variant="text" size="small" onClick={() => setUpiDrawerOpen(true)} sx={{ py: 0 }}>
                      Change App
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Paper>

          {/* Net Banking */}
          <Paper variant="outlined" sx={{ mb: 1, p: 1.5, borderColor: paymentMethod === 'netbanking' ? primaryBlue : '#eee' }}>
            <FormControlLabel
              value="netbanking"
              control={<Radio size="small" />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalanceIcon sx={{ color: primaryBlue, fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>
                    Net Banking
                  </Typography>
                </Stack>
              }
            />
            {paymentMethod === 'netbanking' && (
              <Box sx={{ mt: 1, ml: 4 }}>
                <Select fullWidth size="small" defaultValue="chase">
                  <MenuItem value="chase">Chase</MenuItem>
                  <MenuItem value="bofa">Bank of America</MenuItem>
                  <MenuItem value="wells">Wells Fargo</MenuItem>
                  <MenuItem value="citi">Citi</MenuItem>
                </Select>
              </Box>
            )}
          </Paper>

          {/* COD */}
          <Paper variant="outlined" sx={{ mb: 1, p: 1.5, borderColor: paymentMethod === 'cod' ? primaryBlue : '#eee' }}>
            <FormControlLabel
              value="cod"
              control={<Radio size="small" />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalShippingIcon sx={{ color: primaryBlue, fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>
                    Cash on Delivery
                  </Typography>
                </Stack>
              }
            />
          </Paper>
        </RadioGroup>
      </FormControl>

      {paymentMethod !== 'card' && (
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => onPay(paymentMethod)}
          disabled={loading}
          sx={{ mt: 2, py: 1.2, bgcolor: primaryBlue, borderRadius: 2 }}
        >
          {loading ? 'Processing...' : 'Place Order'}
        </Button>
      )}

      {/* UPI Drawer (Compact & Centered) */}
      <Drawer
        anchor="bottom"
        open={upiDrawerOpen}
        onClose={() => setUpiDrawerOpen(false)}
        // THIS MAKES IT COMPACT LIKE THE MOBILE IMAGE ON DESKTOP
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '60vh',
            maxWidth: 450, // MOBILE-LIKE WIDTH
            mx: 'auto', // CENTERS IT HORIZONTALLY
            left: 0,
            right: 0,
          },
        }}
      >
        <Box sx={{ p: 2, width: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, px: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#333' }}>
              YOUR UPI APPS
            </Typography>
            <IconButton size="small" onClick={() => setUpiDrawerOpen(false)} sx={{ bgcolor: '#f5f5f5' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <List dense disablePadding>
            {upiApps.map(app => (
              <ListItem key={app.id} disablePadding sx={{ borderBottom: '1px solid #f9f9f9' }}>
                <ListItemButton onClick={() => selectUpiApp(app.id)} sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(40,116,240,0.05)' } }}>
                  {/* SELECT BUTTON (Circle from your second image) */}
                  <Radio checked={selectedUpiApp === app.id} size="small" sx={{ mr: 1 }} />

                  <ListItemText primary={app.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />

                  <ListItemIcon sx={{ minWidth: 50, justifyContent: 'flex-end' }}>
                    <img src={app.logo} alt={app.name} style={{ width: 35, height: 35, objectFit: 'contain', borderRadius: 4 }} />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}

export default PaymentForm;

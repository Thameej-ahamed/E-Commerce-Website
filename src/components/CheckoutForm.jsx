import React, { useState } from 'react';
import { TextField, Button, Typography, Grid, CircularProgress, Box } from '@mui/material';
import { useNotifier } from '../context/NotificationProvider';

function CheckoutForm({ onSubmit, submitting = false }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    shippingAddress: '',
    phoneNumber: '', // NEW
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { notify } = useNotifier();

  React.useEffect(() => {
    const savedProfile = localStorage.getItem('xyloProfile');
    const defaultAddress = localStorage.getItem('xyloAddresses');

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        let address = '';
        let phone = '';
        if (defaultAddress) {
          const parsedAddrs = JSON.parse(defaultAddress);
          const def = parsedAddrs.find(a => a.isDefault) || parsedAddrs[0];
          if (def) {
            address = def.address;
            phone = def.phone || '';
          }
        }

        setFormData(prev => ({
          ...prev,
          name: parsed.fullName || prev.name,
          email: parsed.email || prev.email,
          shippingAddress: address || prev.shippingAddress,
          phoneNumber: phone || prev.phoneNumber,
        }));
      } catch (e) {
        console.error('Error pre-filling checkout form', e);
      }
    }
  }, []);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (loading || submitting) return;

    if (!formData.name || !formData.email || !formData.shippingAddress || !formData.phoneNumber) {
      notify({ severity: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await onSubmit(formData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const message = error?.message || 'An error occurred';
      setErrorMessage(message);
      notify({ severity: 'error', message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h4" gutterBottom>
        Billing Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField required id="name" name="name" label="Full Name" fullWidth variant="standard" value={formData.name} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField required id="email" name="email" label="Email Address" fullWidth variant="standard" value={formData.email} onChange={handleInputChange} />
        </Grid>
      </Grid>

      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Shipping Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            id="shippingAddress"
            name="shippingAddress"
            label="Shipping Address"
            fullWidth
            variant="standard"
            value={formData.shippingAddress}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="phoneNumber"
            name="phoneNumber"
            label="Phone Number"
            fullWidth
            variant="standard"
            value={formData.phoneNumber}
            onChange={handleInputChange}
          />
        </Grid>
      </Grid>

      {(loading || submitting) && <CircularProgress sx={{ mt: 2 }} />}
      {errorMessage && (
        <Typography color="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Typography>
      )}

      <Button type="submit" variant="contained" color="primary" sx={{ mt: 4, mb: 4 }} disabled={loading || submitting}>
        Continue
      </Button>
    </form>
  );
}

export default CheckoutForm;

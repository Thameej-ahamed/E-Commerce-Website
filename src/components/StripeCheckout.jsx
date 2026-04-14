import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

// Initialize Stripe with the user's Publishable Key
const stripePromise = loadStripe('pk_test_51TEUNvANkrTHLlpP7Fm9l78p4QejpVSarKE8LKUgr6w4RJXf3XZs8goTFAqe6z0URwLqUqp5fHKkSXpIUtDRRv24007ntnczUS');

const CheckoutForm = ({ onSuccess, onFail, loading, setLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async event => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe usually redirects, but we are keeping it SPA friendly
        // If you need redirect, use return_url
      },
      redirect: 'if_required', // Prevents redirecting if payment succeeds immediately
    });

    if (error) {
      setErrorMessage(error.message);
      onFail(error.message);
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <PaymentElement />
      {errorMessage && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
          {errorMessage}
        </Typography>
      )}
      <Button type="submit" variant="contained" disabled={!stripe || loading} fullWidth sx={{ mt: 2, bgcolor: '#2874f0', py: 1.2, borderRadius: 2 }}>
        {loading ? 'Processing...' : 'Pay Securely with Stripe'}
      </Button>
    </form>
  );
};

export default function StripeCheckout({ amount, onSuccess, onFail }) {
  const [clientSecret, setClientSecret] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // We only fetch client secret if the backend is ready.
    // We will wait for the user to confirm the backend Stripe keys are active.
    const fetchIntent = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8100/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amount }),
        });
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Stripe Intent Error:', err);
      }
    };

    if (amount > 0) {
      fetchIntent();
    }
  }, [amount]);

  if (!stripePromise) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography color="text.secondary" variant="body2">
          Stripe is installed but waiting for your Publishable Key to activate.
        </Typography>
      </Box>
    );
  }

  if (!clientSecret) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onSuccess={onSuccess} onFail={onFail} loading={isProcessing} setLoading={setIsProcessing} />
    </Elements>
  );
}

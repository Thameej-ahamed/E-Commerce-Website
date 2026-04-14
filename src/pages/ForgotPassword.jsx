import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, Typography, Button, CircularProgress, Paper, Stack, InputAdornment } from '@mui/material';
import { Email } from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { notify } = useNotifier();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify email and trigger OTP
      await apiClient.post('auth/verify-email', { email });
      notify({ severity: 'success', message: 'OTP sent to your registered email!' });
      setTimeout(() => navigate('/verify-otp', { state: { email } }), 400);
    } catch (err) {
      const message = err.response?.data?.msg || 'Failed to verify email';
      setError(message);
      notify({ severity: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 6,
            background: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease',
            '&:hover': {
                transform: 'translateY(-2px)'
            }
          }}
        >
          <Stack spacing={1} sx={{ mb: 5, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color="#1e293b" letterSpacing="-0.5px">
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Enter your email address and we will send you a reset link.
            </Typography>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email Address
                </Typography>
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="name@company.com"
                  value={email}
                  type={'email'}
                  onChange={e => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ fontSize: 20, color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 3, 
                      bgcolor: '#fcfdfe',
                      '&:hover': { bgcolor: '#fff' }
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.8,
                  borderRadius: 3,
                  bgcolor: '#2874f0',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 10px 15px -3px rgba(40, 116, 240, 0.3)',
                  '&:hover': {
                    bgcolor: '#1a56db',
                    boxShadow: '0 20px 25px -5px rgba(40, 116, 240, 0.4)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="text" 
                  sx={{ fontWeight: 600, color: 'text.secondary' }}
                >
                  Back to Login
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default ForgotPassword;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, TextField, Typography, Button, CircularProgress, Paper, Stack } from '@mui/material';
import { apiClient } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';

function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotifier();
  
  // Refs for each input to manage focus
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      notify({ severity: 'error', message: 'Session expired. Please enter your email again.' });
      navigate('/forgot-password');
    }
  }, [email, navigate, notify]);

  const handleChange = (index, value) => {
    // Only accept numbers
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      notify({ severity: 'warning', message: 'Please enter all 6 digits.' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('auth/verify-otp', { email, otp: otpValue });
      notify({ severity: 'success', message: 'OTP Verified Successfully!' });
      setTimeout(() => navigate('/reset-password', { state: { email } }), 400);
    } catch (err) {
      const message = err.response?.data?.msg || 'Invalid or expired OTP';
      notify({ severity: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.post('auth/verify-email', { email });
      notify({ severity: 'info', message: 'A new OTP has been sent to your email.' });
    } catch (err) {
      notify({ severity: 'error', message: 'Failed to resend OTP.' });
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
              Verify OTP
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </Typography>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 2, ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  6-Digit Verification Code
                </Typography>
                
                <Stack direction="row" spacing={{ xs: 1, sm: 2 }} justifyContent="center">
                  {otp.map((digit, index) => (
                    <TextField
                      key={index}
                      inputRef={inputRefs[index]}
                      value={digit}
                      onChange={e => handleChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(index, e)}
                      variant="outlined"
                      inputProps={{
                        maxLength: 1,
                        style: { 
                          textAlign: 'center', 
                          fontSize: '24px', 
                          fontWeight: '800',
                          padding: '12px 8px',
                          color: '#1e293b'
                        }
                      }}
                      sx={{
                        width: { xs: '45px', sm: '56px' },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: '#fcfdfe',
                          '&.Mui-focused fieldset': {
                            borderColor: '#2874f0',
                            borderWidth: '2px'
                          }
                        }
                      }}
                    />
                  ))}
                </Stack>
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Account'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Button onClick={handleResend} variant="text" size="small" sx={{ fontWeight: 600, color: '#64748b' }}>
                  Didn't receive the code? <span style={{ color: '#2874f0', marginLeft: '4px' }}>Resend</span>
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default VerifyOtp;

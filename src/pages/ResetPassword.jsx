import React, { useState, useEffect } from 'react';
import { Box, Container, TextField, Typography, Button, CircularProgress, Paper, IconButton, InputAdornment, Stack } from '@mui/material';
import { Visibility, VisibilityOff, Lock, CheckCircle } from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifier } from '../context/NotificationProvider';

function ResetPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotifier();

  // If no email (e.g. direct access), send back
  useEffect(() => {
    if (!email) {
      notify({ severity: 'error', message: 'Session expired. Please restart the process.' });
      navigate('/forgot-password');
    }
  }, [email, navigate, notify]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (password !== confirmPassword) {
      notify({ severity: 'error', message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('auth/reset-password', { email, password });
      setSuccess(true);
      notify({ severity: 'success', message: 'Password updated! Sign in with your new credentials.' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const message = err.response?.data?.msg || 'Failed to reset password. Please try again.';
      notify({ severity: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 6, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>Success!</Typography>
            <Typography color="text.secondary" fontWeight={500}>Your password has been reset. Redirecting to login...</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

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
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Create a strong password you haven't used before for <strong>{email}</strong>
            </Typography>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  New Password
                </Typography>
                <TextField
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ fontSize: 20, color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                          {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 3, bgcolor: '#fcfdfe' }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Confirm New Password
                </Typography>
                <TextField
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ fontSize: 20, color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 3, bgcolor: '#fcfdfe' }
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default ResetPassword;

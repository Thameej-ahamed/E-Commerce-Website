import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, TextField, Typography, Button, CircularProgress, Paper, IconButton, InputAdornment, Stack, Link } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useNotifier();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || '/';

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('[DEBUG-Login] Submitting:', { email, password });

    try {
      const response = await apiClient.post('auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('xyloToken', token);
      if (user) {
        localStorage.setItem('xyloProfile', JSON.stringify(user));
      }
      window.dispatchEvent(new Event('authChange'));
      notify({ severity: 'success', message: 'Welcome back! Redirecting…' });
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 400);
    } catch (err) {
      const message = err.response?.data?.msg || 'Login failed';
      setError(message);
      notify({ severity: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
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
            borderRadius: 6,
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease',
            '&:hover': {
                transform: 'translateY(-2px)'
            }
          }}
        >
          <Box sx={{ p: { xs: 4, md: 6 } }}>
            <Stack spacing={1} sx={{ mb: 5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="#1e293b" letterSpacing="-0.5px">
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Enter your credentials to access your account
              </Typography>
            </Stack>

            <form onSubmit={handleLogin}>
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
                
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Password
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
                          <IconButton onClick={handleTogglePasswordVisibility} edge="end" size="small">
                            {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                          </IconButton>
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

                <Box sx={{ textAlign: 'right' }}>
                  <Link
                    href="/forgot-password"
                    variant="body2"
                    fontWeight={600}
                    sx={{ textDecoration: 'none', color: '#2874f0', '&:hover': { color: '#1a56db' } }}
                  >
                    Forgot your password?
                  </Link>
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Account'}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 5, textAlign: 'center', pt: 3, borderTop: '1px solid #f1f5f9' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                New to Xylo Electronics?{' '}
                <Link
                  onClick={() => navigate('/register', { state: { from } })}
                  fontWeight={700}
                  sx={{ textDecoration: 'none', color: '#2874f0', '&:hover': { textDecoration: 'underline' }, cursor: 'pointer' }}
                >
                  Create Account
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;

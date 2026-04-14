import * as React from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, Stack, TextField, IconButton, Divider, Chip, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SendIcon from '@mui/icons-material/Send';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useNotifier } from '../context/NotificationProvider';
import { useSettings } from '../context/SettingsContext';

function Footer() {
  const [email, setEmail] = React.useState('');
  const { notify } = useNotifier();
  const { t } = useSettings();
  const [userEmail, setUserEmail] = React.useState('');

  React.useEffect(() => {
    const checkUser = () => {
      const profile = localStorage.getItem('xyloProfile');
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          setUserEmail(parsed.email || '');
        } catch (e) {
          setUserEmail('');
        }
      } else {
        setUserEmail('');
      }
    };
    
    checkUser();
    window.addEventListener('authChange', checkUser);
    return () => window.removeEventListener('authChange', checkUser);
  }, []);

  const quickLinks = [
    { label: t('home'), to: '/' },
    { label: t('shop'), to: '/shop' },
    { label: t('about'), to: '/about' },
    { label: t('support'), to: '/support' },
    { label: t('cart'), to: '/cart' },
  ];

  const helpLinks = [
    { label: t('orderTrackingLink'), to: '/order-tracking' },
    { label: t('shippingReturns'), to: '/shipping-returns' },
    { label: t('termsConditions'), to: '/terms' },
    { label: t('privacyPolicy'), to: '/privacy' },
    { label: t('faq'), to: '/support#faq' },
    { label: t('contactUs'), to: '/support#contact' },
  ];

  const socialLinks = [
    { icon: <GitHubIcon />, label: 'GitHub', href: 'https://github.com/Thameej-ahamed' },
    { icon: <LinkedInIcon />, label: 'LinkedIn', href: 'https://www.linkedin.com/in/thameej-ahamed-418b32336/' },
    { icon: <LanguageIcon />, label: 'Portfolio', href: 'https://github.com/Thameej-ahamed' },
    { 
      icon: <EmailIcon />, 
      label: 'Email', 
      href: (userEmail && userEmail.endsWith('@gmail.com'))
        ? `https://mail.google.com/mail/u/${userEmail}/?view=cm&fs=1&to=thameejahamed73@gmail.com&su=Customer%20Inquiry%20-%20XYLO%20ELECTRONICS&body=Hello%20Admin,%0D%0A%0D%0AI am writing this enquiry regarding...%0D%0A%0D%0ARegards,%0D%0A${userEmail}`
        : `https://mail.google.com/mail/?view=cm&fs=1&to=thameejahamed73@gmail.com&su=Customer%20Inquiry%20-%20XYLO%20ELECTRONICS&body=Hello%20Admin,%0D%0A%0D%0AI am writing this enquiry regarding...` 
    },
  ];

  const policyLinks = [
    { label: t('privacyPolicy'), to: '/privacy', icon: <PrivacyTipOutlinedIcon fontSize="small" /> },
    { label: t('termsConditions'), to: '/terms', icon: <GavelIcon fontSize="small" /> },
    { label: t('shippingReturns'), to: '/shipping-returns', icon: <LocalShippingIcon fontSize="small" /> },
    { label: t('orderTrackingLink'), to: '/order-tracking', icon: <LocationSearchingIcon fontSize="small" /> },
    { label: t('contactUs'), to: '/support#contact', icon: <SupportAgentIcon fontSize="small" /> },
  ];

  const handleSubmit = event => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      notify({ severity: 'warning', message: 'Please enter your email to subscribe.' });
      return;
    }
    const emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailPattern.test(trimmed)) {
      notify({ severity: 'warning', message: 'Enter a valid email address.' });
      return;
    }

    notify({ severity: 'info', message: 'Adding you to the insider list…', autoHideDuration: 2200 });
    notify({ severity: 'success', message: 'You are on the VIP list! Look out for our next drop.' });
    setEmail('');
  };

  return (
    <Box component="footer" sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', mt: 8 }}>
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.12em' }} gutterBottom>
              XYLO ELECTRONICS
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.78)' }}>
              {t('footerDesc')}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              {socialLinks.map(link => (
                <IconButton
                  key={link.label}
                  component="a"
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? '_self' : '_blank'}
                  rel="noopener"
                  color="inherit"
                  size="small"
                  aria-label={link.label}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  {link.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t('explore')}
            </Typography>
            <Stack spacing={1.2}>
              {quickLinks.map(link => (
                <MuiLink
                  key={link.label + link.to}
                  component={RouterLink}
                  to={link.to}
                  color="inherit"
                  underline="none"
                  sx={{ color: 'rgba(226,232,240,0.78)', '&:hover': { color: '#fff' } }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t('customerCare')}
            </Typography>
            <Stack spacing={1.2}>
              {helpLinks.map(link => (
                <MuiLink
                  key={link.label + link.to}
                  component={RouterLink}
                  to={link.to}
                  color="inherit"
                  underline="none"
                  sx={{ color: 'rgba(226,232,240,0.78)', '&:hover': { color: '#fff' } }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t('joinInsider')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.78)', mb: 2 }}>
              {t('insiderDesc')}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                type="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder={t('newsletterPlaceholder')}
                size="small"
                variant="outlined"
                sx={{ flexGrow: 1, minWidth: '220px', bgcolor: 'white', borderRadius: 1 }}
              />
              <IconButton type="submit" color="primary" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#e2e8f0' } }}>
                <SendIcon />
              </IconButton>
            </Box>
            <Chip label={t('respectInbox')} size="small" sx={{ mt: 2, bgcolor: 'rgba(148, 163, 184, 0.12)', color: 'rgba(248, 250, 252, 0.8)' }} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 5, borderColor: 'rgba(148,163,184,0.25)' }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.7)' }}>
            © {new Date().getFullYear()} {t('rightsReserved')}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ color: 'rgba(226,232,240,0.7)', display: { xs: 'none', sm: 'flex' } }}>
            {policyLinks.map(link => (
              <MuiLink key={link.label + link.to} component={RouterLink} to={link.to} color="inherit" underline="none">
                {link.label}
              </MuiLink>
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', sm: 'none' } }}>
            {policyLinks.map(link => (
              <Tooltip key={link.label + link.to} title={link.label} enterTouchDelay={0} leaveTouchDelay={2500}>
                <IconButton
                  component={RouterLink}
                  to={link.to}
                  size="small"
                  color="inherit"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  }}
                  aria-label={link.label}
                >
                  {link.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;

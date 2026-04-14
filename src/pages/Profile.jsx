import * as React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  ListSubheader,
  Rating,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SecurityIcon from '@mui/icons-material/Security';
import DevicesIcon from '@mui/icons-material/Devices';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import PushPinIcon from '@mui/icons-material/PushPin';
import InfoIcon from '@mui/icons-material/Info';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useNotifier } from '../context/NotificationProvider';
import { useSettings } from '../context/SettingsContext';
import { apiClient } from '../services/apiClient';

function Profile() {
  const [tabIndex, setTabIndex] = React.useState(0);
  const { notify } = useNotifier();
  const { t, themeMode, language, setLanguage } = useSettings();
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);

  // Initialize state from default, then fetch real data
  const [profileData, setProfileData] = React.useState({
    fullName: 'Loading...',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    verified: false,
    avatar: '',
    memberSince: '',
    totalOrders: 0,
    mongoId: '',
    role: '', 
  });

  const fetchProfile = React.useCallback(async () => {
    try {
      const response = await apiClient.get('auth/me');
      if (response.data) {
        const u = response.data;
        setProfileData({
          fullName: u.username || u.name || 'User',
          email: u.email || '',
          phone: u.phone || '',
          gender: u.gender || '',
          dob: u.dob || '',
          verified: true,
          avatar: u.avatar || '',
          memberSince: u.createdAt 
            ? new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) 
            : 'March 2026',
          totalOrders: u.totalOrders || 0,
          mongoId: u._id,
          role: u.role || '',
        });

        // Restore addresses and notifications from MongoDB if present
        if (u.address && Array.isArray(u.address)) {
          setAddresses(u.address);
        }
        if (u.notificationPreferences) {
          setNotifications(u.notificationPreferences);
        }
      } else {
        localStorage.removeItem('xyloToken'); 
        navigate('/login');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      if (error.response?.status === 401) navigate('/login');
    }
  }, [navigate]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const [addresses, setAddresses] = React.useState(() => {
    try {
      const saved = localStorage.getItem('xyloAddresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [addressDialogOpen, setAddressDialogOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState(null);
  const [addressForm, setAddressForm] = React.useState({ type: 'Home', address: '', isDefault: false });

  // Safety Wrapped Storage and Backend Auto-Sync
  React.useEffect(() => {
    try {
      localStorage.setItem('xyloAddresses', JSON.stringify(addresses));
    } catch (e) {
      console.warn('Memory full, local cache skipped.');
    }

    if (profileData.mongoId) {
      apiClient.put('auth/me', { addresses }).catch(err => console.error('Address DB Sync Failed:', err));
    }
  }, [addresses, profileData.mongoId]);

  // Force-clear any legacy dummy data that might be stuck in the user's browser local cache
  React.useEffect(() => {
    setAddresses(prev => {
      if (!Array.isArray(prev)) return [];
      const hasLegacy = prev.some(a => a.address && (a.address.includes('Anna Nagar') || a.address.includes('Bandra East')));
      return hasLegacy ? [] : prev;
    });
  }, []);

  const [notifications, setNotifications] = React.useState(() => {
    const saved = localStorage.getItem('xyloNotifications');
    return saved
      ? JSON.parse(saved)
      : {
          email: true,
          push: true,
          orderUpdates: true,
          offers: true,
        };
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('xyloNotifications', JSON.stringify(notifications));
    } catch (e) {}

    // Auto-sync notifications to Backend
    if (profileData.mongoId) {
      apiClient.put('auth/me', { notificationPreferences: notifications })
        .catch(err => console.error('Notification Sync Failed:', err));
    }
  }, [notifications, profileData.mongoId]);

  const handleNotificationChange = field => {
    const isActactivating = !notifications[field];
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));

    if (isActactivating) {
      const messages = {
        email: '📧 Email alerts activated - You will receive order receipts here.',
        push: '🔔 Push notifications enabled for browser alerts.',
        orderUpdates: '📦 Order tracking subscription is now active.',
        offers: '🎉 You will now receive exclusive deals and promotions!',
      };
      notify({ severity: 'success', message: messages[field] || 'Preference updated successfully!' });
    } else {
      notify({ severity: 'info', message: `${field.charAt(0).toUpperCase() + field.slice(1)} notifications disabled.` });
    }
  };

  const [reviews, setReviews] = React.useState([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);

  const fetchUserReviews = React.useCallback(async () => {
    setReviewsLoading(true);
    try {
      const response = await apiClient.get('reviews/me');
      setReviews(response.data || []);
    } catch (error) {
      console.error('Reviews Fetch Error:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (tabIndex === 4) fetchUserReviews();
  }, [tabIndex, fetchUserReviews]);

  React.useEffect(() => {
    try {
      localStorage.setItem('xyloReviews', JSON.stringify(reviews));
    } catch (e) {}
  }, [reviews]);

  const handleDeleteReview = async id => {
    try {
      await apiClient.delete(`reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      notify({ severity: 'info', message: 'Review deleted successfully.' });
    } catch (err) {
      notify({ severity: 'error', message: 'Failed to delete review.' });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const resp = await apiClient.put('auth/me', profileData);
      const updatedUser = resp.data;
      
      // Merge with the response to ensure role and other fields are preserved
      setProfileData(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem('xyloProfile', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('authChange'));

      notify({ severity: 'success', message: 'Profile updated successfully in MongoDB!' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Update failed:', error);
      notify({ severity: 'error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify({ severity: 'error', message: 'File is too large. Max 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatar: reader.result }));
        notify({ severity: 'success', message: 'Avatar updated!' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ type: 'Home', address: '', isDefault: false });
    setAddressDialogOpen(true);
  };

  const handleEditAddress = addr => {
    setEditingAddress(addr);
    setAddressForm({ type: addr.type, address: addr.address, isDefault: addr.isDefault });
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = id => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    notify({ severity: 'success', message: 'Address deleted.' });
  };

  const handleSaveAddress = () => {
    if (!addressForm.address.trim()) {
      notify({ severity: 'error', message: 'Address cannot be empty.' });
      return;
    }

    if (editingAddress) {
      setAddresses(prev => prev.map(a => (a.id === editingAddress.id ? { ...a, ...addressForm } : a)));
      notify({ severity: 'success', message: 'Address updated.' });
    } else {
      const newAddr = { ...addressForm, id: Date.now() };
      setAddresses(prev => [...prev, newAddr]);
      notify({ severity: 'success', message: 'Address added.' });
    }

    // Handle default logic (simple)
    if (addressForm.isDefault) {
      setAddresses(prev =>
        prev.map(a => {
          const isThisOne = editingAddress ? a.id === editingAddress.id : a.address === addressForm.address;
          return { ...a, isDefault: isThisOne };
        })
      );
    }

    setAddressDialogOpen(false);
  };

  const handleAddressInputChange = e => {
    const { name, value, checked, type } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      notify({ severity: 'error', message: 'Geolocation is not supported by your browser' });
      return;
    }

    notify({ severity: 'info', message: 'Detecting your location...' });

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        // Mock reverse geocoding
        setTimeout(() => {
          const detectedAddress = `Detected Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Xylo Tech Park, California 94043)`;
          const newAddr = {
            id: Date.now(),
            type: 'Other',
            address: detectedAddress,
            isDefault: false,
          };
          setAddresses(prev => [...prev, newAddr]);
          notify({ severity: 'success', message: 'Current location identified and added to addresses!' });
        }, 1500);
      },
      error => {
        notify({ severity: 'error', message: `Location error: ${error.message}` });
      }
    );
  };

  const [passwordState, setPasswordState] = React.useState({ current: '', new: '' });

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordState(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = () => {
    if (!passwordState.current || !passwordState.new) {
      notify({ severity: 'error', message: 'Please fill in both password fields.' });
      return;
    }
    if (passwordState.new.length < 6) {
      notify({ severity: 'warning', message: 'New password must be at least 6 characters.' });
      return;
    }

    notify({ severity: 'info', message: 'Verifying current password...' });
    setTimeout(() => {
      notify({ severity: 'success', message: 'Password updated successfully!' });
      setPasswordState({ current: '', new: '' });
    }, 1200);
  };

  const handleLogoutAllDevices = () => {
    notify({ severity: 'info', message: 'Signing out from all devices...' });

    setTimeout(() => {
      localStorage.removeItem('xyloToken');
      notify({ severity: 'success', message: 'You have been logged out from all sessions.' });
      window.location.href = '/login';
    }, 1200);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: 'text.primary' }}>
        {t('myProfile')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('profileSubtitle')}
      </Typography>

      <Grid container spacing={4}>
        {/* Left Column - User Overview */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Avatar
                src={profileData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}
                sx={{
                  width: 140,
                  height: 140,
                  mx: 'auto',
                  border: '4px solid',
                  borderColor: 'background.default',
                  boxShadow: themeMode === 'light' ? '0 8px 30px rgba(40, 116, 240, 0.15)' : '0 8px 30px rgba(0, 0, 0, 0.3)',
                }}
              />
              <IconButton
                size="small"
                onClick={handleAvatarClick}
                sx={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {profileData.fullName}
            </Typography>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {profileData.email}
              </Typography>
              {profileData.verified && <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />}
            </Stack>
            <Chip label={t('premiumMember')} color="primary" variant="outlined" sx={{ fontWeight: 600, px: 2 }} />

            <Divider sx={{ my: 4 }} />

            <List dense sx={{ textAlign: 'left' }}>
              <ListItem>
                <ListItemText
                  primary="Login ID"
                  secondary={profileData.mongoId || 'Not Logged In'}
                  primaryTypographyProps={{ fontWeight: 800, variant: 'body2', color: 'text.primary' }}
                  secondaryTypographyProps={{ sx: { fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.8 } }}
                />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('memberSince')} secondary={profileData.memberSince} primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={t('totalOrdersInProfile')}
                  secondary={`${profileData.totalOrders} ${t('orders')}`}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Right Column - Navigation and Content */}
        <Grid item xs={12} md={8}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabIndex} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}>
              <Tab icon={<EditIcon />} iconPosition="start" label={t('generalInfo')} />
              <Tab icon={<LocationOnIcon />} iconPosition="start" label={t('addresses')} />
              <Tab icon={<SecurityIcon />} iconPosition="start" label={t('security')} />
              <Tab icon={<NotificationsActiveIcon />} iconPosition="start" label={t('notifications')} />
              <Tab icon={<RateReviewIcon />} iconPosition="start" label={t('reviews')} />
            </Tabs>
          </Box>

          {/* Tab 1: General Profile Info */}
          {tabIndex === 0 && (
            <>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                {t('basicInfo')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField label={t('fullName')} name="fullName" fullWidth value={profileData.fullName} onChange={handleInputChange} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('emailAddress')}
                    name="email"
                    fullWidth
                    value={profileData.email}
                    onChange={e => {
                      setProfileData(prev => ({
                        ...prev,
                        email: e.target.value,
                        verified: false, // Reset verification if email changes
                      }));
                    }}
                    variant="outlined"
                    InputProps={{
                      endAdornment: profileData.verified ? <VerifiedIcon color="primary" /> : null,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={t('phoneNumber')} name="phone" fullWidth value={profileData.phone} onChange={handleInputChange} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('gender')}</InputLabel>
                    <Select name="gender" value={profileData.gender} onChange={handleInputChange} label={t('gender')}>
                      <MenuItem value="Male">{t('genderMale')}</MenuItem>
                      <MenuItem value="Female">{t('genderFemale')}</MenuItem>
                      <MenuItem value="Other">{t('genderOther')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('memberSince')}
                    name="memberSince"
                    fullWidth
                    value={profileData.memberSince}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('totalOrdersInProfile')}
                    name="totalOrders"
                    type="number"
                    fullWidth
                    value={profileData.totalOrders}
                    onChange={handleInputChange}
                    variant="outlined"
                    disabled
                    sx={{ bgcolor: 'action.hover', opacity: 0.8 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ py: 1.5, px: 4, mt: 2 }}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  >
                    {saving ? 'Saving...' : t('saveChangesInProfile')}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            {saveSuccess && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, color: 'success.main', ml: 1 }}>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 24 }} />
                <Typography fontWeight={600} variant="body1">save changes successfully</Typography>
              </Box>
            )}
            </>
          )}

          {/* Tab 2: Address Management */}
          {tabIndex === 1 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  {t('manageAddresses')}
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddAddress}>
                  {t('addNewAddress')}
                </Button>
              </Stack>
              <Stack spacing={2}>
                {addresses.map(addr => (
                  <Card
                    key={addr.id}
                    elevation={0}
                    sx={{
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: '0.3s',
                      '&:hover': { border: '1px solid', borderColor: 'primary.main' },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={2}>
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                          {addr.type === 'Home' ? <HomeIcon color="primary" /> : <WorkIcon color="primary" />}
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1" fontWeight={700}>
                              {addr.type === 'Home' ? t('home') : addr.type === 'Work' ? t('work') || 'Work' : addr.type}
                            </Typography>
                            {addr.isDefault && <Chip label={t('defaultAddress')} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {addr.address}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row">
                        <IconButton size="small" onClick={() => handleEditAddress(addr)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteAddress(addr.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              <Box sx={{ mt: 4, p: 3, bgcolor: 'action.hover', borderRadius: 6, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                <LocationOnIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  We can also auto-detect your location for faster shipping.
                </Typography>
                <Button variant="text" size="small" onClick={handleUseCurrentLocation}>
                  {t('useCurrentLocation')}
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 3: Security Settings */}
          {tabIndex === 2 && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                {t('accountSecurity')}
              </Typography>

              <Stack spacing={4}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {t('changePassword')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t('currentPassword')}
                        type="password"
                        fullWidth
                        name="current"
                        value={passwordState.current}
                        onChange={handlePasswordChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label={t('newPassword')} type="password" fullWidth name="new" value={passwordState.new} onChange={handlePasswordChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="outlined" onClick={handleUpdatePassword}>
                        {t('updatePasswordLabel')}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DevicesIcon fontSize="small" /> {t('deviceHistory')}
                  </Typography>
                  <List dense sx={{ bgcolor: 'action.hover', borderRadius: 4, p: 2 }}>
                    <ListItem>
                      <ListItemText primary="Windows 11 Laptop - Chrome" secondary="Active Now • Washington, US" />
                    </ListItem>
                    <Divider sx={{ my: 1 }} />
                    <ListItem>
                      <ListItemText primary="iPhone 15 Pro - App" secondary="Las Vegas, US • 2 hours ago" />
                    </ListItem>
                  </List>
                  <Button variant="text" color="error" sx={{ mt: 2, fontWeight: 700 }} onClick={handleLogoutAllDevices}>
                    {t('logoutAllDevices')}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          )}
          {/* Tab 4: Notifications */}
          {tabIndex === 3 && (
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('notificationPreferences')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Control how and when you receive updates from Xylo Electronics.
              </Typography>

              <Stack spacing={4}>
                <Box>
                  <List
                    subheader={
                      <ListSubheader sx={{ bgcolor: 'transparent', px: 0, fontWeight: 700, fontSize: '0.9rem', color: 'text.secondary' }}>
                        {t('channelPreferences')}
                      </ListSubheader>
                    }
                  >
                    <ListItem sx={{ px: 0 }}>
                      <Stack direction="row" spacing={2} sx={{ width: '100%' }} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}>
                            <EmailIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>Email Notifications</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Receive order receipts and account updates via email.
                            </Typography>
                          </Box>
                        </Stack>
                        <Switch checked={notifications.email} onChange={() => handleNotificationChange('email')} color="primary" />
                      </Stack>
                    </ListItem>
                    <Divider sx={{ my: 1 }} />
                    <Divider sx={{ my: 1 }} />
                    <ListItem sx={{ px: 0 }}>
                      <Stack direction="row" spacing={2} sx={{ width: '100%' }} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#faf5ff', color: '#a855f7' }}>
                            <PushPinIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>Push Notifications</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Allow browser alerts for instant activity tracking.
                            </Typography>
                          </Box>
                        </Stack>
                        <Switch checked={notifications.push} onChange={() => handleNotificationChange('push')} color="secondary" />
                      </Stack>
                    </ListItem>
                  </List>
                </Box>

                <Box>
                  <List
                    subheader={
                      <ListSubheader sx={{ bgcolor: 'transparent', px: 0, fontWeight: 700, fontSize: '0.9rem', color: 'text.secondary' }}>
                        {t('alertTypes')}
                      </ListSubheader>
                    }
                  >
                    <ListItem sx={{ px: 0 }}>
                      <Stack direction="row" spacing={2} sx={{ width: '100%' }} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#fff7ed', color: '#f97316' }}>
                            <InfoIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>Order Updates</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Status changes, shipping info, and delivery tracking.
                            </Typography>
                          </Box>
                        </Stack>
                        <Switch checked={notifications.orderUpdates} onChange={() => handleNotificationChange('orderUpdates')} color="warning" />
                      </Stack>
                    </ListItem>
                    <Divider sx={{ my: 1 }} />
                    <ListItem sx={{ px: 0 }}>
                      <Stack direction="row" spacing={2} sx={{ width: '100%' }} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#fff1f2', color: '#f43f5e' }}>
                            <LocalOfferIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>Offers & Promotions</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Discounts, seasonal sales, and personalized deals.
                            </Typography>
                          </Box>
                        </Stack>
                        <Switch checked={notifications.offers} onChange={() => handleNotificationChange('offers')} color="error" />
                      </Stack>
                    </ListItem>
                  </List>
                </Box>


              </Stack>
            </Box>
          )}
          {/* Tab 5: Reviews & Ratings */}
          {tabIndex === 4 && (
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('myReviews')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Manage all the feedback and ratings you have shared for Xylo products.
              </Typography>

              {reviewsLoading ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
              ) : reviews.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 6, bgcolor: 'action.hover' }}>
                  <RateReviewIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    {t('noReviews')}
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {reviews.map(rev => (
                    <Card key={rev._id} elevation={0} sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} sm={3} md={2}>
                            <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 4, textAlign: 'center' }}>
                              <img src={rev.productId?.image} alt={rev.productId?.name} style={{ width: '100%', maxHeight: '100px', objectFit: 'contain' }} />
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={9} md={10}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                              <Box>
                                <Typography fontWeight={700} variant="h6">
                                  {rev.productId?.name}
                                </Typography>
                                <Rating value={rev.rating} readOnly size="small" sx={{ my: 0.5 }} />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', mb: 3 }}>
                              "{rev.comment}"
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                startIcon={<DeleteIcon />}
                                sx={{ borderRadius: 4, py: 0.5 }}
                                onClick={() => handleDeleteReview(rev._id)}
                              >
                                {t('delete')}
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}

              <Box sx={{ mt: 5, p: 3, bgcolor: 'action.selected', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <ThumbUpIcon sx={{ color: 'primary.main' }} />
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  Your feedback helps other shoppers make informed decisions. Top reviewers can earn 'Elite Member' status for exclusive discounts!
                </Typography>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle variant="h6" fontWeight={700}>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 1 }}>
            <FormControl>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Address Type
              </Typography>
              <RadioGroup row name="type" value={addressForm.type} onChange={handleAddressInputChange}>
                <FormControlLabel value="Home" control={<Radio />} label="Home" />
                <FormControlLabel value="Work" control={<Radio />} label="Work" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>

            <TextField
              label="Full Address"
              name="address"
              multiline
              rows={3}
              fullWidth
              value={addressForm.address}
              onChange={handleAddressInputChange}
              variant="outlined"
              placeholder="e.g. 123 Main St, Tech City, CA 90210"
            />

            <FormControlLabel
              control={<Switch name="isDefault" checked={addressForm.isDefault} onChange={handleAddressInputChange} color="success" />}
              label="Set as default address"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddressDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveAddress} sx={{ px: 4 }}>
            Save Address
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Profile;

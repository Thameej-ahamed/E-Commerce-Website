import * as React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Divider,
  Tooltip,
  Badge,
  Chip,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useNotifier } from '../context/NotificationProvider';
import { apiClient } from '../services/apiClient';

function Wishlist({ addToCart }) {
  const { notify } = useNotifier();
  const [wishlistItems, setWishlistItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState(null);

  const fetchWishlist = async () => {
    const token = localStorage.getItem('xyloToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get('wishlist');
      const items = data.products || data || [];
      const normalized = Array.isArray(items)
        ? items.map(p => ({
            ...p,
            id: p.productId || p._id,
            image: p.image || 'https://images.unsplash.com/photo-1526733169359-ab1142275411?auto=format&fit=crop&q=80&w=800',
          }))
        : [];

      console.log('[Wishlist-Page] Loaded items:', normalized.length);
      setWishlistItems(normalized);
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWishlist();
    const fetchUser = async () => {
      try {
        const { data } = await apiClient.get('auth/me');
        if (data && data._id) {
          setUserId(data._id);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    if (localStorage.getItem('xyloToken')) {
      fetchUser();
    }
  }, []);

  const handleRemoveItem = async id => {
    const token = localStorage.getItem('xyloToken');
    if (token) {
      try {
        await apiClient.delete(`wishlist/${id}`);
      } catch (err) {
        console.error('Failed to sync wishlist deletion to MongoDB', err);
      }
    }
    const updated = wishlistItems.filter(item => item.id !== id && item._id !== id);
    setWishlistItems(updated);
    notify({ severity: 'info', message: 'Item removed from wishlist.' });
  };

  const handleMoveToCart = async item => {
    await addToCart(item);
    handleRemoveItem(item.id || item._id);
    notify({ severity: 'success', message: `${item.name} moved to your cart!` });
  };

  const handleShareWishlist = () => {
    if (!userId) {
      notify({ severity: 'error', message: 'You must be logged in to share your wishlist.' });
      return;
    }
    const shareUrl = `${window.location.origin}/wishlist/shared/${userId}`;
    navigator.clipboard.writeText(shareUrl);
    notify({ severity: 'success', message: 'Shareable wishlist link copied to clipboard!' });
  };

  const handleToggleNotifications = async item => {
    try {
      const canonicalId = item.productId || item.id || item._id;
      const { data } = await apiClient.put(`wishlist/${canonicalId}/notify`);

      setWishlistItems(prev => prev.map(p => (p.id === canonicalId || p._id === canonicalId ? { ...p, notifyOnPriceDrop: data.notifyOnPriceDrop } : p)));

      if (data.notifyOnPriceDrop) {
        notify({ severity: 'success', message: `Price drop alerts enabled for ${item.name}.` });
      } else {
        notify({ severity: 'info', message: `Price drop alerts disabled for ${item.name}.` });
      }
    } catch (err) {
      console.error('Failed to toggle notifications', err);
      notify({ severity: 'error', message: 'Failed to update notification settings.' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FavoriteIcon color="error" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h3" fontWeight={800}>
              My Wishlist
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Keep track of items you love and get notified on price changes.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchWishlist} disabled={loading} sx={{ borderRadius: 6, px: 3 }}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleShareWishlist} sx={{ borderRadius: 6, px: 3 }}>
            Share Wishlist
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : wishlistItems.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 6, border: '1px solid #e5e7eb', bgcolor: '#f8fafc' }}>
          <FavoriteIcon sx={{ fontSize: 80, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Your wishlist is empty
          </Typography>
          <Button variant="contained" href="/shop" sx={{ mt: 2 }}>
            Explores Products
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {wishlistItems.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id || item._id}>
              <Card
                elevation={0}
                sx={{ borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.image || 'https://images.unsplash.com/photo-1526733169359-ab1142275411?auto=format&fit=crop&q=80&w=800'}
                    alt={item.name}
                    sx={{ objectFit: 'contain', p: 2, bgcolor: '#f8fafc' }}
                  />
                  <IconButton
                    onClick={() => handleRemoveItem(item.id || item._id)}
                    sx={{
                      position: 'absolute',
                      top: 24,
                      right: 24,
                      bgcolor: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      width: 38,
                      height: 38,
                      zIndex: 2,
                      '&:hover': { bgcolor: '#fee2e2' },
                    }}
                  >
                    <DeleteIcon color="error" fontSize="small" />
                  </IconButton>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                    {item.name || 'Unknown Product'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h5" color="primary" fontWeight={800}>
                      ${(item.price || 0).toFixed(2)}
                    </Typography>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1}>
                    <Button fullWidth variant="contained" startIcon={<ShoppingCartIcon />} onClick={() => handleMoveToCart(item)} sx={{ py: 1.2 }}>
                      Move to Cart
                    </Button>
                    <Tooltip title={item.notifyOnPriceDrop ? 'Disable price drop alerts' : 'Get notified when price drops further'}>
                      <Button
                        fullWidth
                        variant={item.notifyOnPriceDrop ? 'contained' : 'text'}
                        color={item.notifyOnPriceDrop ? 'primary' : 'secondary'}
                        startIcon={<NotificationsActiveIcon />}
                        onClick={() => handleToggleNotifications(item)}
                        sx={{ fontSize: '0.75rem', mt: 1 }}
                      >
                        {item.notifyOnPriceDrop ? 'Alerts Enabled' : 'Notify Price Drop'}
                      </Button>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 6, p: 4, bgcolor: '#fff6f6', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
        <NotificationsActiveIcon color="error" />
        <Typography variant="body2" color="#b91c1c" fontWeight={500}>
          Wishlist items are saved in your account for 30 days. Enable price alerts to receive email notifications when your favorite items go on sale.
        </Typography>
      </Box>
    </Container>
  );
}

export default Wishlist;

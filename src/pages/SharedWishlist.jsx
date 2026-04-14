import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Box, Grid, Button, Card, CardContent, CardMedia, Stack, Divider, CircularProgress } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNotifier } from '../context/NotificationProvider';
import { apiClient } from '../services/apiClient';

function SharedWishlist({ addToCart }) {
  const { userId } = useParams();
  const { notify } = useNotifier();
  const [wishlistItems, setWishlistItems] = React.useState([]);
  const [userName, setUserName] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchSharedWishlist = async () => {
      try {
        const { data } = await apiClient.get(`wishlist/shared/${userId}`);
        const items = data.products || [];
        setUserName(data.userName || 'A user');
        const normalized = Array.isArray(items)
          ? items.map(p => ({
              ...p,
              id: p.productId || p._id,
              image: p.image || 'https://images.unsplash.com/photo-1526733169359-ab1142275411?auto=format&fit=crop&q=80&w=800',
            }))
          : [];
        setWishlistItems(normalized);
      } catch (err) {
        console.error('Failed to fetch shared wishlist', err);
        setError('Failed to load this wishlist. The link may be invalid.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedWishlist();
  }, [userId]);

  const handleAddToCart = async item => {
    await addToCart(item);
    notify({ severity: 'success', message: `${item.name} added to your cart!` });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Paper elevation={0} sx={{ p: 8, borderRadius: 6, border: '1px solid #fee2e2', bgcolor: '#fef2f2' }}>
          <Typography variant="h5" color="error">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <FavoriteIcon color="error" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h3" fontWeight={800}>
            {userName}'s Wishlist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Check out what {userName} loves. Add items directly to your cart to purchase!
          </Typography>
        </Box>
      </Stack>

      {wishlistItems.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 6, border: '1px solid #e5e7eb', bgcolor: '#f8fafc' }}>
          <FavoriteIcon sx={{ fontSize: 80, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            This wishlist is empty
          </Typography>
          <Button variant="contained" href="/shop" sx={{ mt: 2 }}>
            Explore Products
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
                  <CardMedia component="img" height="200" image={item.image} alt={item.name} sx={{ objectFit: 'contain', p: 2, bgcolor: '#f8fafc' }} />
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

                  <Button fullWidth variant="contained" startIcon={<ShoppingCartIcon />} onClick={() => handleAddToCart(item)} sx={{ py: 1.2 }}>
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default SharedWishlist;

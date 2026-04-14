import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Grid,
  Link,
  Paper,
  Rating,
  Stack,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Divider,
  InputAdornment
} from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { apiClient, withRetry } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currencyFormatter';

const formatCategory = cat => {
  if (!cat) return 'Uncategorized';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

function SimilarProductsPlaceholder() {
  const { t } = useSettings();
  return (
    <Typography variant="body2" color="text.secondary">
      {t('curatingRecommendations') || 'We are curating recommendations for this product. Check back soon for more gear.'}
    </Typography>
  );
}

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [similarError, setSimilarError] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  
  const { notify } = useNotifier();
  const { currency, themeMode, t } = useSettings();

  const normalizeProduct = useCallback(prod => {
    if (!prod || typeof prod !== 'object') return null;
    const candidate = prod._id ?? prod.id ?? prod.mongoId ?? prod?.metadata?.mongoId;
    const normalizedId = candidate !== undefined && candidate !== null ? `${candidate}` : undefined;

    return normalizedId
      ? {
          ...prod,
          id: normalizedId,
          _id: normalizedId,
          image: (prod.images && prod.images.length) ? prod.images[0] : prod.image
        }
      : { ...prod, image: (prod.images && prod.images.length) ? prod.images[0] : prod.image };
  }, []);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const response = await apiClient.get(`products/${id}/reviews`);
      setReviews(response.data || []);
    } catch (error) {
      console.warn('Reviews fetch failed logic:', error.message);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  const fetchRecommended = useCallback(async () => {
    setRecLoading(true);
    setSimilarError(false);
    try {
      const { data: recs } = await withRetry(() => apiClient.get(`products/${id}/similar`));
      if (!Array.isArray(recs)) {
        setRecommended([]);
        return;
      }
      const normalized = recs
        .map(item => normalizeProduct(item))
        .filter(Boolean)
        .filter((item, index, self) => item.id && self.findIndex(other => other.id === item.id) === index)
        .filter(item => item.id !== `${id}`);
      setRecommended(normalized);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setSimilarError(true);
      setRecommended([]);
    } finally {
      setRecLoading(false);
    }
  }, [id, normalizeProduct]);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await withRetry(() => apiClient.get(`products/${id}`));
      const normalized = normalizeProduct(data);
      if (!normalized?.id) {
        throw new Error('Product not found');
      }
      setProduct(normalized);
      setUserRating(normalized.rating || 0);
      fetchReviews();
      fetchRecommended();
    } catch (err) {
      console.error('Error fetching product details:', err);
      setProduct(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, normalizeProduct, fetchRecommended, fetchReviews]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!product) return;
      const token = localStorage.getItem('xyloToken');
      const saved = JSON.parse(localStorage.getItem('xyloWishlist') || '[]');
      const localExists = saved.some(item => item.id === product.id);
      setIsInWishlist(localExists);

      if (token) {
        try {
          const { data } = await apiClient.get('wishlist');
          if (data && data.products) {
            const dbExists = data.products.some(p => String(p.productId) === String(product.id));
            if (dbExists !== localExists) {
              setIsInWishlist(dbExists);
            }
          }
        } catch (err) {
          console.warn('[Wishlist-Sync] check failed', err);
        }
      }
    };
    checkWishlist();
  }, [product]);

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    const token = localStorage.getItem('xyloToken');
    const key = 'xyloWishlist';
    const saved = JSON.parse(localStorage.getItem(key) || '[]');

    if (isInWishlist) {
      if (token) {
        try {
          await apiClient.delete(`wishlist/${product.id}`);
        } catch (err) {
          console.error('[Wishlist-Sync] Remove Error:', err);
        }
      }
      const next = saved.filter(item => item.id !== product.id);
      localStorage.setItem(key, JSON.stringify(next));
      setIsInWishlist(false);
      notify({ severity: 'info', message: t('removedFromWishlist') || 'Removed from wishlist' });
    } else {
      if (token) {
        try {
          await apiClient.post('wishlist', { 
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image || (product.images && product.images[0]),
            brand: product.brand,
            category: product.category
          });
        } catch (err) {
          console.error('[Wishlist-Sync] Add Error:', err);
        }
      }
      const next = [...saved, { ...product, addedAt: Date.now() }];
      localStorage.setItem(key, JSON.stringify(next));
      setIsInWishlist(true);
      notify({ severity: 'success', message: t('addedToWishlist') || 'Added to wishlist!' });
    }
  };

  const handleReviewSubmit = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('xyloToken');
    if (!token) {
      notify({ severity: 'warning', message: 'Please sign in to leave a review.' });
      return;
    }

    setSubmittingReview(true);
    try {
      await apiClient.post('reviews', {
        productId: id,
        rating: reviewRating,
        comment: reviewComment
      });
      notify({ severity: 'success', message: t('thanksFeedback') || 'Thank you for your feedback!' });
      setReviewComment('');
      setReviewRating(5);
      fetchReviews();
      fetchProduct(); // Re-fetch from MongoDB to get the new average ratings and counts
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Unknown Network Error';
      notify({ severity: 'error', message: msg });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h4" gutterBottom>
            {t('productLoadError') || 'We could not load this product.'}
          </Typography>
          <Button variant="contained" onClick={fetchProduct} sx={{ mt: 2 }}>
            {t('tryAgain') || 'Try again'}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <img src={product.image} alt={product.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom fontWeight={800}>
              {product.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('brand')}: {product.brand || 'Xylo Electronics'}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('category')}: {formatCategory(product.category)}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mt: 1 }}>
              {formatCurrency(product.price, currency)}
            </Typography>
            <Typography variant="body1" sx={{ my: 2, color: 'text.secondary' }}>
              {product.description}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 2, gap: 1.5 }}>
              <Rating value={product.ratings || 0} precision={0.5} readOnly size="small" />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {product.ratings ? (product.ratings).toFixed(1) : '0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({product.numReviews || 0} {t('reviewsLabel')})
              </Typography>
            </Box>

            {(() => {
              const isAdmin = JSON.parse(localStorage.getItem('xyloProfile') || '{}').role === 'admin';
              if (isAdmin) return null;
              return (
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleAddToCart} 
                    fullWidth 
                    size="large"
                    sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
                  >
                    {t('addToCartLabel')}
                  </Button>
                  <IconButton 
                    onClick={handleAddToWishlist} 
                    color={isInWishlist ? 'error' : 'default'}
                    sx={{ border: '1px solid #eee', px: 2, borderRadius: 4 }}
                  >
                    {isInWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Stack>
              );
            })()}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Reviews Section - HIDDEN FOR ADMINS */}
      {JSON.parse(localStorage.getItem('xyloProfile') || '{}').role !== 'admin' && (
        <Box sx={{ mt: 10 }}>
          <Grid container spacing={5}>
            {/* Review form and list content... */}
            <Grid item xs={12} md={5}>
               <Typography variant="h5" fontWeight={700} gutterBottom>
                 Customer Reviews
               </Typography>
               <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
                 <Typography variant="subtitle1" gutterBottom>
                   Share your thoughts
                 </Typography>
                 <Box component="form" onSubmit={handleReviewSubmit}>
                   <Rating 
                     value={reviewRating} 
                     onChange={(e, v) => setReviewRating(v)} 
                     sx={{ mb: 2 }}
                   />
                   <TextField
                     fullWidth
                     multiline
                     rows={3}
                     placeholder="Write your review here..."
                     value={reviewComment}
                     onChange={(e) => setReviewComment(e.target.value)}
                     variant="outlined"
                     sx={{ mb: 2 }}
                   />
                   <Button 
                     variant="contained" 
                     type="submit" 
                     disabled={submittingReview}
                     fullWidth
                     sx={{ borderRadius: 2 }}
                   >
                     {submittingReview ? <CircularProgress size={20} color="inherit" /> : 'Post Review'}
                   </Button>
                 </Box>
               </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
               <Stack spacing={3}>
                 {reviewsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                 ) : reviews.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px dashed #ddd' }}>
                      <Typography color="text.secondary">No reviews for this product yet. Be the first!</Typography>
                    </Paper>
                 ) : (
                    reviews.map((rev) => (
                      <Paper key={rev._id} elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f0f0f0' }}>
                         <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                           <Avatar src={rev.userId?.avatar} sx={{ bgcolor: 'primary.light' }}>
                              {rev.userId?.name?.charAt(0) || 'U'}
                           </Avatar>
                           <Box>
                             <Typography variant="subtitle1" fontWeight={700}>{rev.userId?.name && rev.userId.name !== 'User' ? rev.userId.name : (rev.userId?.username || 'User')}</Typography>
                             <Rating value={rev.rating} readOnly size="small" />
                           </Box>
                           <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {new Date(rev.createdAt).toLocaleDateString()}
                           </Typography>
                         </Stack>
                         <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.secondary' }}>
                            {rev.comment}
                         </Typography>
                      </Paper>
                    ))
                 )}
               </Stack>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Recommended Section */}
      <Box sx={{ mt: 10 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          {t('recommendedTitle')}
        </Typography>

        {recLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : recommended.length === 0 ? (
          <SimilarProductsPlaceholder />
        ) : (
          <Grid container spacing={3}>
            {recommended.map(rec => (
              <Grid item xs={12} sm={6} md={4} key={rec.id}>
                <Card elevation={4} sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => navigate(`/product/${rec.id}`)}>
                    <CardMedia component="img" height="160" image={rec.image} alt={rec.name} sx={{ objectFit: 'contain', p: 2 }} />
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom noWrap>
                        {rec.name}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(rec.price, currency)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default ProductDetails;

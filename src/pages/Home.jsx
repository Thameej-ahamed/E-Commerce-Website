import * as React from 'react';
import {
  Typography,
  Grid,
  Box,
  Container,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  styled,
  Pagination,
  Stack,
  Link,
  Collapse,
  Chip,
  Divider,
  Avatar,
  TextField,
  InputAdornment,
  useMediaQuery,
  Rating,
} from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import ProductCard from '../components/ProductCard';
import summerSaleImage from '../assets/images/summer-sale.jpg';
import techGadgetsImage from '../assets/images/tech-gadgets.jpg';
import trendingFashionImage from '../assets/images/trending-fashion.png';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import LockIcon from '@mui/icons-material/Lock';
import SyncIcon from '@mui/icons-material/Sync';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import RateReviewIcon from '@mui/icons-material/RateReview';
import '../App.css';
import { apiClient, withRetry } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';
import { useSettings } from '../context/SettingsContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const StyledCarousel = styled(Carousel)({
  height: '100%',
  '& .CarouselItem': {
    overflow: 'hidden',
    borderRadius: 0,
  },
  '& .MuiPaper-root': {
    overflow: 'hidden',
    borderRadius: 0,
  },
  '& .Carousel-indicators-container': {
    bottom: '20px',
    '& button': {
      backgroundColor: 'white',
      opacity: 0.6,
      '&:hover': { opacity: 1 },
      '&.selected': { opacity: 1 },
    },
  },
});

const normalizeProduct = p => {
  const canonical = p._id || p.id;
  return { ...p, id: canonical, _id: canonical };
};

/* ---------- Pretty states for Recommended ---------- */
function RecommendedError({ error, onRetry, t }) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Alert
      severity="warning"
      variant="outlined"
      icon={<CloudOffIcon />}
      sx={{
        borderRadius: 3,
        borderWidth: 2,
        maxWidth: 900,
        mx: 'auto',
        background: theme => `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
        '& .MuiAlert-message': { width: '100%' },
      }}
      action={
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Retry
          </Button>
        </Stack>
      }
    >
      <AlertTitle>Recommendations unavailable</AlertTitle>
      We couldn’t load personalized picks right now.
      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          endIcon={
            <ExpandMoreIcon
              sx={{
                transform: showDetails ? 'rotate(180deg)' : 'none',
                transition: '0.2s',
              }}
            />
          }
          onClick={() => setShowDetails(v => !v)}
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </Button>
        <Collapse in={showDetails}>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {error.message}
          </Typography>
        </Collapse>
      </Box>
    </Alert>
  );
}

function RecommendedEmpty({ onExplore, t }) {
  return (
    <Alert
      severity="info"
      icon={<InfoOutlinedIcon />}
      sx={{
        borderRadius: 3,
        maxWidth: 900,
        mx: 'auto',
        background: theme => `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
      }}
    >
      <AlertTitle>{t('noRecommendations') || 'No recommendations yet'}</AlertTitle>
      Browse a few products so we can learn your taste and surface better picks.
      <Box sx={{ mt: 1 }}>
        <Button onClick={onExplore} variant="outlined" size="small" endIcon={<ArrowForwardIcon fontSize="small" />}>
          {t('exploreMore') || 'Explore products'}
        </Button>
      </Box>
    </Alert>
  );
}

/* --------------------------------------------------- */

function Home({ products, addToCart, error, loading }) {
  const { t } = useSettings();
  const featuredProducts = React.useMemo(() => products.slice(0, 3).map(normalizeProduct), [products]);
  const newArrivals = React.useMemo(() => {
    if (!Array.isArray(products)) return [];
    return [...products]
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map(normalizeProduct);
  }, [products]);
  const CATEGORY_THUMBNAILS = {
    electronics: "https://www.designinfo.in/wp-content/uploads/2023/12/Apple-iPhone-15-Pro-Max-256GB-Blue-Titanium-1.webp",
    computers: "https://rukminim2.flixcart.com/image/480/640/xif0q/computer/w/o/9/-original-imahfyyskvad3vpk.jpeg?q=90",
    audio: "https://www.designinfo.in/wp-content/uploads/2023/08/Sony-WH-CH720N-Blue-1-485x485.webp",
    cameras: "https://sharpi.in/wp-content/uploads/2022/06/1653353121_1708099.jpg",
    fitness: "https://m.media-amazon.com/images/I/41M+F43gRJL._AC_UF1000,1000_QL80_.jpg",
    smarthome: "https://m.media-amazon.com/images/I/51u3-6AeGiL.jpg",
  };

  const categories = React.useMemo(() => {
    const unique = new Map();
    products.forEach(product => {
      if (!product?.category) return;
      const key = product.category.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, {
          key,
          label: product.category.charAt(0).toUpperCase() + product.category.slice(1),
          thumbnail: CATEGORY_THUMBNAILS[key] || product.image,
        });
      }
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [products]);

  const [animatedCards, setAnimatedCards] = React.useState([]);
  const [recs, setRecs] = React.useState([]);
  const [recLoading, setRecLoading] = React.useState(true);
  const [recError, setRecError] = React.useState(null);
  const [recPage, setRecPage] = React.useState(1);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewMessage, setReviewMessage] = React.useState('');
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [fetchedTestimonials, setFetchedTestimonials] = React.useState([]);
  const recPerPage = 6;
  const { notify } = useNotifier();
  const isSmall = useMediaQuery('(max-width:900px)');
  const navigate = useNavigate();
  const heroHeight = isSmall ? 420 : 560;

  const valueProps = [
    {
      title: t('freeDelivery'),
      description: t('freeDeliveryDesc'),
      icon: <LocalShippingIcon fontSize="large" />,
    },
    {
      title: t('conciergeSupport'),
      description: t('conciergeDesc'),
      icon: <HeadsetMicIcon fontSize="large" />,
    },
    {
      title: t('secureCheckout'),
      description: t('secureDesc'),
      icon: <LockIcon fontSize="large" />,
    },
    {
      title: t('returns'),
      description: t('returnsDesc'),
      icon: <SyncIcon fontSize="large" />,
    },
  ];

  const testimonials = React.useMemo(() => [
    {
      name: 'Riley Chen',
      role: 'Content Creator',
      quote: 'Xylo Electronics curates gear I didn’t even know I needed. The quality and delivery speed are unmatched.',
    },
    {
      name: 'Morgan Patel',
      role: 'Startup Founder',
      quote: 'From smart home tech to productivity gadgets, everything arrives perfectly packaged and ready to go.',
    },
    {
      name: 'Devon Brooks',
      role: 'Product Designer',
      quote: 'Their support team is next level. They helped me switch out a device overnight before a big launch.',
    },
  ], []);

  const brandInitials = ['SONY', 'BOSE', 'LG', 'SAMSUNG', 'ANKER', 'APPLE'];

  /* Featured card animation */
  React.useEffect(() => {
    const t = setTimeout(() => {
      setAnimatedCards(featuredProducts.map((_, i) => i));
    }, 120);
    return () => clearTimeout(t);
  }, [featuredProducts]);

  /* Fetch recommendations (hoisted for Retry) */
  const fetchRecs = React.useCallback(async () => {
    setRecLoading(true);
    setRecError(null);
    try {
      const visitedRaw = JSON.parse(localStorage.getItem('visitedProducts')) || [];
      const visited = visitedRaw.filter(entry => entry && entry.id);
      if (!visited.length) {
        localStorage.removeItem('visitedProducts');
        setRecs([]);
        return;
      }

      const seen = new Set();
      const lastTen = [];
      for (let i = visited.length - 1; i >= 0 && lastTen.length < 10; i -= 1) {
        const vid = visited[i].id;
        if (!vid || seen.has(vid)) continue;
        seen.add(vid);
        lastTen.push(vid);
      }
      if (!lastTen.length) {
        setRecs([]);
        return;
      }

      // Attempt Vector-based recommendations
      try {
        const { data } = await withRetry(() => apiClient.post('products/recommendations', { ids: lastTen }));
        if (Array.isArray(data) && data.length > 0) {
          setRecs(data);
          return;
        }
      } catch (vectorError) {
        console.warn('[Recs] Vector service unavailable, using local fallback:', vectorError.message);
      }

      // Fallback: Recommend Top Rated / New Arrivals from the existing product set
      const fallback = products
        .filter(p => !seen.has(p._id || p.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 12);

      setRecs(fallback);
    } catch (e) {
      console.error('[Recs] Critical failure in recommendation logic:', e);
      setRecs(products.slice(0, 6)); // Ultimate fallback
    } finally {
      setRecLoading(false);
    }
  }, [products]);

  const fetchTestimonials = React.useCallback(async () => {
    try {
      const { data } = await apiClient.get('testimonials');
      if (Array.isArray(data) && data.length > 0) {
        setFetchedTestimonials(data);
      }
    } catch (e) {
      console.warn('[Home] Testimonials fetch failed:', e.message);
    }
  }, []);

  React.useEffect(() => {
    fetchRecs();
    fetchTestimonials();
  }, [fetchRecs, fetchTestimonials]);

  /* Pagination helpers for recommendations */
  const recPageCount = Math.ceil(recs.length / recPerPage) || 1;
  const recStart = (recPage - 1) * recPerPage;
  const recToShow = recs.slice(recStart, recStart + recPerPage).map(normalizeProduct);
  const handleRecPageChange = (_e, value) => setRecPage(value);

  const bannerImages = [
    { url: summerSaleImage, title: t('summerSaleTitle'), description: t('summerSaleDesc') },
    { url: techGadgetsImage, title: t('techGadgetsTitle'), description: t('techGadgetsDesc') },
    { url: trendingFashionImage, title: t('trendingElectronicsTitle'), description: t('trendingElectronicsDesc') },
  ];

  const handleReviewSubmit = async event => {
    event.preventDefault();
    const message = reviewMessage.trim();
    if (!message) {
      notify({ severity: 'warning', message: 'Please share a message with your review.' });
      return;
    }

    setSubmittingReview(true);
    try {
      const profile = JSON.parse(localStorage.getItem('xyloProfile') || '{}');
      const userId = localStorage.getItem('xyloToken') ? profile.id : null;

      await apiClient.post('testimonials', {
        userId,
        userName: profile.name || 'Valued Guest',
        userRole: profile.name ? 'Verified Buyer' : 'Xylo Enthusiast',
        rating: reviewRating,
        message: message,
        avatar: profile.avatar || '',
      });

      notify({ severity: 'success', message: 'Thank you! Your review has been submitted.' });
      setReviewMessage('');
      setReviewRating(5);
      fetchTestimonials(); // Refresh lists
    } catch (err) {
      console.error('Review Error:', err);
      notify({ severity: 'error', message: 'We couldn’t save your review. Please try again.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleExplore = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayTestimonials = React.useMemo(() => {
    return [...fetchedTestimonials]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [fetchedTestimonials]);

  const testimonialsToShow = displayTestimonials.length > 0 ? displayTestimonials : testimonials;

  return (
    <Box sx={{ my: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          overflow: 'hidden',
          mb: 5,
          position: 'relative',
          background: 'linear-gradient(120deg, rgba(40,116,240,0.92) 0%, rgba(63,81,181,0.82) 100%)',
          minHeight: heroHeight,
        }}
      >
        <Grid container sx={{ height: '100%' }} alignItems="stretch">
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              p: { xs: 4, md: 8 },
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 3,
              minHeight: heroHeight,
            }}
          >
            <Chip label={t('heroTag')} sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
            <Box>
              <Typography variant={isSmall ? 'h4' : 'h3'} fontWeight={800} gutterBottom color="common.white">
                {t('heroTitle')}
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 440, lineHeight: 1.8 }}>
                {t('heroSubtitle')}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} component={RouterLink} to="/shop">
                {t('shopBestSellers')}
              </Button>
              <Button variant="outlined" size="large" color="inherit" component={RouterLink} to="/about">
                {t('learnOurStory')}
              </Button>
            </Stack>
            <Stack direction="row" spacing={3}>
              <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700}>
                  4.8/5
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {t('ratedBy')}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700}>
                  7 Days
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {t('avgDelivery')}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Box sx={{ flex: 1, position: 'relative', minHeight: heroHeight }}>
              <StyledCarousel
                height={heroHeight}
                animation="slide"
                autoPlay
                interval={3500}
                navButtonsAlwaysVisible
                indicatorIconButtonProps={{ style: { padding: 10 } }}
                navButtonsProps={{ style: { backgroundColor: 'rgba(17, 24, 39, 0.45)' } }}
              >
                {bannerImages.map(item => (
                  <Box key={item.title} sx={{ height: '100%', position: 'relative' }}>
                    <Box
                      component="img"
                      src={item.url}
                      alt={item.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        background: 'linear-gradient(180deg, rgba(10,13,28,0.05) 0%, rgba(10,13,28,0.75) 100%)',
                        color: '#fff',
                        p: { xs: 2, md: 3 },
                        borderRadius: '8px',
                      }}
                    >
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ maxWidth: 520 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </StyledCarousel>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Container maxWidth="xl">
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {valueProps.map(card => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 4, backdropFilter: 'blur(6px)' }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>{card.icon}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {t('featuredProducts')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('featuredSubtitle')}
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ maxWidth: 560, mx: 'auto' }}>
            {error.message}
          </Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {featuredProducts.map((p, idx) => (
              <Grid item key={p._id} xs={12} sm={6} md={4} className={animatedCards.includes(idx) ? 'product-card-animated' : ''}>
                <ProductCard product={p} addToCart={addToCart} />
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 8 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {t('newArrivals')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('newArrivalsSubtitle')}
              </Typography>
            </Box>
            <Button variant="text" endIcon={<ArrowForwardIcon />} href="/shop">
              {t('viewAllProducts')}
            </Button>
          </Stack>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {newArrivals.map(product => (
              <Grid item key={product.id} xs={12} sm={6} md={4}>
                <ProductCard product={product} addToCart={addToCart} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {!!categories.length && (
          <Box sx={{ mt: 10 }}>
            <Typography variant="h4" fontWeight={700} textAlign="center">
              {t('shopByCategory')}
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              {t('categorySubtitle')}
            </Typography>
            <Grid container spacing={3}>
              {categories.map(category => (
                <Grid item xs={12} sm={4} md={2} key={category.key}>
                  <Paper
                    elevation={0}
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 18px 30px rgba(15, 23, 42, 0.08)',
                      },
                    }}
                    onClick={() => {
                      notify({ severity: 'info', message: `Browsing ${category.label}` });
                      navigate(`/shop?category=${category.key}`);
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={category.thumbnail}
                      alt={category.label}
                      sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: 'primary.light' }}
                    >
                      {category.label.charAt(0)}
                    </Avatar>
                    <Typography fontWeight={600}>{category.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 10 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center">
            {t('personalizedForYou')}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            {t('personalizedSubtitle')}
          </Typography>

          {recError ? (
            <RecommendedError error={recError} onRetry={fetchRecs} t={t} />
          ) : recLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : recs.length === 0 ? (
            <RecommendedEmpty onExplore={handleExplore} t={t} />
          ) : (
            <>
              <Grid container spacing={4}>
                {recToShow.map(rec => (
                  <Grid item key={rec.id} xs={12} sm={6} md={4}>
                    <ProductCard product={rec} addToCart={addToCart} />
                  </Grid>
                ))}
              </Grid>

              {recPageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination count={recPageCount} page={recPage} onChange={handleRecPageChange} color="primary" />
                </Box>
              )}
            </>
          )}
        </Box>

        <Box sx={{ mt: 10 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center">
            {t('lovedByCreators')}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            {t('lovedSubtitle')}
          </Typography>
          <Grid container spacing={3}>
            {testimonialsToShow.map((testimonial, idx) => (
              <Grid item xs={12} md={4} key={`${testimonial._id || testimonial.userName || 'review'}-${idx}`}>
                <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 4 }}>
                  <Rating value={testimonial.rating || 5} readOnly precision={0.5} size="small" sx={{ mb: 1.5 }} />
                  <FormatQuoteRoundedIcon color="primary" sx={{ display: 'block', mb: 1 }} />
                  <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                    “{testimonial.message || testimonial.quote}”
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={testimonial.avatar} sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                      {(testimonial.userName || testimonial.name || 'C').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {testimonial.userName || testimonial.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.userRole || testimonial.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 10,
            p: { xs: 4, md: 6 },
            borderRadius: 5,
            background: 'linear-gradient(120deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.85) 100%)',
            color: 'white',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Chip
                  icon={<StarIcon fontSize="small" />}
                  label="Community Voices"
                  sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.18)', color: 'white' }}
                />
                <Typography variant="h4" fontWeight={700}>
                  Share Your Experience
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Help us build the future of tech. Your feedback drives our innovation and helps others find their perfect setup.
                </Typography>
                <Stack direction="row" spacing={3} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Stack>
                    <Typography variant="h6" fontWeight={700}>
                      100%
                    </Typography>
                    <Typography variant="caption">Authentic Reviews</Typography>
                  </Stack>
                  <Stack>
                    <Typography variant="h6" fontWeight={700}>
                      Real-time
                    </Typography>
                    <Typography variant="caption">Community Support</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box component="form" onSubmit={handleReviewSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography component="legend">Rating:</Typography>
                  <Rating
                    name="site-rating"
                    value={reviewRating}
                    onChange={(_, newValue) => setReviewRating(newValue)}
                    precision={0.5}
                    sx={{ '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.3)' } }}
                  />
                </Box>
                <TextField
                  multiline
                  rows={3}
                  variant="outlined"
                  value={reviewMessage}
                  onChange={event => setReviewMessage(event.target.value)}
                  placeholder="Tell us what you love about Xylo Electronics..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                        <RateReviewIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { bgcolor: 'white', borderRadius: 2 },
                  }}
                />
                <Button
                  variant="contained"
                  size="large"
                  endIcon={submittingReview ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                  type="submit"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ my: 10 }} />

        <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" flexWrap="wrap">
          {brandInitials.map(brand => (
            <Chip key={brand} icon={<StarIcon />} label={brand} sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)' }} />
          ))}
        </Stack>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {t('readyToBuild')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={2}>
            <Button variant="contained" size="large" component={RouterLink} to="/shop" endIcon={<ArrowForwardIcon />}>
              {t('viewMore')}
            </Button>
            <Button variant="outlined" size="large" component={RouterLink} to="/support">
              {t('talkSpecialist')}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;

import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currencyFormatter';

export default function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();
  const { currency, t } = useSettings();

  const canonicalId = product?._id || product?.id;
  const formattedCategory = product?.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : null;
  const ratingValue = typeof product?.rating === 'number' ? product.rating : null;
  const reviewCount = typeof product?.numReviews === 'number' ? product.numReviews : null;

  const handleViewDetails = () => {
    if (!canonicalId) {
      return;
    }
    navigate(`/product/${canonicalId}`);
  };

  const handleCardClick = event => {
    if (!canonicalId) return;
    const button = event.target.closest('button');
    if (button) return;
    handleViewDetails();
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 24px 38px rgba(15, 23, 42, 0.12)',
        },
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ position: 'relative', pt: '75%', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
        <CardMedia
          component="img"
          alt={product.name}
          src={product.image}
          loading="lazy"
          onError={e => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1526733169359-ab1142275411?auto=format&fit=crop&q=80&w=800'; // Tech Placeholder
          }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'transform 0.3s ease',
            p: 2,
            '&:hover': {
              transform: 'scale(1.08)',
            },
          }}
        />
        {formattedCategory && (
          <Chip
            size="small"
            label={formattedCategory}
            color="primary"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(40,116,240,0.92)',
              color: '#fff',
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {product.description}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            {formatCurrency(product.price, currency)}
          </Typography>
          {ratingValue !== null && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Rating name={`rating-${canonicalId}`} value={ratingValue} precision={0.5} readOnly size="small" />
              {reviewCount !== null && (
                <Typography variant="caption" color="text.secondary">
                  ({reviewCount})
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
        {typeof product?.stock === 'number' && (
          <Typography variant="caption" color={product.stock > 5 ? 'success.main' : 'warning.main'} sx={{ mt: 1, display: 'block' }}>
            {product.stock > 5 ? `${product.stock} ${t('inStock')}` : t('limitedStock') || 'Limited stock available'}
          </Typography>
        )}
      </CardContent>

      <CardActions disableSpacing sx={{ justifyContent: 'space-between', px: 2, pb: 2, mt: 'auto' }}>
        {(() => {
          const profile = JSON.parse(localStorage.getItem('xyloProfile') || '{}');
          if (profile.role === 'admin') return null;
          return (
            <Button
              size="small"
              variant="contained"
              onClick={event => {
                event.stopPropagation();
                addToCart(product);
              }}
            >
              {t('addToCartLabel')}
            </Button>
          );
        })()}
        <Tooltip title="See full specs" arrow sx={{ ml: 'auto' }}>
          <Button
            size="small"
            color="inherit"
            onClick={event => {
              event.stopPropagation();
              handleViewDetails();
            }}
          >
            {t('viewDetails') || 'View Details'}
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

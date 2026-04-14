import * as React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import NavigationBar from './components/NavigationBar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Wishlist from './pages/Wishlist';
import SharedWishlist from './pages/SharedWishlist';
import Orders from './pages/Orders';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import NotFoundPage from './pages/NotFoundPage';
import Footer from './components/Footer';
import About from './pages/About';
import Support from './pages/Support';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ShippingReturns from './pages/ShippingReturns';
import OrderTracking from './pages/OrderTracking';
import ScrollToTop from './components/ScrollToTop';
import { useNotifier } from './context/NotificationProvider';
import { useSettings } from './context/SettingsContext';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { apiClient, withRetry } from './services/apiClient';

const getDesignTokens = mode => ({
  palette: {
    mode,
    primary: {
      main: '#2874f0',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: mode === 'light' ? '#f4f7fb' : '#0f172a',
      paper: mode === 'light' ? '#ffffff' : '#1e293b',
    },
    text: {
      primary: mode === 'light' ? '#1f2933' : '#f8fafc',
      secondary: mode === 'light' ? '#4b5563' : '#94a3b8',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          paddingInline: 20,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: mode === 'light' ? '0 16px 30px rgba(40, 116, 240, 0.08)' : '0 16px 30px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: mode === 'light' ? '0 18px 42px rgba(15, 23, 42, 0.08)' : '0 18px 42px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#f4f7fb' : '#0f172a',
        },
      },
    },
  },
});

function App() {
  const { themeMode } = useSettings();
  const theme = React.useMemo(() => createTheme(getDesignTokens(themeMode)), [themeMode]);

  const [products, setProducts] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { notify } = useNotifier();

  React.useEffect(() => {
    const syncCart = async () => {
      const token = localStorage.getItem('xyloToken');
      if (token) {
        try {
          const { data } = await apiClient.get('cart');
          if (data && data.items) {
            // Map DB items (which might have populated productId) back to the flat structure the UI expects
            const mappedItems = data.items.map(item => ({
              ...(item.productId || {}),
              quantity: item.quantity,
              dbPrice: item.price,
            }));
            if (mappedItems.length > 0) {
              setCart(mappedItems);
            }
          }
        } catch (err) {
          console.warn('Backend cart sync failed', err);
        }
      } else {
        // Guest user - load from localStorage
        try {
          const storedCart = JSON.parse(localStorage.getItem('xyloCart'));
          if (Array.isArray(storedCart) && storedCart.length) {
            setCart(storedCart);
          }
        } catch (storageError) {
          console.warn('Unable to restore saved cart', storageError);
        }
      }
    };
    syncCart();
  }, []);

  React.useEffect(() => {
    localStorage.setItem('xyloCart', JSON.stringify(cart));
  }, [cart]);

  // Handle Product Fetching
  React.useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      setError(null);
      try {
        const { data } = await withRetry(() => apiClient.get('products'));
        if (!Array.isArray(data)) {
          throw new Error('Unexpected products response.');
        }
        const normalized = data.map(product => {
          const canonicalId = product?._id || product?.id;
          return {
            ...product,
            _id: canonicalId,
            id: canonicalId,
            // Map images array back to 'image' for UI compatibility if needed
            image: product.images && product.images.length ? product.images[0] : product.image,
          };
        });
        if (active) {
          setProducts(normalized);

          let removedCount = 0;
          setCart(prevCart => {
            if (!Array.isArray(prevCart) || !prevCart.length) return prevCart;
            const validIds = new Set(normalized.map(item => String(item.id)));
            const sanitized = prevCart.filter(item => {
              const itemId = item?._id || item?.id;
              return itemId && validIds.has(String(itemId));
            });
            removedCount = prevCart.length - sanitized.length;
            return sanitized;
          });

          if (removedCount > 0) {
            notify({ severity: 'info', message: 'We refreshed your cart to remove items that are no longer available.' });
          }
        }
      } catch (err) {
        if (!active) return;
        console.error('Error fetching products:', err);
        setProducts([]);
        setError(err);
        notify({ severity: 'error', message: 'Unable to load products. Please try again shortly.' });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [notify]);

  const addToCart = React.useCallback(
    async product => {
      if (!product) return;
      const canonicalId = product._id || product.id;
      if (!canonicalId) {
        notify({ severity: 'error', message: 'Unable to add this product right now.' });
        return;
      }

      const token = localStorage.getItem('xyloToken');

      // Real-time Sync if logged in
      if (token) {
        try {
          await apiClient.post('cart', {
            productId: canonicalId,
            quantity: 1,
            price: product.price,
          });
        } catch (err) {
          console.error('Failed to sync item to MongoDB cart', err);
        }
      }

      setCart(prevCart => {
        const alreadyInCart = prevCart.some(item => item.id === canonicalId || item._id === canonicalId);
        if (alreadyInCart) {
          notify({ severity: 'info', message: 'Item is already in your cart.' });
          return prevCart;
        }
        notify({ severity: 'success', message: 'Added to cart!' });
        const normalized = { ...product, id: canonicalId, _id: canonicalId };
        return [...prevCart, normalized];
      });
    },
    [notify]
  );

  const handleOrderComplete = React.useCallback(async () => {
    setCart([]);
    localStorage.removeItem('xyloCart');
    const token = localStorage.getItem('xyloToken');
    if (token) {
      try {
        await apiClient.delete('cart');
      } catch (err) {
        console.error('Failed to clear MongoDB cart', err);
      }
    }
    notify({ severity: 'success', message: 'Thank you for your order!' });
  }, [notify]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ScrollToTop />
        <NavigationBar cartItemCount={cart.length} />
        <Box component="main" sx={{ minHeight: 'calc(100vh - 200px)' }}>
          <Container maxWidth="xl" sx={{ pb: 8 }}>
            <Routes>
              <Route path="/" element={<Home products={products} loading={loading} error={error} addToCart={addToCart} />} />

              <Route path="/shop" element={<Shop products={products} addToCart={addToCart} loading={loading} error={error} />} />
              <Route path="/profile" element={<Profile />} />

              <Route path="/about" element={<About />} />

              <Route path="/support" element={<Support />} />

              <Route path="/terms" element={<Terms />} />

              <Route path="/privacy" element={<Privacy />} />

              <Route path="/shipping-returns" element={<ShippingReturns />} />

              <Route path="/order-tracking" element={<OrderTracking />} />

              <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />

              <Route path="/checkout" element={<Checkout cartItems={cart} onOrderComplete={handleOrderComplete} />} />

              <Route path="/order-success" element={<OrderSuccess />} />

              <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/wishlist" element={<Wishlist addToCart={addToCart} />} />
              <Route path="/wishlist/shared/:userId" element={<SharedWishlist addToCart={addToCart} />} />

              <Route path="/login" element={<Login />} />

              <Route path="/register" element={<Register />} />

              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />

              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<AdminDashboard />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Container>
        </Box>
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

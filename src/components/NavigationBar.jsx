import * as React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  useMediaQuery,
  Box,
  CircularProgress,
  Stack,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Divider,
  InputAdornment,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import SearchResults from './SearchResults';
import { apiClient } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';
import { useSettings } from '../context/SettingsContext';

function NavigationBar({ cartItemCount }) {
  const { themeMode, t, toggleTheme } = useSettings();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
  const searchBarRef = React.useRef(null);
  const searchResultsRef = React.useRef(null);
  const mobileSearchFieldRef = React.useRef(null);
  const open = Boolean(anchorEl);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:1200px)');
  const { notify, notifications, markAllRead } = useNotifier();
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);

  const navLinks = [
    { label: t('home'), to: '/', icon: <HomeRoundedIcon fontSize="small" /> },
    { label: t('shop'), to: '/shop', icon: <StorefrontIcon fontSize="small" /> },
    { label: t('about'), to: '/about', icon: <InfoOutlinedIcon fontSize="small" /> },
    { label: t('support'), to: '/support', icon: <SupportAgentIcon fontSize="small" /> },
  ];

  React.useEffect(() => {
    const checkUser = () => {
      const token = localStorage.getItem('xyloToken');
      setIsLoggedIn(Boolean(token));

      const profile = localStorage.getItem('xyloProfile');
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          setAvatarUrl(parsed.avatar || '');
          setIsAdmin(parsed.role === 'admin');
        } catch (e) {
          console.error('Error parsing profile', e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkUser();
    // Listen for custom auth change events
    window.addEventListener('authChange', checkUser);
    // Also listen for storage changes (other tabs)
    window.addEventListener('storage', checkUser);

    return () => {
      window.removeEventListener('authChange', checkUser);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenuClick = event => {
    // Refresh admin status from storage before opening menu
    const profile = localStorage.getItem('xyloProfile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        setIsAdmin(parsed.role === 'admin');
        setAvatarUrl(parsed.avatar || '');
      } catch (e) {}
    }
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleSearchChange = event => {
    const value = event.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('xyloToken');
    localStorage.removeItem('xyloProfile');
    localStorage.removeItem('xyloAddresses');
    window.dispatchEvent(new Event('authChange'));
    setIsLoggedIn(false);
    notify({ severity: 'success', message: 'Signed out successfully.' });
    navigate('/');
  };

  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotifClick = event => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
    markAllRead();
  };

  const debouncedSearch = React.useMemo(
    () =>
      debounce(async query => {
        if (query.trim() === '') {
          setSearchResults([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const response = await apiClient.get('search', { params: { q: query } });
          setSearchResults(response.data);
          if (Array.isArray(response.data) && response.data.length === 0) {
            notify({ severity: 'info', message: 'No products matched your search yet.' });
          }
        } catch (error) {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
          notify({ severity: 'error', message: 'Search is unavailable right now.' });
        } finally {
          setLoading(false);
        }
      }, 320),
    [notify]
  );

  React.useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearchModalClose = React.useCallback(() => {
    setSearchModalOpen(false);
    debouncedSearch.cancel();
    setSearchResults([]);
    setSearchQuery('');
    setLoading(false);
  }, [debouncedSearch]);

  const handleSearchModalOpen = () => {
    setSearchModalOpen(true);
    setTimeout(() => mobileSearchFieldRef.current?.focus(), 120);
  };

  const handleSearchResultClick = () => {
    if (searchModalOpen) {
      handleSearchModalClose();
    } else {
      setSearchResults([]);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = event => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    setSearchResults([]);
  }, [location.pathname]);

  const anchorRect = searchBarRef.current?.getBoundingClientRect();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background:
          themeMode === 'light'
            ? 'linear-gradient(90deg, #111827 0%, #1f3a93 40%, #3154d0 100%)'
            : 'linear-gradient(90deg, #020617 0%, #1e293b 40%, #334155 100%)',
        mb: 4,
        borderRadius: 0,
        '& .logo-link': {
          textDecoration: 'none',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.6rem',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
        },
        '& .search-bar': {
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 999,
          padding: '0.35rem 0.8rem',
          display: 'flex',
          alignItems: 'center',
          minWidth: { xs: '70%', md: 320 },
          maxWidth: 420,
          marginInline: { xs: 'auto', md: 0 },
          position: 'relative',
          transition: 'background-color 0.3s ease',
          '&:focus-within': {
            backgroundColor: 'rgba(255,255,255,0.18)',
          },
        },
        '& .search-bar input': {
          marginLeft: '0.5rem',
          border: 'none',
          outline: 'none',
          color: 'white',
          backgroundColor: 'transparent',
          width: '100%',
        },
      }}
    >
      <Toolbar sx={{ py: { xs: 1, md: 1.5 }, gap: { xs: 1.5, md: 2 } }}>
        {isMobile ? (
          <>
            <IconButton size="large" edge="start" color="inherit" aria-label="open navigation" onClick={handleClick}>
              <MenuIcon />
            </IconButton>
            <Menu id="mobile-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem
                onClick={() => {
                  handleClose();
                  handleSearchModalOpen();
                }}
                sx={{ gap: 0.5 }}
              >
                {t('search') || 'Search'}
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              {navLinks.map(link => (
                <MenuItem
                  key={link.to}
                  onClick={() => {
                    handleClose();
                    navigate(link.to);
                  }}
                >
                  {link.label}
                </MenuItem>
              ))}
              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate('/admin');
                  }}
                  sx={{ color: 'primary.main', fontWeight: 800 }}
                >
                  Admin Portal
                </MenuItem>
              )}
              {!isAdmin && (
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate('/cart');
                  }}
                >
                  <Badge
                    badgeContent={cartItemCount}
                    color="secondary"
                    showZero
                    sx={{
                      '& .MuiBadge-badge': {
                        top: 4,
                        right: -16,
                        minWidth: 20,
                        height: 20,
                      },
                    }}
                  >
                    <Typography component="span">{t('cart')}</Typography>
                  </Badge>
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  handleClose();
                  isLoggedIn ? handleLogout() : navigate('/login');
                }}
              >
                {isLoggedIn ? t('logout') || 'Logout' : t('login') || 'Login'}
              </MenuItem>
              {!isLoggedIn && (
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate('/register');
                  }}
                >
                  {t('register') || 'Register'}
                </MenuItem>
              )}
            </Menu>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, minWidth: 0 }}>
              <Link to="/" className="logo-link">
                XYLO ELECTRONICS
              </Link>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Link to="/" className="logo-link">
                XYLO ELECTRONICS
              </Link>
              <Typography component="span" variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
                Elevate Your Everyday Tech
              </Typography>
            </Typography>
            <form className="search-bar" ref={searchBarRef} onSubmit={e => e.preventDefault()}>
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
              <InputBase
                placeholder={t('searchPlaceholder') || 'Search gadgets, accessories...'}
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ flex: 1, minWidth: 0 }}
              />
              {loading && (
                <CircularProgress
                  size={18}
                  sx={{
                    color: 'white',
                    ml: 1,
                  }}
                />
              )}
            </form>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
              <Stack direction="row" spacing={0.9} alignItems="center">
                {navLinks.map(link => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Tooltip key={link.to} title={link.label} arrow placement="bottom">
                      <IconButton
                        component={Link}
                        to={link.to}
                        color="inherit"
                        size="small"
                        sx={{
                          bgcolor: isActive ? 'rgba(255,255,255,0.25)' : 'transparent',
                          transition: 'background-color 0.25s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.32)',
                          },
                        }}
                      >
                        {link.icon}
                      </IconButton>
                    </Tooltip>
                  );
                })}
              </Stack>

              <Tooltip title={t('notifications') || 'Notifications'} arrow>
                <IconButton color="inherit" size="small" onClick={handleNotifClick}>
                  <Badge badgeContent={unreadCount} color="error" overlap="circular">
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={themeMode === 'light' ? t('darkMode') : t('lightMode')} arrow>
                <IconButton color="inherit" size="small" onClick={toggleTheme}>
                  {themeMode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={notifAnchorEl}
                open={Boolean(notifAnchorEl)}
                onClose={handleNotifClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: { mt: 1.5, borderRadius: 3, width: 320, maxHeight: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
                }}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {t('notifications') || 'Notifications'}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={markAllRead}>
                    {t('markAllRead') || 'Mark all as read'}
                  </Typography>
                </Box>
                <Divider />
                {notifications.map(n => (
                  <MenuItem
                    key={n.id}
                    onClick={handleNotifClose}
                    sx={{
                      py: 1.5,
                      whiteSpace: 'normal',
                      display: 'block',
                      bgcolor: n.read ? 'transparent' : 'rgba(40,116,240,0.04)',
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: n.type === 'order' ? 'success.light' : n.type === 'offer' ? 'error.light' : 'primary.light',
                          fontSize: 14,
                        }}
                      >
                        {n.title.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={n.read ? 600 : 800}>
                          {n.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          {n.msg}
                        </Typography>
                        <Typography variant="caption" color="primary" fontSize={10}>
                          {n.time}
                        </Typography>
                      </Box>
                      {!n.read && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />}
                    </Stack>
                  </MenuItem>
                ))}
                {notifications.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('noNotifications') || 'No new notifications'}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <MenuItem sx={{ justifyContent: 'center', py: 1 }}>
                  <Typography variant="caption" fontWeight={700} color="primary" onClick={() => navigate('/profile')}>
                    {t('viewAllPreferences') || 'View all preferences'}
                  </Typography>
                </MenuItem>
              </Menu>

              <Tooltip title={t('account') || 'Account'} arrow>
                <IconButton color="inherit" size="small" onClick={handleProfileMenuClick}>
                  {isLoggedIn && avatarUrl ? (
                    <Avatar src={avatarUrl} sx={{ width: 28, height: 28, border: '1px solid rgba(255,255,255,0.5)' }} />
                  ) : (
                    <AccountCircleIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              <Menu
                id="profile-menu"
                anchorEl={profileAnchorEl}
                open={Boolean(profileAnchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: 3,
                    minWidth: 180,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {isLoggedIn
                  ? [
                      <MenuItem
                        key="profile"
                        onClick={() => {
                          handleProfileMenuClose();
                          navigate('/profile');
                        }}
                        sx={{ gap: 1 }}
                      >
                        <PersonIcon fontSize="small" />
                        {t('profile')}
                      </MenuItem>,
                      !isAdmin && (
                        <MenuItem
                          key="orders"
                          onClick={() => {
                            handleProfileMenuClose();
                            navigate('/orders');
                          }}
                          sx={{ gap: 1 }}
                        >
                          <ShoppingBagIcon fontSize="small" />
                          {t('orders')}
                        </MenuItem>
                      ),
                      isAdmin && (
                        <MenuItem
                          key="admin"
                          onClick={() => {
                            handleProfileMenuClose();
                            navigate('/admin');
                          }}
                          sx={{ gap: 1, color: 'primary.main', fontWeight: 700 }}
                        >
                          <AdminPanelSettingsIcon fontSize="small" />
                          Admin Portal
                        </MenuItem>
                      ),
                      !isAdmin && (
                        <MenuItem
                          key="wishlist"
                          onClick={() => {
                            handleProfileMenuClose();
                            navigate('/wishlist');
                          }}
                          sx={{ gap: 1 }}
                        >
                          <FavoriteIcon fontSize="small" />
                          {t('wishlist')}
                        </MenuItem>
                      ),
                      <MenuItem
                        key="settings"
                        onClick={() => {
                          handleProfileMenuClose();
                          navigate('/settings');
                        }}
                        sx={{ gap: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                        {t('settings')}
                      </MenuItem>,
                      <Divider key="divider" sx={{ my: 0.5 }} />,
                      <MenuItem
                        key="logout"
                        onClick={() => {
                          handleProfileMenuClose();
                          handleLogout();
                        }}
                        sx={{ color: 'error.main', gap: 1 }}
                      >
                        <LogoutIcon fontSize="small" />
                        {t('logout') || 'Sign Out'}
                      </MenuItem>,
                    ]
                  : [
                      <MenuItem
                        key="login"
                        onClick={() => {
                          handleProfileMenuClose();
                          navigate('/login');
                        }}
                        sx={{ gap: 1 }}
                      >
                        <LoginIcon fontSize="small" />
                        {t('login') || 'Sign In'}
                      </MenuItem>,
                      <MenuItem
                        key="register"
                        onClick={() => {
                          handleProfileMenuClose();
                          navigate('/register');
                        }}
                        sx={{ gap: 1 }}
                      >
                        <PersonAddAltIcon fontSize="small" />
                        {t('register') || 'Create Account'}
                      </MenuItem>,
                    ]}
              </Menu>

              {!isAdmin && (
                <Tooltip title={t('viewCart') || 'View cart'} arrow>
                  <IconButton color="inherit" component={Link} to="/cart" size="small">
                    <Badge badgeContent={cartItemCount} color="secondary" overlap="circular" showZero>
                      <ShoppingCartIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </>
        )}
      </Toolbar>

      {!isMobile && searchResults.length > 0 && anchorRect && (
        <Box
          ref={searchResultsRef}
          sx={{
            position: 'absolute',
            top: anchorRect.bottom + 12,
            left: anchorRect.left,
            width: 'min(420px, 85vw)',
            zIndex: theme => theme.zIndex.modal - 1,
            backgroundColor: 'white',
            borderRadius: 3,
            boxShadow: '0 22px 48px rgba(15, 23, 42, 0.18)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <SearchResults results={searchResults} onResultClick={handleSearchResultClick} setSearchResults={setSearchResults} />
        </Box>
      )}

      <Dialog open={searchModalOpen} onClose={handleSearchModalClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('searchProducts') || 'Search Products'}
          <IconButton onClick={handleSearchModalClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              inputRef={mobileSearchFieldRef}
              autoFocus
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t('searchPlaceholder') || 'Search gadgets, accessories...'}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : searchResults.length > 0 ? (
              <SearchResults results={searchResults} onResultClick={handleSearchResultClick} setSearchResults={setSearchResults} variant="modal" />
            ) : searchQuery.trim() ? (
              <Typography variant="body2" color="text.secondary">
                {t('noResults') || 'No products matched your search yet.'}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('startTyping') || 'Start typing to explore our catalog.'}
              </Typography>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </AppBar>
  );
}

export default NavigationBar;

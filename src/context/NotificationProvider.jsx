import * as React from 'react';
import { Alert, Snackbar, Slide } from '@mui/material';

const NotificationContext = React.createContext({ notify: () => {} });

const defaultOptions = {
  severity: 'info',
  autoHideDuration: 4000,
  anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
};

const slideUp = props => <Slide {...props} direction="up" />;

export function NotificationProvider({ children }) {
  const queueRef = React.useRef([]);
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(null);

  // Persistent Notification Center State
  const [notifications, setNotifications] = React.useState(() => {
    const saved = localStorage.getItem('xylo_notif_center');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Order Delivered', msg: 'Your items have been delivered.', time: '2m ago', type: 'order', read: false },
      { id: 2, title: 'Mega Deal!', msg: 'Flat 50% off on all accessories today.', time: '1h ago', type: 'offer', read: false },
      { id: 3, title: 'Email Verified', msg: 'Welcome to the premium Xylo club!', time: '1d ago', type: 'account', read: true },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('xylo_notif_center', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = React.useCallback((notif) => {
    const newNotif = {
      id: Date.now(),
      time: 'Just now',
      read: false,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // Keep last 10
  }, []);

  const markAllRead = React.useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const processQueue = React.useCallback(() => {
    if (queueRef.current.length && !current) {
      const next = queueRef.current.shift();
      setCurrent(next);
      setOpen(true);

      // Automatically add important alerts to the center
      if (next.severity === 'success' || next.severity === 'info') {
        addNotification({
          title: next.severity === 'success' ? 'Action Successful' : 'Information',
          msg: next.message,
          type: next.severity
        });
      }
    }
  }, [current, addNotification]);

  const notify = React.useCallback(
    options => {
      const payload = {
        key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...defaultOptions,
        ...options,
      };
      queueRef.current.push(payload);
      if (!open) {
        processQueue();
      }
    },
    [open, processQueue]
  );

  React.useEffect(() => {
    if (!open) {
      processQueue();
    }
  }, [open, processQueue]);

  const handleClose = (_event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleExited = () => {
    setCurrent(null);
  };

  const value = React.useMemo(() => ({ 
    notify, 
    notifications, 
    addNotification, 
    markAllRead,
    clearNotifications 
  }), [notify, notifications, addNotification, markAllRead, clearNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        key={current ? current.key : undefined}
        open={open}
        onClose={handleClose}
        TransitionComponent={slideUp}
        autoHideDuration={current?.autoHideDuration}
        anchorOrigin={current?.anchorOrigin || defaultOptions.anchorOrigin}
        onExited={handleExited}
        sx={{
          bottom: {
            xs: `calc(20px + env(safe-area-inset-bottom, 0px))`,
            sm: '24px',
          },
        }}
      >
        <Alert
          elevation={6}
          variant="filled"
          severity={current?.severity || defaultOptions.severity}
          onClose={handleClose}
          sx={{
            width: '100%',
            fontFamily: 'Poppins, sans-serif',
            borderRadius: 4,
            '& .MuiAlert-message': {
              fontFamily: 'Poppins, sans-serif',
            },
          }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export const useNotifier = () => React.useContext(NotificationContext);

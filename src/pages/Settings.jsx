import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LanguageIcon from '@mui/icons-material/Language';
import PaidIcon from '@mui/icons-material/Paid';
import { useSettings } from '../context/SettingsContext';

const Settings = () => {
  const { themeMode, toggleTheme, language, setLanguage, currency, setCurrency, t } = useSettings();
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4, color: theme.palette.text.primary }}>
        {t('settings')} ⚙️
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {/* Theme Setting */}
          <ListItem sx={{ py: 3 }}>
            <ListItemIcon>
              <DarkModeIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={t('appearance')} secondary={themeMode === 'light' ? t('lightMode') : t('darkMode')} />
            <FormControlLabel
              control={<Switch checked={themeMode === 'dark'} onChange={toggleTheme} color="primary" />}
              label={themeMode === 'dark' ? t('darkMode') : t('lightMode')}
            />
          </ListItem>
          <Divider variant="inset" component="li" />

          {/* Language Setting */}
          <ListItem sx={{ py: 3 }}>
            <ListItemIcon>
              <LanguageIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={t('language')} secondary={t('chooseLanguage')} />
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <Select value={language} onChange={e => setLanguage(e.target.value)} displayEmpty inputProps={{ 'aria-label': 'Without label' }}>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Arabic">Arabic</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
          <Divider variant="inset" component="li" />

          {/* Currency Setting */}
          <ListItem sx={{ py: 3 }}>
            <ListItemIcon>
              <PaidIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={t('currency')} secondary={t('chooseCurrency')} />
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <Select value={currency} onChange={e => setCurrency(e.target.value)} displayEmpty inputProps={{ 'aria-label': 'Without label' }}>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="INR">INR (₹)</MenuItem>
                <MenuItem value="JPY">JPY (¥)</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
        </List>
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('autoSave')}
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings;

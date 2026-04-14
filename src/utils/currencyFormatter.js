export const formatCurrency = (amount, currencyCode = 'INR') => {
  const options = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  };

  // We assume the amount is already in the target currency from the database
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(amount);
};

import { format, parse, isValid } from 'date-fns';
import { Currency, CurrencyRate, CURRENCY_SYMBOLS } from '../types';

// Example: rates = [{ from: 'USD', to: 'EGP', rate: 30 }]
export function convertCurrency(amount: number, from: Currency, to: Currency, rates: CurrencyRate[]): number {
  if (from === to) return amount;
  const rateObj = rates.find(r => r.from === from && r.to === to);
  if (!rateObj) {
    console.warn(`No conversion rate from ${from} to ${to}. Returning original amount.`);
    return amount;
  }
  return amount * rateObj.rate;
}

export const formatCurrency = (amount: number, currency: Currency = 'USD'): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || '';
  switch (currency) {
    case 'EGP':
      return `${symbol}${amount.toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'AED':
      return `${symbol}${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'USD':
    default:
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

export const formatDateInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const parseDate = (dateString: string): Date => {
  const parsed = parse(dateString, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : new Date();
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Currency conversion rates (you can integrate with a real API later)
export const getExchangeRates = () => ({
  USD: 1,
  EGP: 50.0, // 1 USD = 50.0 EGP
  AED: 13.67,  // 1 USD = 3.67 AED
});


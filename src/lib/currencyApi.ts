// src/lib/currencyApi.ts
// Fetches live currency rates from an external API (e.g., exchangerate.host)

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  updatedAt: Date;
}

export async function fetchCurrencyRates(base: string = 'USD', symbols: string[] = ['EGP', 'AED']): Promise<CurrencyRate[]> {
  // Using exchangerate.host (free, no API key required)
  const url = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols.join(',')}`;
  let data: any = {};
  let fallback = false;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch currency rates');
    data = await res.json();
  } catch (err) {
    console.warn('Currency API failed, using fallback rates.', err);
    fallback = true;
    data.rates = { EGP: 50.0, AED: 13.0 };
  }
  const now = new Date();
  const rates: CurrencyRate[] = [];
  for (const to of symbols) {
    if (data.rates && data.rates[to]) {
      rates.push({ from: base, to, rate: data.rates[to], updatedAt: now });
      // Add reverse rate
      rates.push({ from: to, to: base, rate: 1 / data.rates[to], updatedAt: now });
    }
  }
  // Add cross rates (EGP <-> AED)
  if (data.rates && data.rates['EGP'] && data.rates['AED']) {
    rates.push({ from: 'EGP', to: 'AED', rate: data.rates['AED'] / data.rates['EGP'], updatedAt: now });
    rates.push({ from: 'AED', to: 'EGP', rate: data.rates['EGP'] / data.rates['AED'], updatedAt: now });
  }
  // If still missing, add hardcoded fallback rates
  if (rates.length === 0 || fallback) {
    rates.push({ from: 'USD', to: 'EGP', rate: 50.0, updatedAt: now });
    rates.push({ from: 'USD', to: 'AED', rate: 13.0, updatedAt: now });
    rates.push({ from: 'EGP', to: 'USD', rate: 1 / 50.0, updatedAt: now });
    rates.push({ from: 'AED', to: 'USD', rate: 1 / 13.0, updatedAt: now });
    rates.push({ from: 'EGP', to: 'AED', rate: 13.0 / 50.0, updatedAt: now });
    rates.push({ from: 'AED', to: 'EGP', rate: 50.0 / 13.0, updatedAt: now });
  }
  return rates;
}

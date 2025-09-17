'use client';

import { useState, useEffect } from 'react';
// useEffect already imported above
import { Transaction, FinancialSummary } from '../types';
import { formatCurrency } from '../lib/utils';
import { fetchCurrencyRates, CurrencyRate } from '../lib/currencyApi';
import { generateAllTransactionsPDF } from '../lib/pdfGenerator';
import { DollarSign, TrendingUp, TrendingDown, Activity, Download } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  user: import('../types').User;
}

export default function Dashboard({ transactions, user }: DashboardProps) {
  // State for paginated recent transactions
  const [visibleCount, setVisibleCount] = useState(5);
  // Advanced filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [category, setCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Get unique categories from transactions
  const categories = Array.from(new Set(transactions.map(t => t.category))).filter(Boolean);

  // Filtering logic
  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    if (startDate && date < new Date(startDate)) return false;
    if (endDate && date > new Date(endDate)) return false;
    if (type !== 'all' && t.type !== type) return false;
    if (category && t.category !== category) return false;
    if (minAmount && t.amount < Number(minAmount)) return false;
    if (maxAmount && t.amount > Number(maxAmount)) return false;
    return true;
  });

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setType('all');
    setCategory('');
    setMinAmount('');
    setMaxAmount('');
  };
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactionCount: 0,
    currency: user.defaultCurrency,
  });
  const [reportCurrency, setReportCurrency] = useState<'USD' | 'EGP' | 'AED'>(user.defaultCurrency as 'USD' | 'EGP' | 'AED');
  const [rates, setRates] = useState<CurrencyRate[]>([]);

  // Fetch live rates on mount and when reportCurrency changes
  useEffect(() => {
    async function loadRates() {
      try {
        const apiRates = await fetchCurrencyRates('USD', ['EGP', 'AED']);
        setRates(apiRates);
      } catch (error) {
        console.error('Failed to fetch currency rates:', error);
      }
    }
    loadRates();
  }, [reportCurrency]);

  useEffect(() => {
    const calculateSummary = () => {
      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + require('../lib/utils').convertCurrency(
          t.amount,
          t.currency ?? reportCurrency,
          reportCurrency,
          rates
        ), 0);

      const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + require('../lib/utils').convertCurrency(
          t.amount,
          t.currency ?? reportCurrency,
          reportCurrency,
          rates
        ), 0);

      setSummary({
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactionCount: filteredTransactions.length,
        currency: reportCurrency,
      });
    };
    calculateSummary();
  }, [transactions, startDate, endDate, type, category, minAmount, maxAmount, reportCurrency]);

  const handleGenerateFullReport = () => {
    try {
      generateAllTransactionsPDF(transactions);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 animate-fade-in hover:shadow-2xl group transition-all duration-300 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-700 transition-colors duration-300">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 group-hover:scale-105 transition-transform duration-300 truncate">{value}</p>
          {trend && (
            <p className="text-xs text-cyan-600 mt-2 font-semibold group-hover:text-cyan-700 transition-colors duration-300">{trend}</p>
          )}
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl group-hover:from-cyan-600 group-hover:to-blue-700 transition-all duration-300 group-hover:scale-105 shadow-md flex-shrink-0 ml-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent rounded-full group-hover:via-cyan-500/50 transition-all duration-300"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
       {/* Welcome Header */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-10 animate-bounce-in shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Welcome to Company Financial Dashboard!</h1>
            <p className="text-slate-700 text-xl font-medium">Track your company's complete financial overview</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl animate-float shadow-lg">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters UI */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 animate-slide-up shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-900" />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-900" />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <select value={type} onChange={e => setType(e.target.value as 'all' | 'income' | 'expense')} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-900">
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-900">
              <option value="">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Min Amount</label>
            <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-900" />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Max Amount</label>
            <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-900" />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Currency</label>
            <select
              id="currency-select"
              value={reportCurrency}
              onChange={e => setReportCurrency(e.target.value as 'USD' | 'EGP' | 'AED')}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-slate-900"
            >
              <option value="USD">USD</option>
              <option value="EGP">EGP</option>
              <option value="AED">AED</option>
            </select>
          </div>
          <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <button onClick={resetFilters} className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-medium shadow-md">
              Reset Filters
            </button>
            <button onClick={handleGenerateFullReport} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-medium shadow-md flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
     

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="Total Income"
            value={formatCurrency(summary.totalIncome, summary.currency)}
            icon={TrendingUp}
            color="#10B981"
            trend="💰 All time earnings"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            title="Total Expenses"
            value={formatCurrency(summary.totalExpenses, summary.currency)}
            icon={TrendingDown}
            color="#EF4444"
            trend="💸 All time spending"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <StatCard
            title="Net Income"
            value={formatCurrency(summary.netIncome, summary.currency)}
            icon={DollarSign}
            color={summary.netIncome >= 0 ? "#10B981" : "#EF4444"}
            trend={summary.netIncome >= 0 ? "📈 Profit" : "📉 Loss"}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <StatCard
            title="Total Transactions"
            value={summary.transactionCount.toString()}
            icon={Activity}
            color="#3B82F6"
            trend="📊 All records"
          />
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 animate-slide-up shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Recent Transactions</h3>
          <span className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full font-medium text-sm">Last 5 entries</span>
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-6xl mb-4 animate-bounce">💰</div>
            <p className="text-slate-700 text-lg font-medium">No transactions yet</p>
            <p className="text-slate-500 mt-2">Add your first transaction to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.slice(0, visibleCount).map((transaction, index) => (
              <div key={transaction.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-4 rounded-xl transition-all duration-300 transform hover:scale-102 animate-fade-in shadow-sm" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full shadow-lg ${
                      transaction.type === 'income' ? 'bg-green-500 shadow-green-500/30' : 'bg-red-500 shadow-red-500/30'
                    }`} />
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.description}</p>
                      <p className="text-sm text-slate-600 font-medium">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(
                        require('../lib/utils').convertCurrency(
                          transaction.amount,
                          transaction.currency ?? reportCurrency,
                          reportCurrency,
                          rates
                        ),
                        reportCurrency
                      )}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredTransactions.length > visibleCount && (
              <div className="text-center pt-4 animate-fade-in">
                <button
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-medium shadow-md"
                  onClick={() => setVisibleCount(c => c + 5)}
                >
                  تحميل المزيد
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

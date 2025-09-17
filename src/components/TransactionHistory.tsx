'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { Transaction } from '../types';
import { deleteTransaction } from '../lib/transactions';
import { formatCurrency, formatDate } from '../lib/utils';
import { fetchCurrencyRates, CurrencyRate } from '../lib/currencyApi';
import { generateTransactionPDF } from '../lib/pdfGenerator';
import { Search, Trash2, Download } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  // onTransactionDeleted لم يعد مطلوباً
  user: {
    role: 'admin' | 'user' | 'cashier' | 'stock' | 'viewer';
  };
}

export default function TransactionHistory({ transactions, user }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [reportCurrency, setReportCurrency] = useState<'USD' | 'EGP' | 'AED'>('EGP');
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

  const handleDelete = async (id: string, description: string) => {
    if (confirm(`Are you sure you want to delete "${description}"?`)) {
      try {
        await deleteTransaction(id);
        // لم يعد مطلوباً
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const handleGeneratePDF = (transaction: Transaction) => {
    try {
      generateTransactionPDF(transaction);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = !filterCategory || transaction.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
      <div className="p-8 border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-slate-900 drop-shadow-lg">📋 Transaction History</h2>
          <span className="bg-cyan-100 text-cyan-700 px-6 py-3 rounded-full text-sm font-bold shadow-lg border border-cyan-200">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'Transaction' : 'Transactions'}
          </span>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Report Currency Selector */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <label className="block text-xs font-bold text-slate-700 mb-2">Report Currency</label>
            <select
              value={reportCurrency}
              onChange={e => setReportCurrency(e.target.value as 'USD' | 'EGP' | 'AED')}
              className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="USD">💵 USD</option>
              <option value="EGP">🇪🇬 EGP</option>
              <option value="AED">🇦🇪 AED</option>
            </select>
          </div>
          {/* Search */}
          <div className="flex-1 relative bg-slate-50 border border-slate-200 rounded-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5" />
            <input
              type="text"
              placeholder="🔍 Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-0 rounded-xl text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Type Filter */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <label className="block text-xs font-bold text-slate-700 mb-2">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">📊 All Types</option>
              <option value="income">💰 Income</option>
              <option value="expense">💸 Expense</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <label className="block text-xs font-bold text-slate-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">🏷️ All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-6">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-50 border border-slate-200 inline-block p-8 rounded-2xl">
              <p className="text-slate-600 text-lg font-medium">
                {searchTerm || filterType !== 'all' || filterCategory
                  ? '🔍 No transactions match your filters.'
                  : '📝 No transactions yet. Add your first transaction to get started!'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction, index) => (
              <div key={transaction.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-5 h-5 rounded-full shadow-lg ${
                      transaction.type === 'income' ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-200' : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-200'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate text-lg">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium">
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-lg">{transaction.category}</span>
                        <span className="text-slate-400">•</span>
                        <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg">{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-bold text-xl ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      } drop-shadow-sm`}>
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
                      <p className="text-sm text-white/80 capitalize font-semibold bg-white/10 px-3 py-1 rounded-full inline-block">{transaction.type}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGeneratePDF(transaction)}
                        className="p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                        title="Generate PDF"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      {(user && user.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(transaction.id, transaction.description)}
                          className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="px-8 py-6 bg-white/95 backdrop-blur-sm border border-slate-200 mx-6 mb-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-900 font-bold text-lg bg-slate-100 px-4 py-2 rounded-xl">
              📊 Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            <div className="flex space-x-6">
              <span className="text-green-700 font-bold text-lg bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                💰 Income: {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + require('../lib/utils').convertCurrency(t.amount, t.currency ?? reportCurrency, reportCurrency, rates), 0), reportCurrency)}
              </span>
              <span className="text-red-700 font-bold text-lg bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                💸 Expenses: {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + require('../lib/utils').convertCurrency(t.amount, t.currency ?? reportCurrency, reportCurrency, rates), 0), reportCurrency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

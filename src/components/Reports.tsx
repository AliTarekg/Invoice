'use client';

import { useMemo, useState } from 'react';
import QuotationForm from './QuotationForm';
import { Transaction } from '../types';
import { formatCurrency, calculatePercentage } from '../lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ReportsProps {
  transactions: Transaction[];
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

export default function Reports({ transactions }: ReportsProps) {
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [reportCurrency, setReportCurrency] = useState<'USD' | 'EGP' | 'AED'>('EGP');
  const categoryData = useMemo(() => {
    const categoryTotals = transactions.reduce((acc, transaction) => {
      const key = `${transaction.type}-${transaction.category}`;
      if (!acc[key]) {
        acc[key] = {
          category: transaction.category,
          type: transaction.type,
          amount: 0,
          count: 0,
        };
      }
      acc[key].amount += transaction.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { category: string; type: string; amount: number; count: number }>);

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const incomeData = Object.values(categoryTotals)
      .filter(item => item.type === 'income')
      .map(item => ({
        ...item,
        percentage: calculatePercentage(item.amount, totalIncome),
      }))
      .sort((a, b) => b.amount - a.amount);

    const expenseData = Object.values(categoryTotals)
      .filter(item => item.type === 'expense')
      .map(item => ({
        ...item,
        percentage: calculatePercentage(item.amount, totalExpenses),
      }))
      .sort((a, b) => b.amount - a.amount);

    return { incomeData, expenseData };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const monthlyTotals = transactions.reduce((acc, transaction) => {
      const monthKey = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { income: 0, expenses: 0 };
      }
      if (transaction.type === 'income') {
        acc[monthKey].income += transaction.amount;
      } else {
        acc[monthKey].expenses += transaction.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    return Object.entries(monthlyTotals)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-lg">
          <p className="font-bold text-slate-900 mb-2">{label}</p>
          {payload?.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {formatCurrency(entry.value, reportCurrency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: { category: string; amount: number; percentage: number }; color: string }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-lg">
          <p className="font-bold text-slate-900 mb-2">{data?.category}</p>
          <p style={{ color: payload[0]?.color }} className="font-medium">
            Amount: {formatCurrency(data?.amount || 0, reportCurrency)}
          </p>
          <p className="text-sm text-slate-600 font-medium">
            {data?.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-12">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce-in">📊</div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6">📈 Financial Reports</h2>
          <div className="bg-slate-50 border border-slate-200 inline-block p-8 rounded-2xl">
            <p className="text-slate-700 text-xl font-medium mb-2">
              No data available for reports yet.
            </p>
            <p className="text-slate-600">
              Add some transactions to see your financial analytics!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-8">
        <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4">
          📈 Financial Reports
        </h2>
        <p className="text-slate-700 mt-4 text-xl font-medium">Analyze your financial data and trends</p>
        <div className="mt-6 flex justify-center gap-4">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <label className="mr-3 font-bold text-slate-700">Report Currency:</label>
            <select
              value={reportCurrency}
              onChange={e => setReportCurrency(e.target.value as 'USD' | 'EGP' | 'AED')}
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 bg-white transition-all duration-200"
            >
              <option value="USD">💵 USD</option>
              <option value="EGP">🇪🇬 EGP</option>
              <option value="AED">🇦🇪 AED</option>
            </select>
          </div>
        </div>
      </div>


      {/* Monthly Trends */}
      {monthlyData.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-8 animate-fade-in">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-8">📅 Monthly Trends</h3>
          <div className="h-80 bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} name="💰 Income" dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={4} name="💸 Expenses" dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }} />
                <Line type="monotone" dataKey="net" stroke="#06B6D4" strokeWidth={4} name="📊 Net Income" dot={{ fill: '#06B6D4', strokeWidth: 2, r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Categories */}
        {categoryData.incomeData.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-8 animate-fade-in">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-8">💰 Income by Category</h3>
            <div className="h-80 bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.incomeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryData.incomeData.map((item, index) => (
                <div key={item.category} className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:bg-slate-100 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-5 h-5 rounded-full shadow-lg"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-bold text-slate-900 text-lg">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600 text-xl">{formatCurrency(item.amount, reportCurrency)}</span>
                      <span className="text-slate-600 ml-3 font-semibold bg-slate-200 px-3 py-1 rounded-full">({item.percentage}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense Categories */}
        {categoryData.expenseData.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-8 animate-fade-in">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-8">💸 Expenses by Category</h3>
            <div className="h-80 bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.expenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryData.expenseData.map((item, index) => (
                <div key={item.category} className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:bg-slate-100 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-5 h-5 rounded-full shadow-lg"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-bold text-slate-900 text-lg">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-600 text-xl">{formatCurrency(item.amount, reportCurrency)}</span>
                      <span className="text-slate-600 ml-3 font-semibold bg-slate-200 px-3 py-1 rounded-full">({item.percentage}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Comparison Bar Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-8 animate-fade-in">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-8">📊 Monthly Income vs Expenses</h3>
          <div className="h-80 bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" fill="#10B981" name="💰 Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#EF4444" name="💸 Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

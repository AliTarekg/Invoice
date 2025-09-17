'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Currency, CURRENCY_NAMES } from '../types';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function AuthForm() {
  // التسجيل الذاتي معطل، فقط تسجيل الدخول
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const { signIn, signUp } = useAuth();
  const { success, error: notifyError, info } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      info('Signing In', 'Authenticating your credentials...');
      await signIn(formData.email, formData.password);
      success('Login Successful', `Welcome back! You have been signed in successfully.`, {
        action: {
          label: 'Continue',
          onClick: () => {
            // User will be redirected automatically
          }
        }
      });
    } catch (error: any) {
      notifyError('Login Failed', error.message || 'Please check your email and password and try again.', {
        persistent: true,
        action: {
          label: 'Try Again',
          onClick: () => {
            setFormData(prev => ({ ...prev, password: '' }));
            document.getElementById('password-input')?.focus();
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <span className="text-white font-bold text-2xl">CF</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Company Finance Manager
          </h2>
          <p className="mt-2 text-xl font-semibold text-slate-700">
            ✨ Welcome to the team!
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Notifications are now handled by the global notification system */}

          <div className="space-y-4">
            {/* التسجيل الذاتي معطل */}

            <div>
              <label htmlFor="email" className="block text-sm font-medium ">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-cyan-300 placeholder-slate-400 text-slate-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium ">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-cyan-300 placeholder-slate-400 text-slate-900 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 " />
                  ) : (
                    <Eye className="h-5 w-5 " />
                  )}
                </button>
              </div>
            </div>

          </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn className="h-5 w-5 text-cyan-100 group-hover:text-white" />
                </span>
                {loading ? '⏳ الرجاء الانتظار...' : '🔐 تسجيل الدخول'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

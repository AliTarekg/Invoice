'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, History, BarChart3, Users, Menu, X, LogOut, User, RotateCcw, Tags } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'History', icon: History },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'categories', label: 'التصنيفات', icon: Tags },
    { id: 'returns', label: 'المرتجعات', icon: RotateCcw },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex glass-card shadow-2xl border-b border-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">CF</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Company Finance Manager
                </h1>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg transform scale-105'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 text-sm text-white/90 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">{user?.displayName || user?.email}</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-2xl border border-white/20 z-10 backdrop-blur-md">
                  <div className="p-3">
                    <div className="px-3 py-3 text-sm bg-gradient-to-r from-cyan-50/20 to-blue-50/20 rounded-lg border-b border-white/20 mb-2">
                      <p className="font-semibold text-white">{user?.displayName || 'User'}</p>
                      <p className="text-xs text-white/80">{user?.email}</p>
                      <p className="text-xs text-cyan-300 mt-1 font-medium">
                        💰 Currency: {user?.defaultCurrency}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 rounded-lg mt-1 font-medium transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden glass-card shadow-2xl border-b border-white/20 backdrop-blur-md">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Company Finance Manager
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/20 glass-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Profile Menu */}
        {isProfileMenuOpen && (
          <div className="border-t border-white/20 glass-card">
            <div className="px-4 py-4">
              <div className="text-sm text-white mb-3 bg-gradient-to-r from-cyan-50/20 to-blue-50/20 p-3 rounded-lg border border-white/20">
                <p className="font-semibold text-white">{user?.displayName || 'User'}</p>
                <p className="text-xs text-white/80">{user?.email}</p>
                <p className="text-xs text-cyan-300 mt-1 font-medium">
                  💰 Currency: {user?.defaultCurrency}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 rounded-lg font-medium transition-colors glass-button"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close menus */}
      {(isProfileMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </>
  );
}

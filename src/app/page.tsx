'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Supplier } from '../types';
import { getTransactions, useTransactionsRealtime } from '../lib/transactions';
import { getSuppliers } from '../lib/suppliers';
import ProtectedRoute from '../components/ProtectedRoute';
import Navigation from '../components/Navigation';
import dynamic from 'next/dynamic';
import { Home as HomeIcon, List, Users, FileText, PlusCircle, TrendingUp, ShoppingCart, UserCheck, RotateCcw } from 'lucide-react';

const Dashboard = dynamic(() => import('../components/Dashboard'));
const TransactionHistory = dynamic(() => import('../components/TransactionHistory'));
const Reports = dynamic(() => import('../components/Reports'));
const SuppliersManagement = dynamic(() => import('../components/SuppliersManagement'));
const AddTransaction = dynamic(() => import('../components/AddTransaction'));
const UsersManagement = dynamic(() => import('../components/UsersManagement'));
const LogoutButton = dynamic(() => import('../components/LogoutButton'));
const POSPage = dynamic(() => import('../components/POSPage'));
const StockReports = dynamic(() => import('../components/StockReports'));
const ShiftsManagement = dynamic(() => import('../components/ShiftsManagement'), { ssr: false });
const CustomersManagement = dynamic(() => import('../components/CustomersManagement'));
const ProductsManagement = dynamic(() => import('../components/ProductsManagement'));
const MultiSellProductForm = dynamic(() => import('../components/MultiSellProductForm'));
const QuotationManagement = dynamic(() => import('../components/QuotationManagement'));
const SalesManagement = dynamic(() => import('../components/SalesManagement'));
const ExpensesIncome = dynamic(() => import('../components/ExpensesIncome'));
const ReturnProductForm = dynamic(() => import('../components/ReturnProductForm'));
const ReturnsReport = dynamic(() => import('../components/ReturnsReport'));

// Page Transition Component
function PageTransition({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) {
  return (
    <div className={`transition-all duration-500 ease-in-out ${isVisible ? 'animate-page-transition' : 'opacity-0 translate-y-4'
      }`}>
      {children}
    </div>
  );
}

function MainApp() {
  // تحميل بيانات الموردين عند الدخول
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getSuppliers().then(data => {
      if (mounted) {
        setSuppliers(data);
        setIsLoading(false);
      }
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);
  // عناصر التنقل الجانبي
  // عناصر التنقل الجانبي (يجب أن تأتي بعد تعريف user)
  const navItems = [
    { key: 'dashboard', label: 'الرئيسية', icon: <HomeIcon className="w-5 h-5 mr-2" /> },
    { key: 'history', label: 'المعاملات', icon: <List className="w-5 h-5 mr-2" /> },
    { key: 'suppliers', label: 'الموردين', icon: <Users className="w-5 h-5 mr-2" /> },
    { key: 'customers', label: 'العملاء', icon: <UserCheck className="w-5 h-5 mr-2" /> },
    { key: 'products', label: 'المنتجات', icon: <PlusCircle className="w-5 h-5 mr-2" /> },
    { key: 'sales', label: 'المبيعات', icon: <TrendingUp className="w-5 h-5 mr-2" /> },
    { key: 'reports', label: 'التقارير', icon: <FileText className="w-5 h-5 mr-2" /> },
    { key: 'quotations', label: 'عروض السعر', icon: <FileText className="w-5 h-5 mr-2" /> },
    { key: 'shifts', label: 'الورديات', icon: <List className="w-5 h-5 mr-2" /> },
    { key: 'expenses-income', label: 'تسجيل مصروف/إيراد', icon: <PlusCircle className="w-5 h-5 mr-2 text-red-600" /> },
  ];
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // استخدم الاستماع اللحظي للمعاملات المالية
  const transactions = useTransactionsRealtime();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // (تم نقل تحميل الموردين فقط، لا تكرر هنا)

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-700 font-medium">جاري تحميل بيانات الشركة...</p>
          </div>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} user={user!} />;
      case 'history':
        return (
          <TransactionHistory
            transactions={transactions}
            user={user!}
          />
        );
      case 'suppliers':
        return <SuppliersManagement />;
      case 'customers':
        return <CustomersManagement />;
      case 'reports':
        return <Reports transactions={transactions} />;
      case 'stock-reports':
        return <StockReports />;
      case 'products':
        return <ProductsManagement />;
      case 'sell':
        return <MultiSellProductForm />;
      case 'quotations':
        return <QuotationManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'shifts':
        if (user?.role !== 'admin') return <div className="text-center text-red-600 font-bold">غير مصرح لك بالوصول لهذه الصفحة</div>;
        return <ShiftsManagement />;
      case 'expenses-income':
        if (user?.role !== 'admin') return <div className="text-center text-red-600 font-bold">غير مصرح لك بالوصول لهذه الصفحة</div>;
        return <ExpensesIncome />;
      case 'returns':
        return <ReturnsReport />;
      case 'return-form':
        return <ReturnProductForm />;

      default:
        return <Dashboard transactions={transactions} user={user!} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 flex animate-fade-in">
      {/* Sidebar */}
      <aside className={`fixed md:static left-0 top-0 h-full z-40 bg-white/95 backdrop-blur-sm border-r border-slate-200 transition-all duration-300 ${sidebarOpen ? 'translate-x-0 animate-slide-in-left' : '-translate-x-full'} md:translate-x-0 w-64 md:w-64 flex-shrink-0 flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <span className="text-xl font-bold text-slate-900 animate-fade-in">قلج المالية</span>
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-all duration-200" onClick={() => setSidebarOpen(false)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" className="text-slate-600">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-2">
          {navItems.map((item, index) => (
            <button
              key={item.key}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-right transition-all duration-300 transform hover:scale-105 ${activeTab === item.key
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                  setIsTransitioning(false);
                }, 150);
              }}
            >
              <div className="ml-3 transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          {/* زر نقاط البيع (POS) */}
          <button
            key="pos"
            className={`w-full flex items-center px-4 py-3 rounded-xl text-right transition-all duration-300 transform hover:scale-105 ${activeTab === 'pos'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setActiveTab('pos');
                setSidebarOpen(false);
                setIsTransitioning(false);
              }, 150);
            }}
          >
            <ShoppingCart className="w-5 h-5 ml-3 transition-transform duration-200 hover:scale-110" />
            <span className="font-medium">صفحة البيع</span>
          </button>
          <button
            key="stock-reports"
            className={`w-full flex items-center px-4 py-3 rounded-xl text-right transition-all duration-300 transform hover:scale-105 ${activeTab === 'stock-reports'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setActiveTab('stock-reports');
                setSidebarOpen(false);
                setIsTransitioning(false);
              }, 150);
            }}
          >
            <TrendingUp className="w-5 h-5 ml-3 transition-transform duration-200 hover:scale-110" />
            <span className="font-medium">تقارير المخزون</span>
          </button>
          
          <button
            key="return-form"
            className={`w-full flex items-center px-4 py-3 rounded-xl text-right transition-all duration-300 transform hover:scale-105 ${activeTab === 'return-form'
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setActiveTab('return-form');
                setSidebarOpen(false);
                setIsTransitioning(false);
              }, 150);
            }}
          >
            <RotateCcw className="w-5 h-5 ml-3 transition-transform duration-200 hover:scale-110" />
            <span className="font-medium">إرجاع منتج</span>
          </button>
          {/* زر إدارة المستخدمين للمدير فقط */}
          {user?.role === 'admin' && (
            <button
              key="users-management"
              className={`w-full flex items-center px-4 py-3 rounded-xl text-right transition-all duration-300 transform hover:scale-105 ${activeTab === 'users-management'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setActiveTab('users-management');
                  setSidebarOpen(false);
                  setIsTransitioning(false);
                }, 150);
              }}
            >
              <Users className="w-5 h-5 ml-3 transition-transform duration-200 hover:scale-110" />
              <span className="font-medium">إدارة المستخدمين</span>
            </button>
          )}
        </nav>
        <div className="px-6 py-4 border-t border-white/20 flex flex-col gap-3">
          <div className="animate-fade-in">
            <LogoutButton />
          </div>
          <div className="text-xs text-slate-500 text-center animate-fade-in">© 2025 Qalaj Financial</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden bg-white/95 backdrop-blur-sm border border-slate-200 mx-4 mt-4 rounded-2xl shadow-xl animate-slide-down">
          <div className="flex items-center justify-between px-4 py-3">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-all duration-200" onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" className="text-slate-600">
                <path d="M4 6h20M4 12h20M4 18h20" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="font-bold text-slate-900 text-lg">قلج المالية</span>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in">
          <PageTransition isVisible={!isTransitioning}>
            {/* عرض صفحة إدارة المستخدمين إذا اختارها المدير */}
            {activeTab === 'users-management' && user?.role === 'admin' ? (
              <UsersManagement />
            ) : activeTab === 'pos' ? (
              <POSPage />
            ) : (
              renderContent()
            )}
          </PageTransition>
        </main>
        <AddTransaction />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  );
}

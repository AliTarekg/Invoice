import { useState, useEffect } from 'react';
import { collection, getDoc, doc, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addStockMovement } from '../lib/stock';
import { searchSalesByInvoicePartial } from '../lib/pos';
import { 
  Search, 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft, 
  Calendar,
  User,
  DollarSign,
  Minus,
  Plus,
  RotateCcw,
  X
} from 'lucide-react';

interface SaleProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  id: string;
  customerName?: string;
  date: any;
  products: SaleProduct[];
  total: number;
  invoiceNumber?: string;
}

interface ReturnItem {
  productId: string;
  name: string;
  soldQuantity: number;
  returnQuantity: number;
  price: number;
  returnTotal: number;
}

export default function ReturnProductForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState<'search' | 'select' | 'confirm'>('search');

  // البحث عن الفواتير
  async function handleSearch() {
    if (!searchTerm.trim()) {
      setError('يرجى إدخال رقم الفاتورة أو جزء منه');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const results = await searchSalesByInvoicePartial(searchTerm);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('لم يتم العثور على فواتير تطابق البحث');
      } else if (results.length === 1) {
        // إذا كانت نتيجة واحدة، اختارها مباشرة
        handleSelectSale(results[0]);
      } else {
        setCurrentStep('select');
      }
    } catch (err) {
      console.error('Error searching sales:', err);
      setError('حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  }

  // اختيار فاتورة
  function handleSelectSale(sale: Sale) {
    setSelectedSale(sale);
    
    // إعداد عناصر المرتجع
    const items: ReturnItem[] = sale.products.map(product => ({
      productId: product.productId,
      name: product.name,
      soldQuantity: product.quantity,
      returnQuantity: 0,
      price: product.price,
      returnTotal: 0
    }));
    
    setReturnItems(items);
    setCurrentStep('confirm');
  }

  // تحديث كمية المرتجع
  function updateReturnQuantity(productId: string, quantity: number) {
    setReturnItems(items => 
      items.map(item => {
        if (item.productId === productId) {
          const newQuantity = Math.max(0, Math.min(quantity, item.soldQuantity));
          return {
            ...item,
            returnQuantity: newQuantity,
            returnTotal: newQuantity * item.price
          };
        }
        return item;
      })
    );
  }

  // تسجيل المرتجع
  async function handleReturn() {
    setError('');
    setSuccess('');
    
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    
    if (itemsToReturn.length === 0) {
      setError('يرجى تحديد كمية لإرجاعها');
      return;
    }

    setLoading(true);
    
    try {
      // إضافة المنتجات للمخزون
      for (const item of itemsToReturn) {
        await addStockMovement({
          productId: item.productId,
          type: 'in',
          quantity: item.returnQuantity,
          date: new Date().toISOString(),
          reason: `مرتجع من الفاتورة ${selectedSale?.invoiceNumber || selectedSale?.id}`,
        });
      }

      // تسجيل عملية المرتجع
      await addDoc(collection(db, 'returns'), {
        saleId: selectedSale?.id,
        invoiceNumber: selectedSale?.invoiceNumber,
        customerName: selectedSale?.customerName,
        items: itemsToReturn.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.returnQuantity,
          price: item.price,
          total: item.returnTotal
        })),
        totalAmount: itemsToReturn.reduce((sum, item) => sum + item.returnTotal, 0),
        date: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      setSuccess('تم تسجيل المرتجع بنجاح');
      
      // إعادة تعيين النموذج
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (err) {
      console.error('Error processing return:', err);
      setError('حدث خطأ أثناء تسجيل المرتجع');
    } finally {
      setLoading(false);
    }
  }

  // إعادة تعيين النموذج
  function resetForm() {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedSale(null);
    setReturnItems([]);
    setError('');
    setSuccess('');
    setCurrentStep('search');
  }

  // حساب إجمالي المرتجع
  const totalReturnAmount = returnItems.reduce((sum, item) => sum + item.returnTotal, 0);
  const totalReturnItems = returnItems.filter(item => item.returnQuantity > 0).length;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <RotateCcw className="w-8 h-8 text-blue-600" />
            إرجاع منتجات (مرتجع جزئي)
          </h1>
          <p className="text-gray-600">يمكنك إرجاع منتجات محددة من أي فاتورة</p>
        </div>

        {/* مؤشر الخطوات */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center space-x-8 space-x-reverse">
            {[
              { step: 'search', label: 'البحث عن الفاتورة', icon: Search },
              { step: 'select', label: 'اختيار الفاتورة', icon: ShoppingCart },
              { step: 'confirm', label: 'تأكيد المرتجع', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep === step ? 'bg-blue-600 text-white' : 
                  ['search', 'select', 'confirm'].indexOf(currentStep) > index ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 font-medium ${
                  currentStep === step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {index < 2 && (
                  <div className={`w-8 h-1 mx-4 ${
                    ['search', 'select', 'confirm'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* خطوة البحث */}
        {currentStep === 'search' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-600" />
              البحث عن الفاتورة
            </h3>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="أدخل رقم الفاتورة أو جزء منه..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    بحث
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* خطوة اختيار الفاتورة */}
        {currentStep === 'select' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                اختيار الفاتورة ({searchResults.length} نتيجة)
              </h3>
              <button
                onClick={() => setCurrentStep('search')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة للبحث
              </button>
            </div>

            <div className="space-y-4">
              {searchResults.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => handleSelectSale(sale)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-800">
                          {sale.invoiceNumber || sale.id}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {sale.date ? new Date(sale.date.seconds * 1000).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {sale.customerName || 'عميل غير محدد'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {sale.products?.length || 0} منتج
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {sale.total} جنيه
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-blue-600">
                      <ArrowLeft className="w-5 h-5 transform rotate-180" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* خطوة تأكيد المرتجع */}
        {currentStep === 'confirm' && selectedSale && (
          <div className="space-y-6">
            {/* معلومات الفاتورة */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  فاتورة رقم: {selectedSale.invoiceNumber || selectedSale.id}
                </h3>
                <button
                  onClick={() => setCurrentStep('search')}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  إلغاء
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>العميل: {selectedSale.customerName || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>التاريخ: {selectedSale.date ? new Date(selectedSale.date.seconds * 1000).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>إجمالي الفاتورة: {selectedSale.total} جنيه</span>
                </div>
              </div>
            </div>

            {/* منتجات المرتجع */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                تحديد المنتجات المراد إرجاعها
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700">
                      <th className="text-right p-3 font-semibold">المنتج</th>
                      <th className="text-center p-3 font-semibold">الكمية المباعة</th>
                      <th className="text-center p-3 font-semibold">كمية المرتجع</th>
                      <th className="text-center p-3 font-semibold">السعر</th>
                      <th className="text-center p-3 font-semibold">إجمالي المرتجع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item) => (
                      <tr key={item.productId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{item.name}</td>
                        <td className="p-3 text-center">{item.soldQuantity}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateReturnQuantity(item.productId, item.returnQuantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={item.soldQuantity}
                              value={item.returnQuantity}
                              onChange={(e) => updateReturnQuantity(item.productId, parseInt(e.target.value) || 0)}
                              className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-gray-900"
                            />
                            <button
                              onClick={() => updateReturnQuantity(item.productId, item.returnQuantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center">{item.price} جنيه</td>
                        <td className="p-3 text-center font-semibold text-blue-600">
                          {item.returnTotal} جنيه
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ملخص المرتجع */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>إجمالي المرتجع:</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{totalReturnItems} منتج</span>
                    <span className="text-blue-600">{totalReturnAmount} جنيه</span>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleReturn}
                  disabled={loading || totalReturnItems === 0}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري تسجيل المرتجع...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      تأكيد المرتجع ({totalReturnAmount} جنيه)
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  إلغاء وبداية جديدة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* رسائل النجاح والخطأ */}
        {success && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">{success}</p>
                <p className="text-sm">تم إضافة المنتجات المرتجعة للمخزون بنجاح</p>
              </div>
            </div>
          </div>
        )}

        {error && currentStep === 'confirm' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">{error}</p>
                <p className="text-sm">يرجى المحاولة مرة أخرى</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>

  );

}

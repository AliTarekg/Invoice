'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Customer, CustomerForm } from '../types/customer';
import { 
  getCustomers, 
  addCustomer, 
  updateCustomer, 
  deleteCustomer, 
  getCustomerPurchases 
} from '../lib/customers';
import { CustomerPurchase } from '../types/customer';

export default function CustomersManagement() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
    discount: '0',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError('خطأ في تحميل بيانات العملاء');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCustomerPurchases(customerId: string) {
    try {
      setError(''); // مسح أي خطأ سابق
      setPurchases([]); // مسح المشتريات السابقة أثناء التحميل
      
      const data = await getCustomerPurchases(customerId);
      setPurchases(data);
      
      if (data.length === 0) {
        console.log('لا توجد مشتريات لهذا العميل');
      }
    } catch (err) {
      console.error('Error loading customer purchases:', err);
      // لا نعرض رسالة خطأ للمستخدم، فقط نترك القائمة فارغة
      setPurchases([]);
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      discount: customer.discount.toString(),
      notes: customer.notes || '',
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      discount: '0',
      notes: '',
    });
    setEditingCustomer(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('الاسم ورقم الهاتف مطلوبان');
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        setSuccess('تم تحديث بيانات العميل بنجاح');
      } else {
        await addCustomer(formData);
        setSuccess('تم إضافة العميل بنجاح');
      }
      resetForm();
      loadCustomers();
    } catch (err) {
      setError('حدث خطأ أثناء حفظ بيانات العميل');
    }
  }

  async function handleDelete(id: string) {
    if (user?.role !== 'admin') {
      setError('غير مصرح لك بحذف العملاء');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await deleteCustomer(id);
        setSuccess('تم حذف العميل بنجاح');
        loadCustomers();
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
          setPurchases([]);
        }
      } catch (err) {
        setError('حدث خطأ أثناء حذف العميل');
      }
    }
  }

  function handleCustomerSelect(customer: Customer) {
    setSelectedCustomer(customer);
    loadCustomerPurchases(customer.id);
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">جاري تحميل بيانات العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">👥 إدارة العملاء</h2>
        <button
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          onClick={() => setShowForm(true)}
        >
          إضافة عميل جديد
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* قائمة العملاء */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-slate-900">قائمة العملاء ({filteredCustomers.length})</h3>
          
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            className="w-full border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 mb-4 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className={`border rounded-lg p-3 mb-2 cursor-pointer transition-all duration-200 ${
                  selectedCustomer?.id === customer.id 
                    ? 'bg-cyan-50 border-cyan-300 shadow-md' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:shadow-md'
                }`}
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900">{customer.name}</h4>
                    <p className="text-sm text-slate-600">{customer.phone}</p>
                    {customer.email && <p className="text-xs text-slate-500">{customer.email}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-cyan-600">{customer.loyaltyPoints} نقطة</div>
                    <div className="text-xs text-slate-500">خصم {customer.discount}%</div>
                    <div className="text-xs text-slate-500">مشتريات: {customer.totalPurchases}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className="text-cyan-600 hover:text-cyan-800 text-sm px-3 py-1 hover:bg-cyan-50 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                  >
                    تعديل
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer.id);
                      }}
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* تفاصيل العميل وسجل المشتريات */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6">
          {selectedCustomer ? (
            <>
              <h3 className="text-lg font-bold mb-4 text-slate-900">تفاصيل العميل: {selectedCustomer.name}</h3>
              <div className="mb-4 text-sm text-slate-700">
                <p><span className="font-semibold text-slate-900">الهاتف:</span> {selectedCustomer.phone}</p>
                {selectedCustomer.email && <p><span className="font-semibold text-slate-900">البريد:</span> {selectedCustomer.email}</p>}
                {selectedCustomer.address && <p><span className="font-semibold text-slate-900">العنوان:</span> {selectedCustomer.address}</p>}
                <p><span className="font-semibold text-slate-900">نقاط الولاء:</span> {selectedCustomer.loyaltyPoints}</p>
                <p><span className="font-semibold text-slate-900">إجمالي المشتريات:</span> {selectedCustomer.totalPurchases} جنيه</p>
                <p><span className="font-semibold text-slate-900">نسبة الخصم:</span> {selectedCustomer.discount}%</p>
                <p><span className="font-semibold text-slate-900">تاريخ التسجيل:</span> {selectedCustomer.createdAt.toLocaleDateString('ar-EG')}</p>
                {selectedCustomer.lastPurchase && <p><span className="font-semibold text-slate-900">آخر شراء:</span> {selectedCustomer.lastPurchase.toLocaleDateString('ar-EG')}</p>}
              </div>

              <h4 className="font-bold mb-2 text-slate-900">سجل المشتريات</h4>
              <div className="max-h-64 overflow-y-auto">
                {purchases.length === 0 ? (
                  <p className="text-slate-500 text-sm">لا توجد مشتريات لهذا العميل</p>
                ) : (
                  purchases.map(purchase => (
                    <div key={purchase.id} className="border border-slate-200 rounded-lg p-3 mb-2 text-sm bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-900">{purchase.amount} جنيه</span>
                        <span className="text-slate-500">{purchase.date.toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        <span>نقاط مكتسبة: {purchase.pointsEarned}</span>
                        {purchase.discountApplied > 0 && <span className="ml-2">خصم: {purchase.discountApplied} جنيه</span>}
                      </div>
                      <div className="mt-1">
                        {purchase.products.map((product, idx) => (
                          <div key={idx} className="text-xs text-slate-500">
                            {product.name} × {product.quantity} ({product.price} جنيه)
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500">
              اختر عميلاً لعرض تفاصيله
            </div>
          )}
        </div>
      </div>

      {/* نموذج إضافة/تعديل العميل */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-slate-900">
              {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="اسم العميل *"
                  className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="رقم الهاتف *"
                  className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <textarea
                  placeholder="العنوان"
                  className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 h-24 resize-none text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="نسبة الخصم (%)"
                  className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                />
                <textarea
                  placeholder="ملاحظات"
                  className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 h-24 resize-none text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition-all duration-200"
                >
                  {editingCustomer ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors"
                  onClick={resetForm}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

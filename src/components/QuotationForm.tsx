import { useState } from 'react';
import { formatCurrency } from '../lib/utils';
import { Download, Calculator } from 'lucide-react';
import { addQuotation } from '../lib/quotations';
import { generateQuotationPDF } from '../lib/pdfGenerator';
import { QuotationProduct } from '../types';



export default function QuotationForm() {
  const [company, setCompany] = useState('');
  const [products, setProducts] = useState<QuotationProduct[]>([]);
  const [product, setProduct] = useState<QuotationProduct>({ name: '', quantity: 1, price: 0 });
  const [taxRate, setTaxRate] = useState(14); // معدل الضريبة الافتراضي في مصر
  const [paymentTerms, setPaymentTerms] = useState('الدفع خلال 30 يوماً من تاريخ الفاتورة');
  const [deliveryDate, setDeliveryDate] = useState('15-30 يوم عمل من تاريخ التوقيع');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Calculate totals
  const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Add product to list
  const handleAddProduct = () => {
    if (!product.name || product.quantity <= 0 || product.price <= 0) return;
    setProducts([...products, product]);
  };

  // Remove product from list
  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  // Save quotation and download PDF
  const handleCreateQuotation = async () => {
    setIsLoading(true);
    setSuccess('');
    try {
      // TODO: Replace with actual userId from context
      const userId = 'demo-user';
      // Ensure taxRate is a valid number
      const validTaxRate = typeof taxRate === 'number' && !isNaN(taxRate) ? taxRate : 0;
      const quotation = {
        company,
        products,
        taxRate: validTaxRate,
        paymentTerms,
        deliveryDate,
        createdAt: new Date(),
        userId,
      };
      await addQuotation(quotation);
      await generateQuotationPDF(quotation);
      setSuccess('تم إنشاء عرض السعر بنجاح! PDF.');
      // Reset form
      setCompany('');
      setProducts([]);
      setTaxRate(14);
      setPaymentTerms('الدفع خلال 30 يوماً من تاريخ الفاتورة');
      setDeliveryDate('15-30 يوم عمل من تاريخ التوقيع');
    } catch (error) {
      setSuccess('حدث خطأ أثناء إنشاء عرض السعر');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">إنشاء عرض سعر جديد</h2>
      
      {/* معلومات الشركة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">اسم الشركة *</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
            placeholder="اسم الشركة المستهدفة"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 font-semibold text-slate-700">معدل الضريبة (%)</label>
          <input
            type="number"
            value={taxRate}
            onChange={e => setTaxRate(Number(e.target.value))}
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
            min="0"
            max="100"
            step="0.5"
          />
        </div>
      </div>

      {/* شروط الدفع وموعد التسليم */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block mb-2 font-semibold text-slate-700">شروط الدفع</label>
          <select
            value={paymentTerms}
            onChange={e => setPaymentTerms(e.target.value)}
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 bg-white transition-all duration-200"
          >
            <option value="الدفع خلال 30 يوماً من تاريخ الفاتورة">الدفع خلال 30 يوماً من تاريخ الفاتورة</option>
            <option value="الدفع خلال 15 يوماً من تاريخ الفاتورة">الدفع خلال 15 يوماً من تاريخ الفاتورة</option>
            <option value="الدفع خلال 7 أيام من تاريخ الفاتورة">الدفع خلال 7 أيام من تاريخ الفاتورة</option>
            <option value="الدفع كاش عند الاستلام">الدفع كاش عند الاستلام</option>
            <option value="دفع مقدم 50% والباقي عند التسليم">دفع مقدم 50% والباقي عند التسليم</option>
            <option value="دفع كامل مقدماً">دفع كامل مقدماً</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold text-slate-700">موعد التسليم المتوقع</label>
          <select
            value={deliveryDate}
            onChange={e => setDeliveryDate(e.target.value)}
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 bg-white transition-all duration-200"
          >
            <option value="15-30 يوم عمل من تاريخ التوقيع">15-30 يوم عمل من تاريخ التوقيع</option>
            <option value="7-14 يوم عمل من تاريخ التوقيع">7-14 يوم عمل من تاريخ التوقيع</option>
            <option value="3-7 أيام عمل من تاريخ التوقيع">3-7 أيام عمل من تاريخ التوقيع</option>
            <option value="يوم واحد من تاريخ التوقيع">يوم واحد من تاريخ التوقيع</option>
            <option value="فوري عند التوقيع">فوري عند التوقيع</option>
            <option value="حسب الاتفاق">حسب الاتفاق</option>
          </select>
        </div>
      </div>

      {/* إضافة منتج */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">إضافة منتج جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-slate-700">اسم المنتج *</label>
            <input
              type="text"
              value={product.name}
              onChange={e => setProduct({ ...product, name: e.target.value })}
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
              placeholder="اسم المنتج أو الخدمة"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-slate-700">الكمية *</label>
            <input
              type="number"
              value={product.quantity}
              min={1}
              onChange={e => setProduct({ ...product, quantity: Number(e.target.value) })}
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
              placeholder="الكمية"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-slate-700">السعر (جنيه) *</label>
            <input
              type="number"
              value={product.price}
              min={0}
              step="0.01"
              onChange={e => setProduct({ ...product, price: Number(e.target.value) })}
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
              placeholder="السعر"
            />
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleAddProduct} 
          className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          disabled={!product.name || product.quantity <= 0 || product.price <= 0}
        >
          إضافة المنتج
        </button>
      </div>

      {/* قائمة المنتجات */}
      {products.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">المنتجات المضافة</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3 text-right">اسم المنتج</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-center">السعر</th>
                  <th className="p-3 text-center">الإجمالي</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3 text-right">{p.name}</td>
                    <td className="p-3 text-center">{p.quantity}</td>
                    <td className="p-3 text-center">{formatCurrency(p.price, 'EGP')}</td>
                    <td className="p-3 text-center font-semibold text-green-600">
                      {formatCurrency(p.price * p.quantity, 'EGP')}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveProduct(idx)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ملخص الحسابات */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <div className="max-w-md ml-auto">
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-gray-600">المجموع الفرعي:</span>
                <span className="font-semibold">{formatCurrency(subtotal, 'EGP')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-gray-600">الضريبة ({taxRate}%):</span>
                <span className="font-semibold text-orange-600">{formatCurrency(taxAmount, 'EGP')}</span>
              </div>
              <div className="flex justify-between items-center py-3 text-lg font-bold text-green-600">
                <span>المجموع النهائي:</span>
                <span>{formatCurrency(total, 'EGP')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* زر الإنشاء */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleCreateQuotation}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center gap-3 mx-auto transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !company || products.length === 0}
        >
          <Download className="h-6 w-6" />
          {isLoading ? 'جاري الإنشاء...' : 'إنشاء عرض السعر وتنزيل PDF'}
        </button>
      </div>

      {/* رسالة النجاح */}
      {success && (
        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
          <div className="text-green-800 font-bold">{success}</div>
        </div>
      )}
    </div>
  );
}

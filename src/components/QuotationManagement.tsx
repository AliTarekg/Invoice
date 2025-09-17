"use client";
import { useEffect, useState } from 'react';
import QuotationForm from './QuotationForm';
import { Quotation } from '../types';
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { formatCurrency } from '../lib/utils';
import { generateQuotationPDF } from '../lib/pdfGenerator';

const QuotationManagement = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Quotation>>({});
  // Add state for QuotationForm modal
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  // Filters
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinTotal, setFilterMinTotal] = useState('');
  const [filterMaxTotal, setFilterMaxTotal] = useState('');

  useEffect(() => {
    const fetchQuotations = async () => {
      setLoading(true);
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, 'quotations'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Quotation[];
      setQuotations(data);
      setLoading(false);
    };
    fetchQuotations();
  }, []);

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    const db = getFirestore();
    await deleteDoc(doc(db, 'quotations', id));
    setQuotations(qs => qs.filter(q => q.id !== id));
  };

  const handleEdit = (quotation: Quotation) => {
    setEditId(quotation.id || '');
    setEditData(quotation);
  };

  const handleEditChange = (field: keyof Quotation, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editId) return;
    const db = getFirestore();
    await updateDoc(doc(db, 'quotations', editId), editData);
    setQuotations(qs => qs.map(q => q.id === editId ? { ...q, ...editData } as Quotation : q));
    setEditId(null);
    setEditData({});
  };

  // Filtered quotations
  const filteredQuotations = quotations.filter(q => {
    // Filter by company name
    if (filterCompany && (!q.company || !q.company.toLowerCase().includes(filterCompany.toLowerCase()))) return false;
    // Filter by date range
    let qDate: Date | null = null;
    if (q.createdAt) {
      if (typeof q.createdAt === 'string' || typeof q.createdAt === 'number') {
        qDate = new Date(q.createdAt);
      } else if (
        typeof q.createdAt === 'object' &&
        q.createdAt !== null &&
        !(q.createdAt instanceof Date) &&
        typeof (q.createdAt as any).toDate === 'function'
      ) {
        qDate = (q.createdAt as any).toDate();
      } else if (q.createdAt instanceof Date) {
        qDate = q.createdAt;
      }
    }
    if (filterStartDate && (!qDate || qDate < new Date(filterStartDate))) return false;
    if (filterEndDate && (!qDate || qDate > new Date(filterEndDate))) return false;
    // Filter by min/max total
    const total = q.products?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0;
    if (filterMinTotal && total < Number(filterMinTotal)) return false;
    if (filterMaxTotal && total > Number(filterMaxTotal)) return false;
    return true;
  });

  // Dashboard summary
  const totalQuotations = filteredQuotations.length;
  const totalSum = filteredQuotations.reduce((sum, q) => sum + (q.products?.reduce((s, p) => s + p.price * p.quantity, 0) || 0), 0);
  const avgTotal = totalQuotations ? (totalSum / totalQuotations) : 0;

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">📋 لوحة تحكم عروض السعر</h2>
        <button
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center"
          onClick={() => setShowQuotationForm(true)}
        >
          <span className="mr-2">إنشاء عرض سعر جديد</span>
          <svg width="20" height="20" fill="none" stroke="currentColor"><path d="M12 4v12m6-6H6" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>
      {/* Quotation Form Modal */}
      {showQuotationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowQuotationForm(false)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <QuotationForm />
          </div>
        </div>
      )}

      {/* Dashboard summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-cyan-600 mb-2">{totalQuotations}</div>
          <div className="text-slate-700 font-medium">إجمالي العروض</div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{formatCurrency(totalSum, 'EGP')}</div>
          <div className="text-slate-700 font-medium">إجمالي القيمة</div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(avgTotal, 'EGP')}</div>
          <div className="text-slate-700 font-medium">متوسط قيمة العرض</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <input
            type="text"
            placeholder="بحث باسم الشركة..."
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full md:w-48 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
            value={filterCompany}
            onChange={e => setFilterCompany(e.target.value)}
          />
          <input
            type="date"
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full md:w-40 text-slate-800 bg-white transition-all duration-200"
            value={filterStartDate}
            onChange={e => setFilterStartDate(e.target.value)}
          />
          <input
            type="date"
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full md:w-40 text-slate-800 bg-white transition-all duration-200"
            value={filterEndDate}
            onChange={e => setFilterEndDate(e.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="القيمة الأدنى"
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full md:w-32 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
            value={filterMinTotal}
            onChange={e => setFilterMinTotal(e.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="القيمة الأعلى"
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full md:w-32 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
            value={filterMaxTotal}
            onChange={e => setFilterMaxTotal(e.target.value)}
          />
        </div>
        <button
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-colors"
          onClick={() => {
            setFilterCompany('');
            setFilterStartDate('');
            setFilterEndDate('');
            setFilterMinTotal('');
            setFilterMaxTotal('');
          }}
        >مسح الفلاتر</button>
      </div>

      {/* Quotations table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg text-sm">
          <thead className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <tr>
              <th className="p-4 text-right font-semibold">اسم الشركة</th>
              <th className="p-4 text-center font-semibold">التاريخ</th>
              <th className="p-4 text-center font-semibold">الإجمالي</th>
              <th className="p-4 text-center font-semibold">خيارات</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 bg-slate-50">لا توجد عروض مطابقة للفلاتر الحالية</td>
              </tr>
            ) : filteredQuotations.map(q => (
              <tr key={q.id} className="border-b border-slate-200 hover:bg-cyan-50 transition-colors">
                <td className="p-4 text-right font-semibold text-slate-900">{q.company}</td>
                <td className="p-4 text-center text-slate-700">{
                  q.createdAt
                    ? (() => {
                        try {
                          if (typeof q.createdAt === 'string' || typeof q.createdAt === 'number') {
                            return new Date(q.createdAt).toLocaleDateString('ar-EG');
                          }
                          if (
                            typeof q.createdAt === 'object' &&
                            q.createdAt !== null &&
                            !(q.createdAt instanceof Date) &&
                            typeof (q.createdAt as any).toDate === 'function'
                          ) {
                            return (q.createdAt as any).toDate().toLocaleDateString('ar-EG');
                          }
                          if (q.createdAt instanceof Date) {
                            return q.createdAt.toLocaleDateString('ar-EG');
                          }
                          return '';
                        } catch {
                          return '';
                        }
                      })()
                    : ''
                }</td>
                <td className="p-4 text-center font-bold text-green-600 bg-green-50">{formatCurrency(q.products?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0, 'EGP')}</td>
                <td className="p-4">
                  <div className="flex gap-2 justify-center">
                    <button
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                      onClick={() => {
                        const validTaxRate = typeof q.taxRate === 'number' && !isNaN(q.taxRate) ? q.taxRate : 0;
                        generateQuotationPDF({ ...q, taxRate: validTaxRate });
                      }}
                    >PDF</button>
                    <button 
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm" 
                      onClick={() => handleEdit(q)}
                    >تعديل</button>
                    <button 
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm" 
                      onClick={() => handleDelete(q.id)}
                    >حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="font-bold mb-4 text-blue-700 text-center">تعديل العرض</h3>
            <div className="mb-3">
              <label className="block mb-1">اسم الشركة</label>
              <input className="border p-2 w-full rounded" value={editData.company || ''} onChange={e => handleEditChange('company', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block mb-1">شروط الدفع</label>
              <input className="border p-2 w-full rounded" value={editData.paymentTerms || ''} onChange={e => handleEditChange('paymentTerms', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block mb-1">موعد التسليم</label>
              <input className="border p-2 w-full rounded" value={editData.deliveryDate || ''} onChange={e => handleEditChange('deliveryDate', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block mb-1">نسبة الضريبة</label>
              <input type="number" className="border p-2 w-full rounded" value={editData.taxRate || 0} onChange={e => handleEditChange('taxRate', Number(e.target.value))} />
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" onClick={handleEditSave}>حفظ</button>
              <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setEditId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement;

// إدارة المستخدمين (للمدير فقط)
'use client';
import { useEffect, useState } from 'react';
import { getAllUsers, addUser, updateUserRole, deleteUser } from '../lib/users';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', displayName: '', password: '', role: 'cashier' as UserRole });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadUsers();
  }, [user]);

  async function loadUsers() {
    setLoading(true);
    setUsers(await getAllUsers());
    setLoading(false);
  }

  function validatePassword(password: string) {
    // يجب أن تحتوي على رقم، حرف كبير، حرف صغير، ورمز خاص
    return /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) &&
           password.length >= 8;
  }

  async function handleAddUser(e: any) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (!form.email) throw new Error('البريد الإلكتروني مطلوب');
      if (!form.password) throw new Error('كلمة المرور مطلوبة');
      if (!validatePassword(form.password)) throw new Error('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص');
      // إنشاء الحساب في Firebase Auth
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCredential.user, { displayName: form.displayName });
      // إضافة بيانات Firestore
      await addUser(userCredential.user.uid, form.email, form.role, form.displayName);
      setSuccess('تمت إضافة المستخدم');
      setForm({ email: '', displayName: '', password: '', role: 'cashier' });
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleRoleChange(uid: string, role: UserRole) {
    await updateUserRole(uid, role);
    loadUsers();
  }

  async function handleDelete(uid: string) {
    if (!window.confirm('هل أنت متأكد من حذف المستخدم؟')) return;
    await deleteUser(uid);
    loadUsers();
  }

  if (user?.role !== 'admin') {
    return <div className="text-center text-red-600 font-bold mt-10">غير مصرح لك بالوصول لهذه الصفحة</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6">👥 إدارة المستخدمين</h2>
      <button 
        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 mb-6" 
        onClick={() => setShowAdd(!showAdd)}
      >
        {showAdd ? 'إغلاق النموذج' : 'إضافة مستخدم جديد'}
      </button>
      
      {showAdd && (
        <form className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-6 mb-6" onSubmit={handleAddUser}>
          {error && <div className="text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 font-medium">{error}</div>}
          {success && <div className="text-green-600 mb-4 bg-green-50 border border-green-200 rounded-lg p-3 font-medium">{success}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-semibold text-slate-700">البريد الإلكتروني</label>
              <input 
                type="email" 
                className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" 
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                required 
                placeholder="example@company.com"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-slate-700">الاسم</label>
              <input 
                type="text" 
                className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" 
                value={form.displayName} 
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} 
                required 
                placeholder="اسم المستخدم"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-semibold text-slate-700">كلمة المرور</label>
              <input 
                type="password" 
                className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" 
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                required 
                placeholder="كلمة مرور قوية"
              />
              <div className="text-xs text-slate-500 mt-1">يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص</div>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-slate-700">الدور</label>
              <select 
                className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 bg-white transition-all duration-200" 
                value={form.role} 
                onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
              >
                <option value="admin" className="text-slate-800">مدير</option>
                <option value="cashier" className="text-slate-800">كاشير</option>
                <option value="stock" className="text-slate-800">مخزن</option>
                <option value="viewer" className="text-slate-800">مشاهد</option>
              </select>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            حفظ المستخدم
          </button>
        </form>
      )}
      
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-slate-600">جاري التحميل...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-slate-500 text-xl">لا يوجد مستخدمون</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <tr>
                <th className="p-4 text-right font-semibold">البريد الإلكتروني</th>
                <th className="p-4 text-center font-semibold">الاسم</th>
                <th className="p-4 text-center font-semibold">الدور</th>
                <th className="p-4 text-center font-semibold">خيارات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id || u.email} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-800 font-medium">{u.email}</td>
                  <td className="p-4 text-center text-slate-700">{u.displayName}</td>
                  <td className="p-4 text-center">
                    <select 
                      value={u.role} 
                      onChange={e => handleRoleChange(u.id, e.target.value as UserRole)} 
                      className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-3 py-2 text-slate-800 bg-white transition-all duration-200"
                    >
                      <option value="admin" className="text-slate-800">مدير</option>
                      <option value="cashier" className="text-slate-800">كاشير</option>
                      <option value="stock" className="text-slate-800">مخزن</option>
                      <option value="viewer" className="text-slate-800">مشاهد</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    {user.role === 'admin' && u.id !== user.id && (
                      <button 
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm" 
                        onClick={() => handleDelete(u.id)}
                      >
                        حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

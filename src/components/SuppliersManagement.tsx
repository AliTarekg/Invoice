'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Supplier, SupplierForm, SUPPLIER_CATEGORIES } from '../types';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../lib/suppliers';
import { Plus, X, Edit2, Trash2, Phone, Mail, MapPin, Package } from 'lucide-react';

export default function SuppliersManagement() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    products: [],
    notes: '',
    isActive: true,
  });
  const [productInput, setProductInput] = useState('');

  useEffect(() => {
    if (user) {
      loadSuppliers();
    }
  }, [user]);

  const loadSuppliers = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await getSuppliers(); // No user ID - get all company suppliers
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await addSupplier(formData, user.id);
      }
      
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Failed to save supplier. Please try again.');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      category: supplier.category,
      products: supplier.products,
      notes: supplier.notes || '',
      isActive: supplier.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteSupplier(id);
        loadSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Failed to delete supplier. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      products: [],
      notes: '',
      isActive: true,
    });
    setProductInput('');
    setEditingSupplier(null);
    setIsModalOpen(false);
  };

  const addProduct = () => {
    if (productInput.trim() && !formData.products.includes(productInput.trim())) {
      setFormData({
        ...formData,
        products: [...formData.products, productInput.trim()]
      });
      setProductInput('');
    }
  };

  const removeProduct = (product: string) => {
    setFormData({
      ...formData,
      products: formData.products.filter(p => p !== product)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            🏢 Suppliers Management
          </h2>
          <p className="text-slate-600 mt-2 text-lg">Manage your business suppliers and partners</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold"
        >
          <Plus className="h-5 w-5" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{supplier.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  supplier.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="text-cyan-600 hover:text-cyan-800 p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(supplier.id, supplier.name)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>{supplier.category}</span>
              </div>
              {supplier.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}
            </div>

            {supplier.products.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Products/Services:</p>
                <div className="flex flex-wrap gap-1">
                  {supplier.products.slice(0, 3).map((product, index) => (
                    <span key={index} className="inline-block bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded">
                      {product}
                    </span>
                  ))}
                  {supplier.products.length > 3 && (
                    <span className="text-xs text-slate-500">+{supplier.products.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-12 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No suppliers yet. Add your first supplier to get started!</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg text-slate-800 bg-white transition-all duration-200"
                    >
                      <option value="" className="text-slate-800">Select a category</option>
                      {SUPPLIER_CATEGORIES.map((category) => (
                        <option key={category} value={category} className="text-slate-800">
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                      placeholder="supplier@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full p-3 border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Products/Services
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={productInput}
                      onChange={(e) => setProductInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                      placeholder="Add a product or service"
                      className="flex-1 p-3 border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg text-slate-800 placeholder-slate-500 bg-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={addProduct}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.products.map((product, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-cyan-100 text-cyan-800 text-sm px-3 py-1 rounded-full"
                      >
                        {product}
                        <button
                          type="button"
                          onClick={() => removeProduct(product)}
                          className="ml-2 text-cyan-600 hover:text-cyan-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-slate-700">
                    Active supplier
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

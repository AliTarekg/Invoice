// src/components/ProductDetailsModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { Supplier } from '../types';
import { generateQRCode } from '../lib/qr';
import { Modal, Button } from './ui';
import { Edit3, Package, DollarSign, Users, QrCode, X } from 'lucide-react';
// ...existing code...
// (Assume all imports and state logic are above)

interface ProductDetailsModalProps {
  product: Product;
  suppliers: Supplier[];
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductDetailsModal({ product, suppliers, onClose, onEdit }: ProductDetailsModalProps) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode(product.id).then(setQr);
  }, [product.id]);

  const supplierElements = product.supplierIds.map((sid: string) => {
    const supplier = suppliers.find((s: Supplier) => s.id === sid);
    return supplier ? (
      <span 
        key={sid} 
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2 hover-lift"
      >
        <Users className="w-3 h-3 mr-1" />
        {supplier.name}
      </span>
    ) : null;
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="تفاصيل المنتج"
      size="lg"
    >
      <div className="space-y-6">
        {/* معلومات المنتج الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-xl hover-lift">
              <Package className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-500">اسم المنتج</label>
                <p className="text-lg font-semibold text-gray-900">{product.name}</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-green-50 rounded-xl hover-lift">
              <DollarSign className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-500">سعر الشراء</label>
                <p className="text-lg font-semibold text-green-700">{product.purchasePrice} جنيه</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-xl hover-lift">
              <DollarSign className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-500">سعر البيع</label>
                <p className="text-lg font-semibold text-blue-700">{product.salePrice} جنيه</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-orange-50 rounded-xl hover-lift">
              <Package className="w-6 h-6 text-orange-600 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-500">أقل كمية للبيع</label>
                <p className="text-lg font-semibold text-orange-700">{product.minSaleQuantity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* الموردون */}
        {product.supplierIds.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center mb-3">
              <Users className="w-5 h-5 text-gray-600 mr-2" />
              <label className="text-sm font-medium text-gray-700">الموردون</label>
            </div>
            <div className="flex flex-wrap">
              {supplierElements}
            </div>
          </div>
        )}

        {/* رمز الاستجابة السريعة */}
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6 text-purple-600 mr-2" />
            <span className="text-lg font-medium text-gray-700">رمز الاستجابة السريعة</span>
          </div>
          {qr ? (
            <div className="inline-block p-4 bg-white rounded-xl shadow-md hover-lift">
              <img src={qr} alt="QR Code" className="w-32 h-32 mx-auto" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-32 h-32 mx-auto bg-white rounded-xl shadow-md">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="warning"
            size="lg"
            icon={<Edit3 className="w-5 h-5" />}
            onClick={onEdit}
            className="flex-1"
          >
            تعديل المنتج
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
            className="flex-1"
          >
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
}

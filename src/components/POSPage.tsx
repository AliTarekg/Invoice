// واجهة نقاط البيع (POS) المطورة
'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getProducts } from '../lib/products';
import { getOpenShift, openShift, addSale as addSalePOS, addPayment, addAuditLog, searchSalesByInvoicePartial, getSaleById, processSaleReturn } from '../lib/pos';
import { getSales } from '../lib/sale';
import { getProductStock, addStockMovement } from '../lib/stock';
import { addTransaction } from '../lib/transactions';
import { findCustomerByPhone, addCustomerPurchase, calculateLoyaltyPoints, getCustomers } from '../lib/customers';
import { Product } from '../types/product';
import { Customer } from '../types/customer';
import { generateReceiptPDF } from '../lib/saleReceipt';
import { handleCloseShift } from '../lib/closeShiftHelper';
import { getShiftSummary } from '../lib/shiftSummary';

// ملاحظة: يجب أن يحتوي كل منتج على barcode في قاعدة البيانات وتعريف النوع
type ProductWithBarcode = Product & { barcode?: string };

export default function POSPage() {
  // حالات أساسية
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithBarcode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [shift, setShift] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithBarcode[] | null>(null);
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [closedShiftSummary, setClosedShiftSummary] = useState<any | null>(null);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [taxRate, setTaxRate] = useState<number>(14);
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showReturns, setShowReturns] = useState(false);
  const [returnInvoiceId, setReturnInvoiceId] = useState('');
  const [returnSale, setReturnSale] = useState<any>(null);
  const [returnSearchResults, setReturnSearchResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [returnReason, setReturnReason] = useState(''); // سبب الإرجاع
  const [selectedProductsForReturn, setSelectedProductsForReturn] = useState<{[key: string]: number}>({}); // المنتجات المختارة للإرجاع مع الكمية
  const [partialReturnMode, setPartialReturnMode] = useState(false); // وضع الإرجاع الجزئي
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // حساب مدة الوردية
  const getShiftDuration = useCallback(() => {
    if (!shiftStartTime) return '';
    const duration = currentTime.getTime() - shiftStartTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [currentTime, shiftStartTime]);

  // تحميل البيانات الأساسية
  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [productsData, customersData] = await Promise.all([
        getProducts(),
        getCustomers()
      ]);
      setProducts(productsData);
      setCustomers(customersData);
      
      if (user) {
        const shiftData = await getOpenShift(user.id);
        if (shiftData) {
          setShift(shiftData);
          // تعديل للتعامل مع أنواع التاريخ المختلفة
          const shiftDataAny = shiftData as any;
          if (shiftDataAny.openedAt) {
            let startTime: Date;
            if (typeof shiftDataAny.openedAt === 'string') {
              startTime = new Date(shiftDataAny.openedAt);
            } else if (shiftDataAny.openedAt.seconds) {
              startTime = new Date(shiftDataAny.openedAt.seconds * 1000);
            } else {
              startTime = new Date(shiftDataAny.openedAt);
            }
            setShiftStartTime(startTime);
          }
        }
      }
      
      // تحميل المخزون لجميع المنتجات
      const stockData: Record<string, number> = {};
      for (const product of productsData) {
        try {
          stockData[product.id] = await getProductStock(product.id);
        } catch (err) {
          console.warn(`Failed to load stock for product ${product.id}:`, err);
          stockData[product.id] = 0;
        }
      }
      setStockMap(stockData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('خطأ في تحميل البيانات');
    }
  }

  // تحديث المخزون في الوقت الفعلي
  const updateStockInRealtime = useCallback(async (productId: string, quantitySold: number) => {
    setStockMap(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) - quantitySold)
    }));
  }, []);

  // تعديل الكمية في السلة مع التحقق من المخزون
  async function updateCartQty(id: string, qty: number) {
    // تحقق من المخزون أولاً
    let stock = stockMap[id];
    if (stock === undefined) {
      stock = await getProductStock(id);
      setStockMap(prev => ({ ...prev, [id]: stock }));
    }
    if (qty > stock) {
      setError(`الكمية المطلوبة أكبر من المتوفر (${stock})`);
      setCart(prev => prev.map(item => item.id === id ? { ...item, qty: stock } : item));
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
    setError('');
  }

  // البحث المحسن عن المنتجات
  const enhancedProductSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    const term = searchTerm.trim().toLowerCase();
    const matches = products.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(term);
      const barcodeMatch = p.barcode && p.barcode.toLowerCase().includes(term);
      const idMatch = p.id.toLowerCase().includes(term);
      return nameMatch || barcodeMatch || idMatch;
    });

    // ترتيب النتائج بحسب الأولوية
    const sortedMatches = matches.sort((a, b) => {
      const aExactMatch = a.name.toLowerCase() === term || a.barcode === searchTerm || a.id === searchTerm;
      const bExactMatch = b.name.toLowerCase() === term || b.barcode === searchTerm || b.id === searchTerm;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      const aStartsWith = a.name.toLowerCase().startsWith(term);
      const bStartsWith = b.name.toLowerCase().startsWith(term);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.name.localeCompare(b.name, 'ar');
    });

    return sortedMatches;
  }, [products]);

  // البحث المحسن عن العملاء
  const searchCustomers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCustomerSearchResults([]);
      return;
    }

    const term = searchTerm.trim().toLowerCase();
    const matches = customers.filter(customer => {
      const nameMatch = customer.name.toLowerCase().includes(term);
      const phoneMatch = customer.phone.includes(searchTerm.trim());
      return nameMatch || phoneMatch;
    });

    setCustomerSearchResults(matches.slice(0, 5)); // أظهر أول 5 نتائج فقط
  }, [customers]);

  // البحث المحسن عن فاتورة للمرتجعات
  const searchSaleForReturn = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setReturnSale(null);
      setReturnSearchResults([]);
      return;
    }

    // Advanced search starts from 3 characters for better flexibility
    if (searchTerm.trim().length < 3) {
      setReturnSearchResults([]);
      setError('يرجى إدخال 3 أحرف على الأقل للبحث');
      return;
    }

    try {
      setError('');
      const sales = await getSales();
      
      // Enhanced search logic
      const term = searchTerm.trim().toLowerCase();
      const searchResults = sales.filter((sale: any) => {
        if (!sale || sale.isReturned || sale.returned) return false;
        
        // Search by invoice number (both new format and old ID)
        const invoiceMatch = sale.invoiceNumber?.toLowerCase().includes(term) || 
                           sale.id?.toLowerCase().includes(term);
        
        // Search by customer name
        const customerMatch = sale.customerName?.toLowerCase().includes(term);
        
        // Search by product names
        const productMatch = sale.products?.some((product: any) => 
          product.name?.toLowerCase().includes(term)
        );
        
        // Search by customer phone
        const phoneMatch = sale.customerPhone?.includes(term);
        
        return invoiceMatch || customerMatch || productMatch || phoneMatch;
      })
      .sort((a: any, b: any) => {
        // Sort by date - newest first
        const dateA = a.date ? (a.date.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime()) : 0;
        const dateB = b.date ? (b.date.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime()) : 0;
        return dateB - dateA;
      })
      .slice(0, 20); // Limit to 20 results

      if (searchResults.length === 0) {
        setReturnSearchResults([]);
        setError(`لم يتم العثور على نتائج للبحث: "${searchTerm}"`);
        return;
      }

      setReturnSearchResults(searchResults);
      setError('');
      
      // Auto-select if only one result
      if (searchResults.length === 1) {
        setReturnSale(searchResults[0]);
      }
    } catch (err) {
      console.error('Error searching sale:', err);
      setError('خطأ في البحث عن الفاتورة');
      setReturnSearchResults([]);
    }
  }, []);

  // معالجة المرتجع الجزئي الجديد
  const handleProcessPartialReturn = useCallback(async (sale: any, selectedProducts: any[], reason: string = '') => {
    if (!sale || !selectedProducts.length || isProcessingReturn) return;
    
    // حساب إجمالي مبلغ المرتجع
    const totalReturnAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.returnQuantity), 0);
    
    const confirmMessage = `هل أنت متأكد من إرجاع المنتجات المختارة من الفاتورة رقم ${sale.invoiceNumber || sale.id}؟
    
المنتجات المرتجعة:
${selectedProducts.map(p => `• ${p.name}: ${p.returnQuantity} قطعة (${p.price * p.returnQuantity} جنيه)`).join('\n')}

إجمالي مبلغ المرتجع: ${totalReturnAmount} جنيه${reason ? `\nالسبب: ${reason}` : ''}`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsProcessingReturn(true);
    setError('');

    try {
      // إرجاع المنتجات المختارة للمخزون
      for (const product of selectedProducts) {
        await addStockMovement({
          productId: product.productId,
          type: 'in',
          quantity: product.returnQuantity,
          date: new Date().toISOString(),
          note: `إرجاع جزئي من فاتورة ${sale.id} - ${sale.customerName || 'عميل نقدي'} - ${product.name}`,
        });
        
        // تحديث المخزون في الواجهة فوراً
        setStockMap(prev => ({
          ...prev,
          [product.productId]: (prev[product.productId] || 0) + product.returnQuantity
        }));
      }

      // إنشاء فاتورة مرتجع جزئية
      const partialReturnData = {
        originalSaleId: sale.id,
        originalInvoiceNumber: sale.invoiceNumber,
        userId: user?.id,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        products: selectedProducts.map(p => ({
          productId: p.productId,
          name: p.name,
          quantity: p.returnQuantity,
          price: p.price,
          originalQuantity: p.quantity
        })),
        total: totalReturnAmount,
        paymentType: sale.paymentType,
        reason: reason || 'مرتجع جزئي من نقاط البيع',
        returnReason: reason,
        returnType: 'partial',
        date: new Date().toISOString(),
      };

      // حفظ المرتجع في قاعدة البيانات
      const returnId = await processSaleReturn(sale.id, partialReturnData);

      // تسجيل معاملة مالية للمرتجع الجزئي
      await addTransaction({
        type: 'expense',
        amount: String(totalReturnAmount),
        currency: 'EGP',
        category: 'مرتجعات جزئية',
        description: `مرتجع جزئي من فاتورة ${sale.invoiceNumber || sale.id} - ${sale.customerName || 'عميل نقدي'}${reason ? ` - السبب: ${reason}` : ''}`,
        date: new Date().toISOString(),
      }, 'system');

      // تسجيل الحدث في سجل المراجعة
      await addAuditLog({
        action: 'partial_return',
        userId: user?.id,
        details: {
          originalSaleId: sale.id,
          returnId,
          amount: totalReturnAmount,
          products: selectedProducts,
          reason: reason || 'غير محدد',
          invoiceNumber: sale.invoiceNumber,
          returnType: 'partial'
        }
      });

      setSuccess(`تم إرجاع المنتجات المختارة من الفاتورة ${sale.invoiceNumber || sale.id} بنجاح! المبلغ المرتجع: ${totalReturnAmount} جنيه`);
      setReturnSale(null);
      setReturnInvoiceId('');
      setReturnSearchResults([]);
      setReturnReason('');
      setSelectedProductsForReturn({});
      setPartialReturnMode(false);

    } catch (err) {
      console.error('Error processing partial return:', err);
      setError(`حدث خطأ أثناء معالجة المرتجع الجزئي: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setIsProcessingReturn(false);
    }
  }, [user, isProcessingReturn]);

  // معالجة المرتجع الكامل (للحفاظ على التوافق مع النظام القديم)
  const handleProcessReturn = useCallback(async (sale: any, reason: string = '') => {
    if (!sale || isProcessingReturn) return;
    
    if (!window.confirm(`هل أنت متأكد من إرجاع الفاتورة رقم ${sale.invoiceNumber || sale.id}؟\nالمبلغ: ${sale.total} جنيه${reason ? `\nالسبب: ${reason}` : ''}`)) {
      return;
    }

    setIsProcessingReturn(true);
    setError('');

    try {
      // إرجاع المنتجات للمخزون
      if (sale.products && Array.isArray(sale.products)) {
        for (const product of sale.products) {
          await addStockMovement({
            productId: product.productId,
            type: 'in',
            quantity: product.quantity,
            date: new Date().toISOString(),
            note: `إرجاع من فاتورة ${sale.id} - ${sale.customerName || 'عميل نقدي'}`,
          });
          
          // تحديث المخزون في الواجهة فوراً
          setStockMap(prev => ({
            ...prev,
            [product.productId]: (prev[product.productId] || 0) + product.quantity
          }));
        }
      }

      // معالجة المرتجع في قاعدة البيانات
      const returnId = await processSaleReturn(sale.id, {
        userId: user?.id,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        products: sale.products,
        total: sale.total,
        tax: sale.tax,
        discount: sale.discount,
        paymentType: sale.paymentType,
        reason: reason || 'إرجاع من نقاط البيع',
        returnReason: reason, // سبب الإرجاع المحدد
      });

      // تسجيل معاملة مالية للمرتجع
      await addTransaction({
        type: 'expense',
        amount: String(sale.total),
        currency: 'EGP',
        category: 'مرتجعات',
        description: `إرجاع فاتورة ${sale.invoiceNumber || sale.id} - ${sale.customerName || 'عميل نقدي'}${reason ? ` - السبب: ${reason}` : ''}`,
        date: new Date().toISOString(),
      }, 'system');

      // تسجيل الحدث
      await addAuditLog({
        action: 'return',
        userId: user?.id,
        details: {
          originalSaleId: sale.id,
          returnId,
          amount: sale.total,
          products: sale.products,
          reason: reason || 'غير محدد', // سبب الإرجاع
          invoiceNumber: sale.invoiceNumber
        }
      });

      setSuccess(`تم إرجاع الفاتورة ${sale.invoiceNumber || sale.id} بنجاح! المبلغ: ${sale.total} جنيه`);
      setReturnSale(null);
      setReturnInvoiceId('');
      setReturnSearchResults([]);
      setReturnReason(''); // مسح سبب الإرجاع

    } catch (err) {
      console.error('Error processing return:', err);
      setError(`حدث خطأ أثناء معالجة المرتجع: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setIsProcessingReturn(false);
    }
  }, [user, isProcessingReturn]);

  // حماية الصلاحيات
  if (!user || (user.role !== 'admin' && user.role !== 'cashier')) {
    return <div className="text-center text-red-600 font-bold mt-10">غير مصرح لك بالوصول لنقاط البيع</div>;
  }

  // فتح وردية إذا لم توجد
  async function handleOpenShift() {
    if (!user) return;
    try {
      const shiftId = await openShift(user.id);
      const newShift = { id: shiftId, userId: user.id, isOpen: true, openedAt: new Date().toISOString() };
      setShift(newShift);
      setShiftStartTime(new Date());
      setSuccess('تم فتح الوردية بنجاح');
      setError('');
    } catch (err) {
      console.error('فتح الوردية فشل', err);
      setError('فشل في فتح الوردية');
    }
  }

  // البحث بالباركود أو الاسم أو المعرف المحسن
  function handleBarcodeEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && barcode.trim()) {
      const matches = enhancedProductSearch(barcode);
      if (matches && matches.length === 1) {
        addToCart(matches[0]);
        setBarcode('');
        setError('');
        setSearchResults(null);
      } else if (matches && matches.length > 1) {
        setSearchResults(matches);
        setError('وجد أكثر من منتج، اختر المنتج الصحيح');
      } else {
        setError('لم يتم العثور على منتج بهذا الباركود أو الاسم');
        setSearchResults(null);
      }
    }
  }

  // إضافة للسلة مع تحديث المخزون الفوري
  async function addToCart(product: Product) {
    // تحقق من المخزون أولاً
    let currentStock = stockMap[product.id];
    if (currentStock === undefined) {
      currentStock = await getProductStock(product.id);
      setStockMap(prev => ({ ...prev, [product.id]: currentStock }));
    }

    if (currentStock <= 0) {
      setError(`المنتج "${product.name}" غير متوفر في المخزون`);
      return;
    }

    setCart(prev => {
      const exists = prev.find((item: any) => item.id === product.id);
      if (exists) {
        const newQty = exists.qty + 1;
        if (newQty > currentStock) {
          setError(`الكمية المطلوبة أكبر من المتوفر (${currentStock})`);
          return prev;
        }
        return prev.map((item: any) => item.id === product.id ? { ...item, qty: newQty } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setError('');
  }

  // إزالة من السلة
  function removeFromCart(id: string) {
    setCart(prev => prev.filter(item => item.id !== id));
  }

  // حساب الإجمالي والضريبة والخصم
  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.salePrice, 0);
  const customerDiscount = selectedCustomer ? Math.round(subtotal * (Number(selectedCustomer.discount) / 100)) : 0;
  const discountedSubtotal = subtotal - customerDiscount;
  const tax = Math.round(discountedSubtotal * (taxRate / 100));
  const total = discountedSubtotal + tax;

  // البحث عن العميل بالهاتف المحسن
  async function searchCustomerByPhone() {
    if (!customerPhone.trim()) {
      setSelectedCustomer(null);
      setCustomerSearchResults([]);
      return;
    }

    try {
      const customer = await findCustomerByPhone(customerPhone.trim());
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setCustomerSearchResults([]);
        setSuccess(`تم العثور على العميل: ${customer.name} (نقاط الولاء: ${customer.loyaltyPoints})`);
        setError('');
      } else {
        setSelectedCustomer(null);
        await searchCustomers(customerPhone);
        if (customerSearchResults.length === 0) {
          setError('لم يتم العثور على عميل بهذا الرقم');
        }
        setSuccess('');
      }
    } catch (err) {
      console.error('searchCustomerByPhone error', err);
      setError('خطأ في البحث عن العميل');
      setSuccess('');
    }
  }

  // تنفيذ البيع الفعلي المحسن مع تحديث المخزون الفوري
  async function handleCheckout() {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');
    setSuccess('');

    if (!shift) {
      setError('يجب فتح وردية أولاً');
      setIsProcessing(false);
      return;
    }
    if (cart.length === 0) {
      setError('السلة فارغة');
      setIsProcessing(false);
      return;
    }
    if (!user) {
      setError('حدث خطأ في بيانات المستخدم');
      setIsProcessing(false);
      return;
    }

    // تحقق من الكميات في المخزون قبل البيع
    for (const item of cart) {
      const stock = stockMap[item.id] ?? await getProductStock(item.id);
      if (item.qty > stock) {
        setError(`الكمية المطلوبة للمنتج "${item.name}" غير متوفرة في المخزون (المتوفر: ${stock})`);
        setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.min(stock, i.qty) } : i));
        setIsProcessing(false);
        return;
      }
    }

    try {
      // تسجيل عميل جديد إذا لم يكن موجوداً وتم إدخال بيانات العميل
      let currentCustomer = selectedCustomer;
      if (!selectedCustomer && customerName.trim() && customerPhone.trim()) {
        try {
          const { addCustomer } = await import('../lib/customers');
          currentCustomer = await addCustomer({
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: '',
            address: '',
            discount: '0',
            notes: `عميل مسجل من نقاط البيع - ${new Date().toLocaleDateString('ar-EG')}`
          });
          setSelectedCustomer(currentCustomer);
        } catch (customerError) {
          console.warn('خطأ في تسجيل العميل الجديد:', customerError);
        }
      }

      // خصم الكميات من المخزون وتحديث الواجهة فوراً
      for (const item of cart) {
        await addStockMovement({
          productId: item.id,
          type: 'out',
          quantity: item.qty,
          date: new Date().toISOString(),
          note: `بيع من نقاط البيع (${customerName || 'عميل نقدي'})`,
        });
        
        // تحديث المخزون في الواجهة فوراً
        await updateStockInRealtime(item.id, item.qty);
      }

      // تسجيل البيع في Firestore
      const saleResult = await addSalePOS({
        shiftId: shift.id,
        userId: user.id,
        customerName: customerName || 'عميل نقدي',
        customerPhone,
        customerId: currentCustomer?.id,
        products: cart.map(item => ({ productId: item.id, name: item.name, quantity: item.qty, price: item.salePrice })),
        total,
        tax,
        discount: customerDiscount,
        paymentType,
        date: new Date().toISOString(),
      });

      const saleId = saleResult.id;
      const invoiceNumber = saleResult.invoiceNumber;

      // تسجيل الدفعة
      await addPayment({
        saleId,
        amount: total,
        tax,
        type: paymentType,
        userId: user.id,
        date: new Date().toISOString(),
      });

      // تسجيل معاملة مالية
      await addTransaction({
        type: 'income',
        amount: String(total),
        currency: 'EGP',
        category: 'مبيعات',
        description: `بيع من نقاط البيع: ${customerName || 'عميل نقدي'} - فاتورة #${invoiceNumber}`,
        date: new Date().toISOString(),
      }, 'system');

      // إضافة عملية الشراء لسجل العميل إذا كان مسجلاً
      if (currentCustomer) {
        const loyaltyPoints = calculateLoyaltyPoints(total);
        await addCustomerPurchase({
          customerId: currentCustomer.id,
          saleId,
          amount: total,
          date: new Date(),
          products: cart.map(item => ({
            productId: item.id,
            name: item.name,
            quantity: item.qty,
            price: item.salePrice,
          })),
          pointsEarned: loyaltyPoints,
          discountApplied: customerDiscount,
        });
      }

      // سجل الأحداث
      await addAuditLog({ action: 'sale', userId: user.id, details: cart, saleId, invoiceNumber });

      // توليد إيصال الكاشير PDF
      await generateReceiptPDF({
        customerName: customerName || 'عميل نقدي',
        customerPhone: customerPhone || '-',
        products: cart.map(item => ({ productId: item.id, name: item.name, quantity: item.qty, price: item.salePrice })),
        date: new Date().toISOString(),
        currency: 'EGP',
        total,
        discount: customerDiscount,
        loyaltyPoints: currentCustomer ? calculateLoyaltyPoints(total) : 0,
        invoiceNumber, // إضافة رقم الفاتورة
      });

      setSuccess(`تمت عملية البيع بنجاح! رقم الفاتورة: ${invoiceNumber}`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomer(null);
      setCustomerSearchResults([]);
      setError('');
      
      // إعادة التركيز على حقل الباركود
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      
    } catch (err) {
      console.error('خطأ في إتمام البيع:', err);
      setError(`حدث خطأ أثناء البيع: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      setSuccess('');
    } finally {
      setIsProcessing(false);
    }
  }

  // دالة لإغلاق الوردية مع حماية من النداء بدون shift
  async function onCloseShift() {
    if (!shift) {
      setError('لا توجد وردية مفتوحة للإغلاق');
      return;
    }
    if (!shift.id) {
      setError('معرّف الوردية غير متوفر');
      return;
    }
    if (!window.confirm('هل أنت متأكد من إغلاق الوردية؟')) return;

    try {
      const salesSummary = await getShiftSummary(shift.id);
      const summary = {
        رقم_الوردية: shift.id,
        المستخدم: user?.displayName || user?.email || user?.id,
        وقت_الفتح: shift.openedAt ? (shift.openedAt.seconds ? new Date(shift.openedAt.seconds * 1000).toLocaleString('ar-EG') : new Date(shift.openedAt).toLocaleString('ar-EG')) : '-',
        عدد_الفواتير: salesSummary?.totalCount ?? 0,
        اجمالي_المبيعات: salesSummary?.totalSales ?? 0,
        اجمالي_الضريبة: salesSummary?.totalTax ?? 0,
        اجمالي_النقد: salesSummary?.totalCash ?? 0,
        اجمالي_البطاقات: salesSummary?.totalCard ?? 0
      };
      handleCloseShift(shift.id, () => {
        setShift(null);
        setClosedShiftSummary(summary);
        setSuccess('تم إغلاق الوردية بنجاح');
        setError('');
      }, (msg: string) => {
        setError(msg);
        setSuccess('');
      });
    } catch (err) {
      console.error('onCloseShift error', err);
      setError('فشل في جلب ملخص الوردية');
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header with shift status */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">🏪 نقاط البيع (POS)</h2>
            <p className="text-slate-600">إدارة المبيعات والمعاملات النقدية</p>
          </div>

          <div className="flex items-center gap-4">
            {!shift ? (
              <button
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                onClick={handleOpenShift}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="text-xl">➕</span>
                  <span>فتح وردية جديدة</span>
                </span>
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="text-green-800">
                      <div className="font-bold text-lg">الوردية مفتوحة</div>
                      <div className="text-sm text-green-600">
                        مدة التشغيل: <span className="font-mono font-bold">{getShiftDuration()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-l border-green-300 pl-4">
                    <div className="text-green-700 text-sm">الوقت الحالي</div>
                    <div className="text-green-800 font-bold">
                      {currentTime.toLocaleTimeString('ar-EG', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                      })}
                    </div>
                  </div>

                  {shiftStartTime && (
                    <div className="border-l border-green-300 pl-4">
                      <div className="text-green-700 text-sm">بداية الوردية</div>
                      <div className="text-green-800 font-bold">
                        {shiftStartTime.toLocaleTimeString('ar-EG', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-4 py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                    onClick={() => setShowReturns(!showReturns)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-lg">↩️</span>
                      <span>المرتجعات</span>
                    </span>
                  </button>
                  
                  <button
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                    onClick={onCloseShift}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-lg">🔒</span>
                      <span>إغلاق الوردية</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className={`transition-all duration-300 p-4 rounded-2xl shadow-lg border ${
          error 
            ? 'bg-red-50 border-red-200 text-red-700' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{error ? '❌' : '✅'}</span>
            <span className="font-bold text-lg">{error || success}</span>
          </div>
        </div>
      )}

      {/* Advanced Partial Returns System */}
      {showReturns && (
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent flex items-center gap-4">
              <span className="text-4xl">🔄</span>
              نظام المرتجعات الجزئية المتقدم
            </h3>
            <button
              onClick={() => {
                setShowReturns(false);
                setReturnInvoiceId('');
                setReturnSearchResults([]);
                setReturnSale(null);
                setReturnReason('');
                setSelectedProductsForReturn({});
                setPartialReturnMode(false);
                setError('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Enhanced Steps Indicator */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-center space-x-4 space-x-reverse">
              {[
                { step: 'search', label: 'البحث عن الفاتورة', icon: '🔍', active: !returnSale },
                { step: 'select', label: 'اختيار المنتجات', icon: '🛒', active: returnSale && !isProcessingReturn },
                { step: 'confirm', label: 'تأكيد المرتجع', icon: '✅', active: isProcessingReturn }
              ].map(({ step, label, icon, active }, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold transition-all duration-300 ${
                    active 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl transform scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {icon}
                  </div>
                  <span className={`ml-3 font-semibold text-lg ${
                    active ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                  {index < 2 && (
                    <div className={`w-12 h-2 mx-6 rounded-full transition-all duration-300 ${
                      index === 0 && returnSale ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {!returnSale ? (
            /* Search Phase with Enhanced Design */
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="text-3xl">🔍</span>
                  البحث الذكي عن الفاتورة
                </h4>
                
                <div className="flex gap-4 mb-8">
                  <div className="flex-1 relative">
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="ابحث برقم الفاتورة، اسم العميل، اسم المنتج، أو رقم الهاتف..."
                      value={returnInvoiceId}
                      onChange={e => {
                        setReturnInvoiceId(e.target.value);
                        if (e.target.value.trim().length >= 3) {
                          searchSaleForReturn(e.target.value);
                        } else {
                          setReturnSearchResults([]);
                        }
                      }}
                      className="w-full pr-12 pl-6 py-4 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 text-gray-900 placeholder-purple-400 text-lg transition-all duration-300"
                    />
                  </div>
                  <button
                    onClick={() => searchSaleForReturn(returnInvoiceId)}
                    disabled={returnInvoiceId.trim().length < 3}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-3"
                  >
                    <span className="text-xl">🔍</span>
                    بحث متقدم
                  </button>
                  <button
                    onClick={() => {
                      setReturnInvoiceId('');
                      setReturnSearchResults([]);
                      setError('');
                    }}
                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="text-xl">🗑️</span>
                  </button>
                </div>

                {/* Enhanced Search Results */}
                {returnSearchResults.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      عُثر على {returnSearchResults.length} فاتورة
                    </h5>
                    <div className="grid gap-4 max-h-96 overflow-y-auto">
                      {returnSearchResults.map((sale: any) => (
                        <div
                          key={sale.id}
                          onClick={() => setReturnSale(sale)}
                          className="p-6 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-6">
                                <span className="text-xl font-bold text-purple-700 bg-purple-100 px-4 py-2 rounded-lg">
                                  #{sale.invoiceNumber || sale.id}
                                </span>
                                <span className="text-sm text-gray-600 flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                  <span>📅</span>
                                  {sale.date ? new Date(sale.date.seconds ? sale.date.seconds * 1000 : sale.date).toLocaleDateString('ar-EG') : 'غير محدد'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm text-gray-700">
                                <span className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                                  <span>👤</span>
                                  {sale.customerName || 'عميل نقدي'}
                                </span>
                                <span className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                                  <span>📦</span>
                                  {sale.products?.length || 0} منتج
                                </span>
                                <span className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
                                  {sale.paymentType === 'cash' ? '💰' : '💳'}
                                  {sale.paymentType === 'cash' ? 'نقدي' : 'بطاقة'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600 mb-1">{sale.total} جنيه</div>
                              <div className="text-sm text-gray-500">
                                {sale.date ? new Date(sale.date.seconds ? sale.date.seconds * 1000 : sale.date).toLocaleTimeString('ar-EG') : ''}
                              </div>
                              <div className="mt-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 group-hover:bg-purple-200">
                                  انقر للاختيار
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {returnInvoiceId.trim().length >= 3 && returnSearchResults.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-8xl mb-6 animate-bounce">🔍</div>
                    <p className="text-2xl font-semibold mb-2">لم يتم العثور على فواتير</p>
                    <p className="text-lg">تأكد من صحة البيانات المدخلة</p>
                  </div>
                )}
              </div>

              {/* Enhanced Instructions */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8">
                <h5 className="font-bold text-amber-800 mb-4 text-xl flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  دليل البحث الذكي
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-amber-700">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔢</span>
                      <span>البحث برقم الفاتورة (3 أحرف على الأقل)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      <span>البحث باسم العميل</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📦</span>
                      <span>البحث باسم المنتج</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      <span>البحث برقم الهاتف</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Enhanced Partial Return Processing Phase */
            <div className="space-y-8">
              {/* Invoice Details with Modern Design */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="text-3xl">📄</span>
                    فاتورة #{returnSale.invoiceNumber || returnSale.id}
                  </h4>
                  <button
                    onClick={() => {
                      setReturnSale(null);
                      setReturnReason('');
                      setSelectedProductsForReturn({});
                      setPartialReturnMode(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-2xl">❌</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <div className="text-sm text-blue-600 font-medium">العميل</div>
                        <div className="font-bold text-blue-800">{returnSale.customerName || 'عميل نقدي'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📅</span>
                      <div>
                        <div className="text-sm text-green-600 font-medium">التاريخ</div>
                        <div className="font-bold text-green-800">
                          {returnSale.date ? new Date(returnSale.date.seconds ? returnSale.date.seconds * 1000 : returnSale.date).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <div className="text-sm text-purple-600 font-medium">إجمالي الفاتورة</div>
                        <div className="font-bold text-purple-800">{returnSale.total} جنيه</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Product Selection */}
                {returnSale.products && returnSale.products.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h5 className="font-bold text-gray-700 text-xl flex items-center gap-3">
                        <span className="text-2xl">🛒</span>
                        اختيار المنتجات للإرجاع ({returnSale.products.length} منتج)
                      </h5>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const allSelected: {[key: string]: number} = {};
                            returnSale.products.forEach((product: any, index: number) => {
                              allSelected[index.toString()] = product.quantity;
                            });
                            setSelectedProductsForReturn(allSelected);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          تحديد الكل
                        </button>
                        <button
                          onClick={() => setSelectedProductsForReturn({})}
                          className="px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          إلغاء التحديد
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 max-h-64 overflow-y-auto">
                      {returnSale.products.map((product: any, index: number) => {
                        const selectedQty = selectedProductsForReturn[index.toString()] || 0;
                        const isSelected = selectedQty > 0;
                        
                        return (
                          <div 
                            key={index} 
                            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                              isSelected 
                                ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg' 
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-300 ${
                                  isSelected 
                                    ? 'bg-purple-600 border-purple-600' 
                                    : 'border-gray-300 hover:border-purple-400'
                                }`}
                                onClick={() => {
                                  if (isSelected) {
                                    const newSelected = { ...selectedProductsForReturn };
                                    delete newSelected[index.toString()];
                                    setSelectedProductsForReturn(newSelected);
                                  } else {
                                    setSelectedProductsForReturn(prev => ({
                                      ...prev,
                                      [index.toString()]: product.quantity
                                    }));
                                  }
                                }}>
                                  {isSelected && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="font-bold text-gray-800 text-lg">{product.name}</div>
                                  <div className="text-sm text-gray-600">
                                    السعر: {product.price} جنيه/قطعة • الكمية الأصلية: {product.quantity}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                {isSelected && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-purple-700">الكمية المرتجعة:</span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          const newQty = Math.max(1, selectedQty - 1);
                                          setSelectedProductsForReturn(prev => ({
                                            ...prev,
                                            [index.toString()]: newQty
                                          }));
                                        }}
                                        className="w-8 h-8 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold transition-all duration-200"
                                      >
                                        −
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        max={product.quantity}
                                        value={selectedQty}
                                        onChange={(e) => {
                                          const qty = Math.min(product.quantity, Math.max(1, parseInt(e.target.value) || 1));
                                          setSelectedProductsForReturn(prev => ({
                                            ...prev,
                                            [index.toString()]: qty
                                          }));
                                        }}
                                        className="w-16 h-8 text-center border border-purple-300 rounded-lg text-purple-800 font-bold focus:ring-2 focus:ring-purple-500"
                                      />
                                      <button
                                        onClick={() => {
                                          const newQty = Math.min(product.quantity, selectedQty + 1);
                                          setSelectedProductsForReturn(prev => ({
                                            ...prev,
                                            [index.toString()]: newQty
                                          }));
                                        }}
                                        className="w-8 h-8 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold transition-all duration-200"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="text-right">
                                  <div className="font-bold text-green-600 text-lg">
                                    {isSelected ? (selectedQty * product.price) : (product.price * product.quantity)} جنيه
                                  </div>
                                  {isSelected && (
                                    <div className="text-sm text-purple-600 font-medium">
                                      مرتجع: {selectedQty} من {product.quantity}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Return Summary */}
                {Object.keys(selectedProductsForReturn).length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
                    <h6 className="font-bold text-purple-800 text-lg mb-4 flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      ملخص المرتجع
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-xl">
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.keys(selectedProductsForReturn).length}
                        </div>
                        <div className="text-sm text-gray-600">منتج مختار</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">
                          {Object.values(selectedProductsForReturn).reduce((sum, qty) => sum + qty, 0)}
                        </div>
                        <div className="text-sm text-gray-600">إجمالي القطع</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl">
                        <div className="text-2xl font-bold text-green-600">
                          {Object.entries(selectedProductsForReturn).reduce((sum, [index, qty]) => {
                            const product = returnSale.products[parseInt(index)];
                            return sum + (product.price * qty);
                          }, 0)} جنيه
                        </div>
                        <div className="text-sm text-gray-600">مبلغ المرتجع</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Return Reason */}
                <div className="mb-8">
                  <label className="block font-bold text-gray-700 text-lg mb-4">
                    <span className="text-xl">📝</span>
                    سبب المرتجع (اختياري)
                  </label>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-3 font-medium">أسباب شائعة:</div>
                    <div className="flex flex-wrap gap-2">
                      {['منتج معيب', 'خطأ في الطلب', 'إلغاء من العميل', 'استبدال', 'انتهاء صلاحية', 'عدم رضا العميل', 'تغيير في الطلب'].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          className={`px-4 py-2 text-sm rounded-full border-2 transition-all duration-300 hover:scale-105 font-medium ${
                            returnReason === reason
                              ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-400 text-purple-800 shadow-lg'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                          onClick={() => setReturnReason(reason)}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <textarea
                    className="w-full border-2 border-purple-200 rounded-xl px-6 py-4 text-gray-900 focus:ring-4 focus:ring-purple-300 focus:border-purple-500 resize-none placeholder-purple-400 text-lg transition-all duration-300"
                    placeholder="اكتب سبب مخصص أو اختر من الأسباب السريعة أعلاه..."
                    rows={4}
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                  />
                  <div className="text-sm text-purple-600 mt-2 font-medium">
                    💡 سيتم حفظ السبب في سجل المرتجعات لأغراض التتبع والمراجعة
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      const selectedProducts = Object.entries(selectedProductsForReturn).map(([index, qty]) => ({
                        ...returnSale.products[parseInt(index)],
                        returnQuantity: qty,
                        originalIndex: parseInt(index)
                      }));
                      handleProcessPartialReturn(returnSale, selectedProducts, returnReason);
                    }}
                    disabled={isProcessingReturn || Object.keys(selectedProductsForReturn).length === 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-700 hover:from-purple-700 hover:via-purple-800 hover:to-blue-800 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl flex items-center justify-center gap-3"
                  >
                    {isProcessingReturn ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>جاري معالجة المرتجع...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🔄</span>
                        <span>
                          تأكيد المرتجع الجزئي 
                          {Object.keys(selectedProductsForReturn).length > 0 && (
                            <span className="font-normal text-purple-200">
                              ({Object.entries(selectedProductsForReturn).reduce((sum, [index, qty]) => {
                                const product = returnSale.products[parseInt(index)];
                                return sum + (product.price * qty);
                              }, 0)} جنيه)
                            </span>
                          )}
                        </span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setReturnSale(null);
                      setReturnReason('');
                      setSelectedProductsForReturn({});
                      setPartialReturnMode(false);
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">❌</span>
                    <span>إلغاء العملية</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Warning */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-start gap-4 text-red-700">
                  <span className="text-3xl">⚠️</span>
                  <div className="flex-1">
                    <div className="font-bold text-xl mb-2">تحذير مهم</div>
                    <div className="text-lg space-y-1">
                      <div>• سيتم إرجاع المنتجات المختارة للمخزون تلقائياً</div>
                      <div>• سيتم خصم مبلغ المرتجع من إجمالي مبيعات الوردية</div>
                      <div>• يمكنك اختيار منتجات محددة وكميات مختلفة</div>
                      <div>• هذا الإجراء نهائي ولا يمكن التراجع عنه</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Product Search */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          البحث المتطور عن المنتجات
        </h3>
        <div className="flex gap-3 mb-4">
          <input
            ref={barcodeInputRef}
            type="text"
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-xl px-4 py-3 flex-1 text-slate-800 placeholder-slate-500 font-medium bg-white transition-all duration-200"
            placeholder="أدخل الباركود أو اسم المنتج واضغط Enter أو ابحث مباشرة..."
            value={barcode}
            onChange={e => { 
              setBarcode(e.target.value); 
              if (e.target.value.trim()) {
                const results = enhancedProductSearch(e.target.value);
                setSearchResults(results || []);
              } else {
                setSearchResults(null);
              }
              setError(''); 
            }}
            onKeyDown={handleBarcodeEnter}
            disabled={!shift}
            autoFocus
          />
          <button
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg font-medium"
            onClick={() => barcodeInputRef.current?.focus()}
            title="تركيز على حقل البحث"
          >
            <span className="inline-flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="hidden sm:inline">بحث</span>
            </span>
          </button>
          <button
            className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            onClick={() => {
              setBarcode('');
              setSearchResults(null);
              setError('');
            }}
            title="مسح البحث"
          >
            🗑️
          </button>
        </div>
        
        {/* Real-time search results */}
        {searchResults && searchResults.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            <div className="text-sm text-slate-600 mb-2">
              عُثر على {searchResults.length} منتج
            </div>
            <div className="grid gap-2">
              {searchResults.map(prod => (
                <div key={prod.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer group"
                     onClick={() => {
                       addToCart(prod);
                       setBarcode('');
                       setSearchResults(null);
                       setError('');
                     }}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 text-lg group-hover:text-cyan-700">{prod.name}</div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>الباركود: {prod.barcode || 'غير محدد'}</span>
                        <span>السعر: {prod.salePrice} جنيه</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          (stockMap[prod.id] ?? 0) > 10 
                            ? 'bg-green-100 text-green-700' 
                            : (stockMap[prod.id] ?? 0) > 0 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-red-100 text-red-700'
                        }`}>
                          المخزون: {stockMap[prod.id] ?? '...'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-cyan-500 group-hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200">
                      إضافة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {barcode.trim() && (!searchResults || searchResults.length === 0) && (
          <div className="text-center py-4 text-slate-500">
            <div className="text-3xl mb-2">🤷‍♂️</div>
            <div>لم يتم العثور على منتجات تطابق البحث "{barcode}"</div>
          </div>
        )}
      </div>

      {/* Enhanced Customer Data and Payment Methods */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">👤</span>
          بيانات العميل وطرق الدفع المحسنة
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block font-semibold text-slate-700 text-sm">اسم العميل (اختياري)</label>
            <input
              type="text"
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 font-medium bg-white transition-all duration-200"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="مثال: أحمد محمد"
            />
          </div>

          <div className="space-y-3">
            <label className="block font-semibold text-slate-700 text-sm">رقم الهاتف (للبحث المتطور عن العميل)</label>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  ref={customerSearchRef}
                  type="text"
                  className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 flex-1 text-slate-800 placeholder-slate-500 font-medium bg-white transition-all duration-200"
                  value={customerPhone}
                  onChange={e => {
                    setCustomerPhone(e.target.value);
                    if (e.target.value.trim().length >= 3) {
                      searchCustomers(e.target.value);
                    } else {
                      setCustomerSearchResults([]);
                    }
                  }}
                  onBlur={() => {
                    // تأخير إخفاء النتائج للسماح بالنقر عليها
                    setTimeout(() => setCustomerSearchResults([]), 200);
                  }}
                  placeholder="01xxxxxxxxx"
                  inputMode="tel"
                />
                <button
                  type="button"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105 shadow-lg"
                  onClick={searchCustomerByPhone}
                  title="بحث عن العميل"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="text-lg">🔎</span>
                    <span className="hidden sm:inline">بحث</span>
                  </span>
                </button>
              </div>
              
              {/* Customer Search Results */}
              {customerSearchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customerSearchResults.map(customer => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-cyan-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerName(customer.name);
                        setCustomerPhone(customer.phone);
                        setCustomerSearchResults([]);
                        setSuccess(`تم اختيار العميل: ${customer.name}`);
                      }}
                    >
                      <div className="font-medium text-slate-800">{customer.name}</div>
                      <div className="text-sm text-slate-600 flex gap-4">
                        <span>{customer.phone}</span>
                        <span className="text-cyan-600">نقاط: {customer.loyaltyPoints}</span>
                        <span className="text-green-600">خصم: {customer.discount}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedCustomer && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-green-800">العميل: {selectedCustomer.name}</div>
                    <button
                      className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerName('');
                        setCustomerPhone('');
                      }}
                      title="إزالة العميل"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-green-700">
                      <div className="font-medium">نقاط الولاء</div>
                      <div className="text-green-800 font-bold">{selectedCustomer.loyaltyPoints}</div>
                    </div>
                    <div className="text-green-700">
                      <div className="font-medium">نسبة الخصم</div>
                      <div className="text-green-800 font-bold">{selectedCustomer.discount}%</div>
                    </div>
                    <div className="text-green-700">
                      <div className="font-medium">إجمالي المشتريات</div>
                      <div className="text-green-800 font-bold">{selectedCustomer.totalPurchases || 0} جنيه</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block font-semibold text-slate-700 text-sm">طريقة الدفع</label>
            <select 
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 font-medium bg-white transition-all duration-200" 
              value={paymentType} 
              onChange={e => setPaymentType(e.target.value as 'cash' | 'card')}
            >
              <option value="cash">💰 نقدي</option>
              <option value="card">💳 بطاقة/إلكتروني</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block font-semibold text-slate-700 text-sm">نسبة الضريبة (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 font-medium bg-white transition-all duration-200"
              value={taxRate}
              onChange={e => setTaxRate(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          السلة
          {cart.length > 0 && (
            <span className="bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
              {cart.length} منتج
            </span>
          )}
        </h3>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-bounce">🛒</div>
            <div className="text-slate-600 text-xl font-medium">لا توجد منتجات في السلة</div>
            <div className="text-slate-500 text-sm mt-2">ابحث عن المنتجات وأضفها للسلة</div>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {cart.map((item, index) => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:bg-slate-100 transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="font-bold text-slate-800 text-lg">{item.name}</div>
                    </div>
                    <div className="md:col-span-1">
                      <div className="text-sm text-slate-600 font-medium mb-1">الكمية</div>
                      <input
                        type="number"
                        min={1}
                        className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg w-full px-3 py-2 text-center text-slate-800 font-medium bg-white transition-all duration-200"
                        value={item.qty}
                        onChange={e => updateCartQty(item.id, Number(e.target.value))}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <div className="text-sm text-slate-600 font-medium mb-1">المخزون</div>
                      <span className={`px-3 py-2 rounded-full text-sm font-bold ${
                        stockMap[item.id] !== undefined
                          ? (stockMap[item.id] > 10 ? 'bg-green-100 text-green-700' : stockMap[item.id] > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {stockMap[item.id] !== undefined ? stockMap[item.id] : '...'}
                      </span>
                    </div>
                    <div className="md:col-span-1">
                      <div className="text-sm text-slate-600 font-medium mb-1">السعر</div>
                      <div className="font-bold text-slate-800">{item.salePrice} جنيه</div>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-600 font-medium mb-1">الإجمالي</div>
                        <div className="font-bold text-cyan-600 text-lg">{item.qty * item.salePrice} جنيه</div>
                      </div>
                      {user?.role === 'admin' && (
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-110 ml-2"
                          onClick={() => removeFromCart(item.id)}
                          title="حذف المنتج من السلة"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">المجموع الفرعي:</span>
                    <span className="font-bold text-slate-800">{subtotal} جنيه</span>
                  </div>
                  {customerDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium">خصم العميل ({selectedCustomer?.discount}%):</span>
                      <span className="font-bold">-{customerDiscount} جنيه</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">الضريبة ({taxRate}%):</span>
                    <span className="font-bold text-orange-600">{tax} جنيه</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 p-6 rounded-2xl">
                    <div className="text-center">
                      <div className="text-sm text-cyan-700 font-medium mb-2">الإجمالي شامل الضريبة</div>
                      <div className="text-3xl font-bold text-cyan-600">{total} جنيه</div>
                    </div>
                  </div>
                  {selectedCustomer && (
                    <div className="text-center mt-4 text-green-600 text-sm font-medium">
                      نقاط الولاء المكتسبة: <span className="font-bold text-green-700">{calculateLoyaltyPoints(total)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Checkout Button */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right">
            <div className="text-sm text-slate-600 font-medium">إجمالي الفاتورة</div>
            <div className="text-4xl font-bold text-green-600">{total} جنيه</div>
            {cart.length > 0 && (
              <div className="text-sm text-slate-500 mt-1">
                {cart.length} منتج • دفع {paymentType === 'cash' ? 'نقدي' : 'بطاقة'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={() => {
                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
                setSelectedCustomer(null);
                setCustomerSearchResults([]);
                setError('');
                setSuccess('تم مسح السلة');
              }}
              disabled={cart.length === 0 || isProcessing}
            >
              <span className="inline-flex items-center gap-3">
                <span className="text-2xl">🗑️</span>
                <span>مسح السلة</span>
              </span>
            </button>
            
            <button
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={handleCheckout}
              disabled={cart.length === 0 || !shift || isProcessing}
            >
              <span className="inline-flex items-center gap-3">
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">💵</span>
                    <span>إتمام البيع</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* نافذة ملخص الوردية بعد الإغلاق */}
      {closedShiftSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  ملخص الوردية المغلقة
                </h3>
                <button
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  onClick={() => setClosedShiftSummary(null)}
                  title="إغلاق"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {Object.entries(closedShiftSummary).map(([k, v]) => (
                  <div key={k} className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:bg-slate-100 transition-all duration-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">{k.replace(/_/g, ' ')}:</span>
                      <span className="font-bold text-cyan-600">{v as any}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                onClick={() => setClosedShiftSummary(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import jsPDF from 'jspdf';
import { SaleProduct } from '../types/sale';
import { formatCurrency } from './utils';
import { generateQRCode } from './qr';

// تحميل خط Amiri العربي
async function registerAmiriFont(doc: jsPDF) {
    try {
        const response = await fetch('/fonts/Amiri.ttf');
        if (!response.ok) throw new Error('Font file not found');
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
        const base64 = btoa(binaryString);
        doc.addFileToVFS('Amiri.ttf', base64);
        doc.addFont('Amiri.ttf', 'Amiri', 'normal');
        doc.addFont('Amiri.ttf', 'Amiri', 'bold');
        return true;
    } catch {
        return false;
    }
}

export async function generateReceiptPDF({
    customerName,
    customerPhone,
    products,
    date,
    companyName = 'قلج',
    currency = 'EGP',
    total,
    discount = 0,
    loyaltyPoints = 0,
    invoiceNumber
}: {
    customerName: string;
    customerPhone: string;
    products: SaleProduct[];
    date: string;
    companyName?: string;
    currency?: string;
    total: number;
    discount?: number;
    loyaltyPoints?: number;
    invoiceNumber?: string;
}) {
    // 80mm x dynamic height (1mm = 2.83465pt)
    const width = 80 * 2.83465;
    const baseHeight = 80 * 2.83465;
    const lineHeight = 18;
    const extraHeight = products.length * lineHeight;
    const height = baseHeight + extraHeight + 120;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [width, height] });
    await registerAmiriFont(doc);
    doc.setFont('Amiri', 'bold');
    let y = 28;
    doc.setFontSize(15);
    doc.text(companyName, width / 2, y, { align: 'center' });
    y += 18;
    doc.setFontSize(11);
    doc.setFont('Amiri', 'normal');
    doc.text('إيصال بيع نقدي', width / 2, y, { align: 'center' });
    y += 18;
    
    // رقم الفاتورة
    if (invoiceNumber) {
        doc.setFontSize(8);
        doc.text(`رقم الفاتورة: ${invoiceNumber}`, width / 2, y, { align: 'center' });
        y += 14;
    }
    
    doc.setFontSize(6);
    // التاريخ والوقت بالإنجليزية
    doc.text(`${new Date(date).toLocaleString('en-GB')}`, 8, y);
    y += 14;
    doc.setFontSize(8);

    doc.text(`العميل: ${customerName}`, width - 8, y, { align: 'right' });
    y += 14;
    doc.text(`الهاتف: ${customerPhone}`, width - 8, y, { align: 'right' });
    y += 18;
    // جدول المنتجات
    doc.setFont('Amiri', 'bold');
    doc.setFontSize(10);
    y += 10;
    doc.setFont('Amiri', 'normal');
    // رأس الجدول
    doc.setFillColor(240, 240, 240);
    doc.rect(8, y, width - 16, lineHeight, 'F');
    doc.setFontSize(9);
    doc.text('م', 16, y + 13, { align: 'left' });
    doc.text('المنتج', width / 2 - 10, y + 13, { align: 'center' });
    doc.text('الكمية', width - 80, y + 13, { align: 'left' });
    doc.text('السعر', width - 30, y + 13, { align: 'left' });
    y += lineHeight;
    // بيانات المنتجات
    products.forEach((p, idx) => {
        doc.text(String(idx + 1), 16, y + 13, { align: 'left' });
        doc.text(p.name, width / 2 - 10, y + 13, { align: 'center' });
        doc.text(String(p.quantity), width - 80, y + 13, { align: 'left' });
        doc.text(formatCurrency(p.price, currency as any), width - 30, y + 13, { align: 'left' });
        y += lineHeight;
    });
    y += 16;
    doc.setFont('Amiri', 'bold');
    doc.setFontSize(10);
    
    // عرض الخصم إذا كان موجوداً
    if (discount > 0) {
        doc.text(`الخصم: ${formatCurrency(discount, currency as any)}`, width - 8, y, { align: 'right' });
        y += 16;
    }
    
    doc.text(`الإجمالي: ${formatCurrency(total, currency as any)}`, width - 8, y, { align: 'right' });
    y += 16;
    
    // عرض نقاط الولاء إذا كانت موجودة
    // if (loyaltyPoints > 0) {
    //     doc.setFont('Amiri', 'normal');
    //     doc.setFontSize(9);
    //     doc.text(`نقاط الولاء المكتسبة: ${loyaltyPoints}`, width - 8, y, { align: 'right' });
    //     y += 16;
    // }
    
    doc.setFont('Amiri', 'normal');
    doc.setFontSize(8);
    doc.text('شكرًا لتعاملكم معنا!', width / 2, y, { align: 'center' });
    y += 20;
    doc.setFontSize(8);
    doc.text('للشكاوى: info@qalaj.com', width / 2, y, { align: 'center' });
    y += 20;
    // QR code
    try {
        const qrDataUrl = await generateQRCode('https://qalaj.com');
        doc.addImage(qrDataUrl, 'PNG', width / 2 - 10, y, 32, 32);
        y += 65;
    } catch { }
    doc.save(`receipt-${Date.now()}.pdf`);
}

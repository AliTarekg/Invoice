import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleProduct } from '../types/sale';
import { formatCurrency } from './utils';

const loadAmiriFont = async (): Promise<string> => {
  try {
    const response = await fetch('/fonts/Amiri.ttf');
    if (!response.ok) throw new Error('Font file not found');
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    return btoa(binaryString);
  } catch {
    return '';
  }
};

const setArabicFont = (doc: jsPDF, style: 'normal' | 'bold' = 'normal'): void => {
  try {
    doc.setFont('Amiri', style);
  } catch {
    try { doc.setFont('Amiri', 'normal'); } catch { doc.setFont('helvetica', style); }
  }
};

const registerAmiriFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    const amiriFontBase64 = await loadAmiriFont();
    if (amiriFontBase64) {
      doc.addFileToVFS('Amiri.ttf', amiriFontBase64);
      doc.addFont('Amiri.ttf', 'Amiri', 'normal');
      doc.addFont('Amiri.ttf', 'Amiri', 'bold');
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const addPNGLogo = async (doc: jsPDF, x: number, y: number, width: number = 40, height: number = 40): Promise<void> => {
  try {
    const logoResponse = await fetch('/logo.png');
    if (!logoResponse.ok) throw new Error('PNG logo not found');
    const arrayBuffer = await logoResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    const base64String = btoa(binaryString);
    doc.addImage('data:image/png;base64,' + base64String, 'PNG', x, y, width, height, undefined, 'FAST');
  } catch {}
};

export async function generateMultiSaleInvoice({
  customerName,
  customerPhone,
  products,
  date,
  currency = 'EGP',
  invoiceNumber,
}: {
  customerName: string;
  customerPhone: string;
  products: SaleProduct[];
  date: string;
  currency?: string;
  invoiceNumber?: string;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });

  await registerAmiriFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const logoWidth = 40;
  const logoHeight = 40;

  // Header background
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 60, 'F');
  // Place logo at top right (RTL)
  await addPNGLogo(doc, pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);

  // Place date at top left
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'normal');
  // Show date in English (e.g. 8/2/2025)
  doc.text(new Date(date).toLocaleDateString('en-GB'), margin, margin + 10, { align: 'left' });

  // Company name and subtitle (centered)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  setArabicFont(doc, 'bold');
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text('للتوريدات العامه', pageWidth / 2, 45, { align: 'center' });

  // Main title
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'bold');
  doc.text('فاتورة بيع', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  setArabicFont(doc, 'normal');

  // Invoice number (top right, under logo)
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'normal');
  // استخدام رقم الفاتورة المرسل أو إنشاء واحد جديد
  const finalInvoiceNumber = invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  doc.text(`رقم الفاتورة ${finalInvoiceNumber}`, pageWidth - margin, margin + logoHeight + 10, { align: 'right' });

  // Client info section
  let yPos = 75;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(11);
  setArabicFont(doc, 'bold');
  doc.text('تفاصيل العميل', pageWidth / 2, yPos + 13, { align: 'center' });
  yPos += 25;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 40);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('اسم العميل:', pageWidth - margin - 8, yPos + 15, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text(customerName || 'بدون اسم', pageWidth - margin - 8, yPos + 28, { align: 'right' });
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('رقم الهاتف', margin + 8, yPos + 15);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text(customerPhone, margin + 8, yPos + 28);
  // تم نقل التاريخ للأعلى ولن يتم رسمه هنا

  // --- Sale Notes & QR Code (bottom) ---
  const notesY = pageHeight - 60;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  setArabicFont(doc, 'bold');
  doc.text('تطبق الشروط والاحكام', margin, notesY, { align: 'left' });
  doc.text('للشكاوي والاستفسارات info@qalaj.com', margin, notesY + 16, { align: 'left' });

  // Generate QR code for qalaj.com
  try {
    // Use local QR code generator
    const { generateQRCode } = await import('./qr');
    const qrDataUrl = await generateQRCode('https://qalaj.com');
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 60, pageHeight - 70, 50, 50);
  } catch (e) {
    // ignore QR errors
  }

  // Table section
  const tableY = yPos + 90;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, tableY - 25, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  doc.line(margin, tableY - 25, pageWidth - margin, tableY - 25);
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text('تفاصيل الفاتورة', pageWidth / 2, tableY - 12, { align: 'center' });
  autoTable(doc, {
    startY: tableY,
    head: [[
      'الإجمالي',
      'سعر الوحدة',
      'الكمية',
      'اسم المنتج',
      'ملاحظة',
    ]],
    body: products.map(p => [
      formatCurrency(p.price * p.quantity, currency as any),
      formatCurrency(p.price, currency as any),
      p.quantity.toString(),
      p.name,
      p.note || '-',
    ]),
    styles: {
      font: 'Amiri',
      fontSize: 9,
      cellPadding: 8,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
      textColor: [60, 60, 60],
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: 'Amiri',
      halign: 'center',
      valign: 'middle',
      fontSize: 9,
      minCellHeight: 35,
      lineWidth: 0,
    },
    bodyStyles: {
      halign: 'center',
      valign: 'middle',
      minCellHeight: 25,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    theme: 'grid',
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.5,
  });

  // Totals section
  const total = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalsY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : tableY + 100;
  const totalsWidth = 140;
  const totalsX = pageWidth - margin - totalsWidth;
  doc.setFillColor(248, 250, 252);
  doc.rect(totalsX, totalsY, totalsWidth, 22, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(totalsX, totalsY, totalsWidth, 22);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text('الإجمالي الكلي:', totalsX + totalsWidth - 8, totalsY + 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text(formatCurrency(total, currency as any), totalsX + 8, totalsY + 16);

  // Footer
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('تم الإنشاء بواسطة Qalaj Financial', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

  doc.save(`فاتورة-مجموعة-منتجات-${Date.now()}.pdf`);
}


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation } from '../types';
import { formatCurrency } from './utils';

// Helper function to load font as base64
const loadAmiriFont = async (): Promise<string> => {
  try {
    const response = await fetch('/fonts/Amiri.ttf');
    if (!response.ok) {
      throw new Error('Font file not found');
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    return btoa(binaryString);
  } catch (error) {
    console.warn('Could not load Amiri font, using fallback:', error);
    return '';
  }
};

// Helper function to add PNG logo to PDF
const addPNGLogo = async (doc: jsPDF, x: number, y: number, width: number = 40, height: number = 40): Promise<void> => {
  try {
    const logoResponse = await fetch('/logo.png');
    if (!logoResponse.ok) throw new Error('PNG logo not found');

    // Convert to base64 for PDF
    const arrayBuffer = await logoResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    const base64String = btoa(binaryString);

    // Add image to PDF with precise positioning
    doc.addImage(
      'data:image/png;base64,' + base64String,
      'PNG',
      x - width / 2,
      y - height / 2,
      width,
      height,
      undefined,
      'FAST'
    );
  } catch (error) {
    console.warn('Could not load PNG logo:', error);
    // Fallback to enhanced simple logo
    drawEnhancedLogo(doc, x, y, Math.min(width, height) / 2);
  }
};

// Helper function to draw an enhanced logo (fallback)
const drawEnhancedLogo = (doc: jsPDF, x: number, y: number, size: number = 20): void => {
  // Outer circle with shadow effect
  doc.setFillColor(220, 220, 220);
  doc.circle(x + 1, y + 1, size + 2, 'F'); // Shadow

  // Main circle background (white)
  doc.setFillColor(255, 255, 255);
  doc.circle(x, y, size, 'F');

  // Inner decorative circle (gold color from SVG)
  doc.setFillColor(192, 144, 78);
  doc.circle(x, y, size - 3, 'F');

  // Company initials with better positioning
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(size * 0.8);
  setArabicFont(doc, 'bold');
  doc.text('Q', x, y + size * 0.15, { align: 'center' });

  // Small decorative dots
  doc.setFillColor(255, 255, 255);
  doc.circle(x - size * 0.4, y - size * 0.4, 2, 'F');
  doc.circle(x + size * 0.4, y - size * 0.4, 2, 'F');
  doc.circle(x, y + size * 0.6, 2, 'F');
};

// Helper function to draw a simple logo (fallback)
const drawLogo = (doc: jsPDF, x: number, y: number, size: number = 30): void => {
  // Main circle background
  doc.setFillColor(255, 255, 255);
  doc.circle(x, y, size, 'F');

  // Inner decorative circle
  doc.setFillColor(192, 144, 78); // Gold color from SVG
  doc.circle(x, y, size - 4, 'F');

  // Company initials in the center
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(size / 2);
  setArabicFont(doc, 'bold');
  doc.text('Q', x, y + size / 6, { align: 'center' });
};


// Helper function to set Arabic font
const setArabicFont = (doc: jsPDF, style: 'normal' | 'bold' = 'normal'): void => {
  try {
    doc.setFont('Amiri', style);
  } catch {
    try {
      // Fallback to Amiri normal if bold is not available
      doc.setFont('Amiri', 'normal');
    } catch {
      try {
        // Try Times for better Arabic support than Helvetica
        doc.setFont('times', style);
      } catch {
        // Ultimate fallback to helvetica
        doc.setFont('helvetica', style);
      }
    }
  }
};

// Helper function to register Amiri font
const registerAmiriFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    const amiriFontBase64 = await loadAmiriFont();
    if (amiriFontBase64) {
      doc.addFileToVFS('Amiri.ttf', amiriFontBase64);
      doc.addFont('Amiri.ttf', 'Amiri', 'normal');
      doc.addFont('Amiri.ttf', 'Amiri', 'bold'); // Use same file for bold
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to register Amiri font:', error);
    return false;
  }
};

// Test function to verify font loading
export const testFontLoading = async (): Promise<boolean> => {
  try {
    const doc = new jsPDF();
    const fontLoaded = await registerAmiriFont(doc);
    console.log('Font loading test result:', fontLoaded);
    return fontLoaded;
  } catch (error) {
    console.error('Font loading test failed:', error);
    return false;
  }
};
export const generateQuotationPDF = async (quotation: Quotation) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });

  // Register Amiri Arabic font
  await registerAmiriFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;

  // Set Amiri font as default
  setArabicFont(doc, 'normal');

  // Header background with gradient effect
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Draw PNG logo with optimized dimensions
  await addPNGLogo(doc, margin + 20, 30, 30, 40);

  // Company name next to logo with professional styling
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  setArabicFont(doc, 'bold');
  doc.text('قلج', margin + 50, 30);

  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text('للتوريدات العامه', margin + 45, 45);


  // Main title with elegant styling - RTL
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'bold');
  doc.text('عرض سعر', pageWidth / 2, 22, { align: 'center' });

  // Subtitle with professional touch
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  setArabicFont(doc, 'normal');
  doc.text('عرض أسعار احترافي', pageWidth / 2, 35, { align: 'center' });

  // Quote number and date on the same line as title - RTL
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'normal');
  const quoteNumber = `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  doc.text(`رقم العرض ${quoteNumber}`, pageWidth - margin - 5, 45, { align: 'right' });

  // Professional information section with better layout
  let yPos = 75;

  // Client information header
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

  // Company info in a professional grid layout - RTL - Enhanced size
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 40);

  // Company name section - right side
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('اسم الشركة:', pageWidth - margin - 8, yPos + 15, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  // تحسين عرض اسم الشركة مع حجم خط أكبر
  const companyName = quotation.company && quotation.company.trim() ? quotation.company : 'بدون اسم';
  doc.text(companyName, pageWidth - margin - 8, yPos + 28, { align: 'right' });

  // Date section on the left side - enhanced
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('تاريخ العرض', margin + 8, yPos + 15);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  // تحسين عرض التاريخ مع حجم خط أكبر
  let quotationDate = '';
  try {
    if (quotation.createdAt) {
      if (typeof quotation.createdAt === 'string' || typeof quotation.createdAt === 'number') {
        quotationDate = new Date(quotation.createdAt).toLocaleDateString('ar-EG');
      } else if (
        typeof quotation.createdAt === 'object' &&
        quotation.createdAt !== null &&
        !(quotation.createdAt instanceof Date) &&
        typeof (quotation.createdAt as any).toDate === 'function'
      ) {
        quotationDate = (quotation.createdAt as any).toDate().toLocaleDateString('ar-EG');
      } else if (quotation.createdAt instanceof Date) {
        quotationDate = quotation.createdAt.toLocaleDateString('ar-EG');
      }
    }
    if (!quotationDate) quotationDate = new Date().toLocaleDateString('ar-EG');
  } catch {
    quotationDate = new Date().toLocaleDateString('ar-EG');
  }
  doc.text(quotationDate, margin + 8, yPos + 28);

  // Products Table with professional styling
  const tableY = yPos + 80;

  // Table header section
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, tableY - 25, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  doc.line(margin, tableY - 25, pageWidth - margin, tableY - 25);

  doc.setTextColor(59, 130, 246);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text('بنود العرض', pageWidth / 2, tableY - 12, { align: 'center' });

  // Professional table with enhanced styling - RTL
  autoTable(doc, {
    startY: tableY,
    head: [[
      'الإجمالي',
      'سعر الوحدة',
      'الكمية',
      'وصف المنتج'
    ]],
    body: quotation.products.map((p: any, index: number) => [
      formatCurrency(p.price * p.quantity, 'EGP'),
      formatCurrency(p.price, 'EGP'),
      p.quantity.toString(),
      `${index + 1}. ${p.name}`
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
      fillColor: [59, 130, 246],
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
    columnStyles: {
      0: {
        halign: 'center',
        cellWidth: (pageWidth - 2 * margin) * 0.22,
        fontStyle: 'bold',
        textColor: [34, 197, 94]
      },
      1: {
        halign: 'center',
        cellWidth: (pageWidth - 2 * margin) * 0.22
      },
      2: {
        halign: 'center',
        cellWidth: (pageWidth - 2 * margin) * 0.15,
        fontStyle: 'bold'
      },
      3: {
        halign: 'right',
        cellWidth: (pageWidth - 2 * margin) * 0.41,
        fontSize: 8
      }
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    theme: 'grid',
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.5,
  });

  // Professional totals section with dynamic tax calculation
  const subtotal = quotation.products?.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0) || 0;
  const taxRate = typeof quotation.taxRate === 'number' && !isNaN(quotation.taxRate) ? quotation.taxRate : 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableY + 100;

  // Subtotal and calculations section
  const totalsStartY = finalY + 20;
  const totalsWidth = 140;
  const totalsX = pageWidth - margin - totalsWidth;

  // Subtotal
  doc.setFillColor(248, 250, 252);
  doc.rect(totalsX, totalsStartY, totalsWidth, 22, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(totalsX, totalsStartY, totalsWidth, 22);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text('المجموع الفرعي:', totalsX + totalsWidth - 8, totalsStartY + 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text(formatCurrency(subtotal, 'EGP'), totalsX + 8, totalsStartY + 16);

  // Tax line with dynamic calculation
  doc.setFillColor(255, 255, 255);
  doc.rect(totalsX, totalsStartY + 22, totalsWidth, 22, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(totalsX, totalsStartY + 22, totalsWidth, 22);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text(`الضريبة ${taxRate}%`, totalsX + totalsWidth - 8, totalsStartY + 32, { align: 'right' });
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text(formatCurrency(taxAmount, 'EGP'), totalsX + 8, totalsStartY + 38);

  // Final total with emphasis
  doc.setFillColor(34, 197, 94);
  doc.rect(totalsX, totalsStartY + 44, totalsWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  setArabicFont(doc, 'bold');
  doc.text('المجموع النهائي', totalsX + totalsWidth - 8, totalsStartY + 56, { align: 'right' });

  doc.setFontSize(12);
  doc.text(formatCurrency(total, 'EGP'), totalsX + 8, totalsStartY + 66);

  // Payment terms section with dynamic content
  const paymentY = totalsStartY + 84;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, paymentY, pageWidth - 2 * margin, 35, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.line(margin, paymentY, pageWidth - margin, paymentY);

  doc.setTextColor(59, 130, 246);
  doc.setFontSize(10);
  setArabicFont(doc, 'bold');
  doc.text('شروط الدفع وموعد التسليم', pageWidth / 2, paymentY + 12, { align: 'center' });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  const paymentTerms = quotation.paymentTerms && quotation.paymentTerms.trim() ? quotation.paymentTerms : 'غير محدد';
  const deliveryDate = quotation.deliveryDate && quotation.deliveryDate.trim() ? quotation.deliveryDate : 'غير محدد';
  doc.text(`• شروط الدفع: ${paymentTerms}`, pageWidth - margin - 8, paymentY + 22, { align: 'right' });
  doc.text(`• موعد التسليم المتوقع: ${deliveryDate}`, pageWidth - margin - 8, paymentY + 32, { align: 'right' });

  // Professional terms and conditions section
  const termsY = pageHeight - 140; // Position above footer
  const termsWidth = 100;
  const termsHeight = 50;
  const termsX = pageWidth - margin - termsWidth;

  // Terms box with professional styling
  doc.setFillColor(255, 255, 255);
  doc.rect(termsX, termsY, termsWidth, termsHeight, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.rect(termsX, termsY, termsWidth, termsHeight);

  // Terms header
  doc.setFillColor(59, 130, 246);
  doc.rect(termsX, termsY, termsWidth, 15, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  setArabicFont(doc, 'bold');
  doc.text('الشروط والأحكام', termsX + termsWidth / 2, termsY + 10, { align: 'center' });

  // Terms content with better formatting - RTL
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  setArabicFont(doc, 'normal');
  doc.text('• صالح لمدة 7 أيام من تاريخ الإصدار', termsX + termsWidth - 3, termsY + 22, { align: 'right' });
  doc.text('• الأسعار شاملة الضرائب المذكورة', termsX + termsWidth - 3, termsY + 30, { align: 'right' });
  doc.text('• تطبق الشروط والأحكام العامة', termsX + termsWidth - 3, termsY + 38, { align: 'right' });

  // Signature section
  const signatureY = termsY - 35;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text('للموافقة والقبول', pageWidth - margin - 8, signatureY, { align: 'right' });

  // Signature line - RTL
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin + 70, signatureY + 15, margin + 150, signatureY + 15);
  doc.text('التوقيع والختم', margin + 110, signatureY + 25, { align: 'center' });

  doc.line(margin + 160, signatureY + 15, margin + 220, signatureY + 15);
  doc.text('التاريخ', margin + 190, signatureY + 25, { align: 'center' });

  // Professional footer with company branding
  doc.setFillColor(45, 55, 72);
  doc.rect(0, pageHeight - 50, pageWidth, 50, 'F');


  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  setArabicFont(doc, 'bold');

  // Company information in professional layout - RTL
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  setArabicFont(doc, 'bold');

  doc.setFontSize(7);
  setArabicFont(doc, 'normal');

  // Contact information - right aligned
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7);
  setArabicFont(doc, 'normal');
  doc.text('www.qalaj.com', pageWidth - margin - 5, pageHeight - 35, { align: 'right' });
  doc.text('info@qalaj.com', pageWidth - margin - 5, pageHeight - 27, { align: 'right' });
  doc.text('+20 107 087 0826', pageWidth - margin - 5, pageHeight - 19, { align: 'right' });

  // Professional separator line
  // doc.setDrawColor(100, 116, 139);
  // doc.setLineWidth(0.5);
  // doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42);

  // Footer note
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(6);
  setArabicFont(doc, 'normal');
  doc.text('شكراً لاختياركم قلج - نتطلع للعمل معكم', pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Save PDF
  const fileName = `عرض_سعر_${quotation.company.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
import { Transaction } from '../types';
import { formatDate } from './utils';

export const generateTransactionPDF = async (transaction: Transaction) => {
  // Create new PDF document with A5 format
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });

  // Register Amiri Arabic font
  await registerAmiriFont(doc);

  // Set up enhanced colors
  const primaryColor = '#2563eb';
  const accentColor = '#10b981';
  const textColor = '#1f2937';
  const lightGray = '#f8fafc';
  const borderColor = '#e2e8f0';

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Set default font to Amiri
  setArabicFont(doc, 'normal');

  // Header with gradient-like effect
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 70, 'F');

  // Draw PNG logo with optimized dimensions
  await addPNGLogo(doc, margin + 25, 35, 40, 30);

  // Company Logo with enhanced design

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text('قلج', margin + 25, 38, { align: 'center' });

  // Main title
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'bold');
  doc.text('إيصال المعاملة / TRANSACTION RECEIPT', pageWidth / 2, 20, { align: 'center' });

  // Company name - enhanced
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text('شركة قلج للتوريدات العامة', pageWidth / 2, 35, { align: 'center' });

  // Receipt date - enhanced
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  setArabicFont(doc, 'normal');
  const receiptDate = new Date().toLocaleDateString('ar-EG');
  doc.text(`تاريخ الإيصال: ${receiptDate}`, pageWidth / 2, 48, { align: 'center' });

  // Transaction type badge with enhanced styling
  const typeColor = transaction.type === 'income' ? '#10b981' : '#ef4444';
  const typeText = transaction.type === 'income' ? 'دخل / INCOME' : 'مصروف / EXPENSE';

  doc.setFillColor(typeColor);
  doc.roundedRect(pageWidth / 2 - 40, 53, 80, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text(typeText, pageWidth / 2, 62, { align: 'center' });

  // Transaction Details Section with cards layout
  let yPosition = 78;

  // Transaction ID Card
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25);

  doc.setTextColor(textColor);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('رقم المعاملة / Transaction ID:', margin + 8, yPosition + 10);
  setArabicFont(doc, 'normal');
  doc.text(transaction.id.substring(0, 12) + '...', margin + 8, yPosition + 20);

  // Date Card
  yPosition += 30;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPosition, (pageWidth - 2 * margin) / 2 - 5, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, yPosition, (pageWidth - 2 * margin) / 2 - 5, 25);

  setArabicFont(doc, 'bold');
  doc.text('التاريخ / Date:', margin + 8, yPosition + 10);
  setArabicFont(doc, 'normal');
  doc.text(formatDate(transaction.date), margin + 8, yPosition + 20);

  // Currency Card
  doc.setFillColor(248, 250, 252);
  doc.rect(pageWidth / 2 + 5, yPosition, (pageWidth - 2 * margin) / 2 - 5, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(pageWidth / 2 + 5, yPosition, (pageWidth - 2 * margin) / 2 - 5, 25);

  setArabicFont(doc, 'bold');
  doc.text('العملة / Currency:', pageWidth / 2 + 13, yPosition + 10);
  setArabicFont(doc, 'normal');
  doc.text(transaction.currency, pageWidth / 2 + 13, yPosition + 20);

  // Description Card
  yPosition += 30;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 35);

  setArabicFont(doc, 'bold');
  doc.text('الوصف / Description:', margin + 8, yPosition + 12);
  setArabicFont(doc, 'normal');
  // Split long descriptions
  const maxWidth = pageWidth - 2 * margin - 16;
  const descriptionLines = doc.splitTextToSize(transaction.description, maxWidth);
  doc.text(descriptionLines, margin + 8, yPosition + 24);

  // Category Card
  yPosition += 40;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25);

  setArabicFont(doc, 'bold');
  doc.text('الفئة / Category:', margin + 8, yPosition + 10);
  setArabicFont(doc, 'normal');
  doc.text(transaction.category, margin + 8, yPosition + 20);

  // Amount Card - Large and prominent
  yPosition += 35;
  doc.setFillColor(typeColor);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F');

  doc.setFontSize(11);
  setArabicFont(doc, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('المبلغ / Amount:', margin + 10, yPosition + 15);

  doc.setFontSize(16);
  const amountText = `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount, transaction.currency)}`;
  doc.text(amountText, pageWidth / 2, yPosition + 30, { align: 'center' });

  // Supplier Information (if exists)
  if (transaction.supplierId) {
    yPosition += 50;
    doc.setFillColor(254, 249, 195);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F');
    doc.setDrawColor(251, 191, 36);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 30);

    doc.setTextColor(textColor);
    doc.setFontSize(9);
    setArabicFont(doc, 'bold');
    doc.text('معلومات المورد / Supplier Information:', margin + 8, yPosition + 12);
    setArabicFont(doc, 'normal');
    doc.text('Supplier ID: ' + transaction.supplierId, margin + 8, yPosition + 22);
  }

  // Footer Section with enhanced design
  const footerY = pageHeight - 50;

  // Footer background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY, pageWidth, 50, 'F');

  // Decorative line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  doc.line(margin, footerY + 5, pageWidth - margin, footerY + 5);

  // Footer content
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  setArabicFont(doc, 'normal');
  doc.text('تم الإنشاء في / Generated on: ' + new Date().toLocaleString(), margin, footerY + 18);

  doc.setFontSize(8);
  setArabicFont(doc, 'bold');
  doc.setTextColor(primaryColor);
  doc.text('info@qalaj.com | www.qalaj.com', pageWidth / 2, footerY + 30, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('للاستفسارات والدعم / For inquiries and support', pageWidth / 2, footerY + 40, { align: 'center' });

  // Save the PDF
  const fileName = `transaction_${transaction.id.substring(0, 8)}_${formatDate(transaction.date).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

export const generateAllTransactionsPDF = async (transactions: Transaction[]) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });

  // Register Amiri Arabic font
  await registerAmiriFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 60;

  // Set default font to Amiri
  setArabicFont(doc, 'normal');

  // Enhanced Header with gradient effect
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Draw PNG logo with optimized dimensions
  await addPNGLogo(doc, margin + 15, 25, 28, 28);

  // Main title
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'bold');
  doc.text('التقرير المالي / FINANCIAL REPORT', pageWidth / 2, 18, { align: 'center' });

  // Company name - enhanced with better positioning
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'bold');
  doc.text('شركة قلج للتوريدات العامة', pageWidth / 2, 32, { align: 'center' });

  // Company subtitle in English
  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);
  setArabicFont(doc, 'normal');
  doc.text('QALAJ General Supplies Company', pageWidth / 2, 42, { align: 'center' });

  // Date range with styled box - enhanced size
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0] ? formatDate(dates[0]) : 'N/A';
  const endDate = dates[dates.length - 1] ? formatDate(dates[dates.length - 1]) : 'N/A';
  const reportDate = new Date().toLocaleDateString('ar-EG');

  // Larger box for better visibility
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 50, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 50);

  // Enhanced text with better spacing
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  setArabicFont(doc, 'bold');
  doc.text('معلومات التقرير', pageWidth / 2, yPosition + 15, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  setArabicFont(doc, 'bold');
  doc.text('فترة التقرير:', pageWidth / 2, yPosition + 28, { align: 'center' });
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text(`${startDate} إلى ${endDate}`, pageWidth / 2, yPosition + 38, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`تاريخ الإنشاء: ${reportDate}`, pageWidth / 2, yPosition + 47, { align: 'center' });

  // Summary section with enhanced design
  yPosition += 60;
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('الملخص المالي / Financial Summary', pageWidth / 2, yPosition, { align: 'center' });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Summary cards in compact A5 layout
  yPosition += 15;
  const cardWidth = (pageWidth - 3 * margin) / 2;

  // Income card
  doc.setFillColor(236, 253, 245);
  doc.rect(margin, yPosition, cardWidth, 30, 'F');

  doc.setFontSize(8);
  setArabicFont(doc, 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text('الدخل / Income', margin + 5, yPosition + 12);
  doc.setFontSize(10);
  doc.text(formatCurrency(totalIncome, 'EGP'), margin + cardWidth / 2, yPosition + 22, { align: 'center' });

  // Expenses card
  doc.setFillColor(254, 242, 242);
  doc.rect(margin + cardWidth + margin / 2, yPosition, cardWidth, 30, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.rect(margin + cardWidth + margin / 2, yPosition, cardWidth, 30);

  doc.setTextColor(239, 68, 68);
  doc.text('المصروفات / Expenses', margin + cardWidth + margin / 2 + 5, yPosition + 12);
  doc.text(formatCurrency(totalExpenses, 'EGP'), margin + cardWidth + margin / 2 + cardWidth / 2, yPosition + 22, { align: 'center' });

  // Net income - full width
  yPosition += 35;
  doc.setFillColor(netIncome >= 0 ? 236 : 254, netIncome >= 0 ? 253 : 242, netIncome >= 0 ? 245 : 242);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F');
  doc.setDrawColor(netIncome >= 0 ? 34 : 239, netIncome >= 0 ? 197 : 68, netIncome >= 0 ? 94 : 68);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25);

  doc.setTextColor(netIncome >= 0 ? 34 : 239, netIncome >= 0 ? 197 : 68, netIncome >= 0 ? 94 : 68);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text(`صافي الدخل / Net Income: ${formatCurrency(netIncome, 'EGP')}`, pageWidth / 2, yPosition + 15, { align: 'center' });

  // Compact transactions list
  yPosition += 35;
  doc.setFontSize(10);
  setArabicFont(doc, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('تفاصيل المعاملات / Transaction Details', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(7);
  setArabicFont(doc, 'bold');
  doc.text('التاريخ/Date', margin, yPosition);
  doc.text('الوصف/Desc', margin + 50, yPosition);
  doc.text('الفئة/Cat', margin + 120, yPosition);
  doc.text('المبلغ/Amount', pageWidth - margin, yPosition, { align: 'right' });

  // Draw header line
  yPosition += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // Transaction rows - compact for A5
  yPosition += 8;
  setArabicFont(doc, 'normal');
  doc.setFontSize(6);

  // Show only recent transactions due to space constraints
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15); // Limit to 15 most recent

  recentTransactions.forEach((transaction) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setTextColor(0, 0, 0);
    doc.text(formatDate(transaction.date).substring(0, 8), margin, yPosition);
    doc.text(transaction.description.substring(0, 20) + (transaction.description.length > 20 ? '...' : ''), margin + 50, yPosition);
    doc.text(transaction.category.substring(0, 10) + (transaction.category.length > 10 ? '...' : ''), margin + 120, yPosition);

    // Amount with color
    doc.setTextColor(transaction.type === 'income' ? 34 : 239, transaction.type === 'income' ? 197 : 68, transaction.type === 'income' ? 94 : 68);
    const sign = transaction.type === 'income' ? '+' : '-';
    doc.text(`${sign}${formatCurrency(transaction.amount, transaction.currency)}`, pageWidth - margin, yPosition, { align: 'right' });

    yPosition += 8;
  });

  // Show note if transactions were truncated
  if (transactions.length > 15) {
    yPosition += 5;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6);
    setArabicFont(doc, 'normal');
    doc.text(`عرض ${recentTransactions.length} من أصل ${transactions.length} معاملة / Showing ${recentTransactions.length} of ${transactions.length} transactions`, pageWidth / 2, yPosition, { align: 'center' });
  }

  // Footer
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer background
    doc.setFillColor(59, 130, 246);
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    setArabicFont(doc, 'normal');
    doc.text('QALAJ Company Financial Management', pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text('info@qalaj.com | www.qalaj.com', pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(`${i}/${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Save the PDF
  const today = new Date().toISOString().split('T')[0];
  doc.save(`Financial_Report_${today}.pdf`);
};

export const generateTransactionSummaryPDF = async (transactions: Transaction[], title = 'Transaction Summary') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });

  // Register Amiri Arabic font
  await registerAmiriFont(doc);

  // Set up colors
  const primaryColor = '#2563eb';
  const accentColor = '#10b981';
  const textColor = '#1f2937';

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Set default font to Amiri
  setArabicFont(doc, 'normal');

  // Enhanced Header
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Draw PNG logo with optimized dimensions
  await addPNGLogo(doc, margin + 20, 30, 32, 32);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  setArabicFont(doc, 'bold');
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  // Company name - enhanced
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'bold');
  doc.text('شركة قلج للتوريدات العامة', pageWidth / 2, 35, { align: 'center' });

  // Report date - enhanced
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  setArabicFont(doc, 'normal');
  const reportDate = new Date().toLocaleDateString('ar-EG');
  doc.text(`تاريخ التقرير: ${reportDate}`, pageWidth / 2, 48, { align: 'center' });

  // Summary statistics with enhanced cards
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpenses;

  let yPosition = 75;

  // Summary cards
  const cardWidth = (pageWidth - 3 * margin) / 2;

  // Total Transactions Card
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPosition, cardWidth, 40, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition, cardWidth, 40);

  doc.setTextColor(textColor);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('إجمالي المعاملات / Total Transactions:', margin + 5, yPosition + 15);
  doc.setFontSize(14);
  setArabicFont(doc, 'bold');
  doc.setTextColor(primaryColor);
  doc.text(transactions.length.toString(), margin + cardWidth / 2, yPosition + 30, { align: 'center' });

  // Net Amount Card
  doc.setFillColor(netAmount >= 0 ? 236 : 254, netAmount >= 0 ? 253 : 242, netAmount >= 0 ? 245 : 242);
  doc.rect(margin + cardWidth + margin / 2, yPosition, cardWidth, 40, 'F');
  doc.setDrawColor(netAmount >= 0 ? 34 : 239, netAmount >= 0 ? 197 : 68, netAmount >= 0 ? 94 : 68);
  doc.rect(margin + cardWidth + margin / 2, yPosition, cardWidth, 40);

  doc.setTextColor(textColor);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('صافي المبلغ / Net Amount:', margin + cardWidth + margin / 2 + 5, yPosition + 15);
  doc.setFontSize(12);
  doc.setTextColor(netAmount >= 0 ? 34 : 239, netAmount >= 0 ? 197 : 68, netAmount >= 0 ? 94 : 68);
  doc.text(formatCurrency(netAmount, 'EGP'), margin + cardWidth + margin / 2 + cardWidth / 2, yPosition + 30, { align: 'center' });

  // Income Card
  yPosition += 50;
  doc.setFillColor(236, 253, 245);
  doc.rect(margin, yPosition, cardWidth, 40, 'F');

  doc.setTextColor(textColor);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('إجمالي الدخل / Total Income:', margin + 5, yPosition + 15);
  doc.setFontSize(12);
  doc.setTextColor(34, 197, 94);
  doc.text(formatCurrency(totalIncome, 'EGP'), margin + cardWidth / 2, yPosition + 30, { align: 'center' });

  // Expenses Card
  doc.setFillColor(254, 242, 242);
  doc.rect(margin + cardWidth + margin / 2, yPosition, cardWidth, 40, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.rect(margin + cardWidth + margin / 2, yPosition, cardWidth, 40);

  doc.setTextColor(textColor);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('إجمالي المصروفات / Total Expenses:', margin + cardWidth + margin / 2 + 5, yPosition + 15);
  doc.setFontSize(12);
  doc.setTextColor(239, 68, 68);
  doc.text(formatCurrency(totalExpenses, 'EGP'), margin + cardWidth + margin / 2 + cardWidth / 2, yPosition + 30, { align: 'center' });

  // Footer with enhanced design
  const footerY = pageHeight - 40;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY, pageWidth, 40, 'F');

  doc.setDrawColor(primaryColor);
  doc.setLineWidth(2);
  doc.line(margin, footerY + 5, pageWidth - margin, footerY + 5);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  setArabicFont(doc, 'normal');
  doc.text('تم الإنشاء في / Generated on: ' + new Date().toLocaleString(), margin, footerY + 18);

  doc.setFontSize(9);
  doc.setTextColor(primaryColor);
  setArabicFont(doc, 'bold');
  doc.text('info@qalaj.com | www.qalaj.com', pageWidth / 2, footerY + 28, { align: 'center' });

  // Save the PDF
  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const generateCarrierPackagePDF = async ({ companyInfo, documents, recipient }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Colors
  const navyColor = [10, 22, 40]; // #0A1628
  const cyanColor = [0, 212, 255]; // #00D4FF
  const grayColor = [139, 157, 181]; // #8B9DB5
  
  // ============ COVER PAGE ============
  
  // Header background
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Company Logo/Initials
  if (companyInfo.logoPreview) {
    try {
      doc.addImage(companyInfo.logoPreview, 'PNG', margin, 15, 50, 50);
    } catch (e) {
      // Fallback to initials if image fails
      drawInitials(doc, companyInfo.legalName, margin, 15);
    }
  } else {
    drawInitials(doc, companyInfo.legalName, margin, 15);
  }
  
  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.legalName || 'Carrier Profile', 80, 35);
  
  // DBA Name
  if (companyInfo.dbaName) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`DBA: ${companyInfo.dbaName}`, 80, 45);
  }
  
  // Contact Info
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  const contactY = companyInfo.dbaName ? 55 : 45;
  doc.text(`${companyInfo.province || ''}, ${companyInfo.country || ''}`, 80, contactY);
  doc.text(`${companyInfo.phone || ''} | ${companyInfo.email || ''}`, 80, contactY + 6);
  
  // Title
  doc.setTextColor(...navyColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Carrier Document Package', margin, 110);
  
  // Recipient Info Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, 125, pageWidth - (margin * 2), 45, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text('PREPARED FOR', margin + 10, 138);
  
  doc.setFontSize(14);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text(recipient.name, margin + 10, 150);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(recipient.company, margin + 10, 160);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth - margin - 60, 138);
  
  // Documents List Title
  doc.setTextColor(...navyColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Documents Included', margin, 195);
  
  // Documents Table
  const tableData = documents.map((doc, index) => [
    (index + 1).toString(),
    doc.name,
    doc.expiryDate ? format(new Date(doc.expiryDate), 'MMM d, yyyy') : 'N/A',
  ]);
  
  doc.autoTable({
    startY: 205,
    head: [['#', 'Document Name', 'Expiry Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: navyColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: navyColor,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40 },
    },
    margin: { left: margin, right: margin },
  });
  
  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    'This document package was generated via the TMS Carrier Profile system.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  
  // ============ DOCUMENT PAGES ============
  // Note: In a real implementation, you would add each document as separate pages
  // For now, we'll add a note page
  
  doc.addPage();
  
  // Header
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.legalName || 'Carrier Profile', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Document Package', pageWidth - margin - 40, 20);
  
  // Content
  doc.setTextColor(...navyColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Attachments', margin, 55);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  
  const noteText = [
    'The following documents are included in this carrier package:',
    '',
  ];
  
  documents.forEach((doc, index) => {
    noteText.push(`${index + 1}. ${doc.name}`);
    if (doc.expiryDate) {
      noteText.push(`   Expires: ${format(new Date(doc.expiryDate), 'MMMM d, yyyy')}`);
    }
    noteText.push('');
  });
  
  noteText.push('');
  noteText.push('For questions about this carrier package, please contact:');
  noteText.push(`${companyInfo.email} | ${companyInfo.phone}`);
  
  let yPos = 70;
  noteText.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 7;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text(
    `Page 2 | Generated ${format(new Date(), 'MMMM d, yyyy h:mm a')}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  
  // Save the PDF
  const fileName = `${companyInfo.legalName?.replace(/[^a-z0-9]/gi, '_') || 'Carrier'}_Package_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

function drawInitials(doc, companyName, x, y) {
  const initials = getInitials(companyName);
  
  // Draw circle background
  doc.setFillColor(0, 212, 255);
  doc.circle(x + 25, y + 25, 25, 'F');
  
  // Draw initials
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(initials, x + 25, y + 30, { align: 'center' });
}

function getInitials(name) {
  if (!name) return 'CP';
  const words = name.split(' ').filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0]?.substring(0, 2).toUpperCase() || 'CP';
}

export default generateCarrierPackagePDF;

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Portfolio } from '../types';

export const generatePortfolioPDF = async (portfolio: Portfolio, elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Portfolio element not found');
  }

  // Create canvas from the portfolio element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 0;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  
  // Save the PDF
  pdf.save(`${portfolio.name.replace(/\s+/g, '_')}_Portfolio.pdf`);
};
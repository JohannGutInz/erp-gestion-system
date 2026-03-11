
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
};

export const generateWorksControlPDF = (works) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more horizontal space
  
  // Header
  doc.setFillColor(41, 128, 185); // Blue
  doc.rect(0, 0, 297, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("CONTROL DE OBRAS", 14, 17);
  
  doc.setFontSize(10);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, 280, 17, { align: 'right' });

  // Data Preparation
  const tableColumn = ["Estatus", "No. Cliente", "Cliente", "Ubicación", "Servicios", "Inicio", "Total", "Anticipo", "Saldo"];
  
  // Sort by Status and then Date
  const sortedWorks = [...works].sort((a, b) => {
    if (a.estatus === b.estatus) {
        return new Date(a.startDate) - new Date(b.startDate);
    }
    return a.estatus.localeCompare(b.estatus);
  });

  const tableRows = sortedWorks.map(work => {
    const t = parseFloat(work.total) || 0;
    const a = parseFloat(work.advance) || 0;
    const b = t - a;

    return [
      work.estatus || 'En Proceso',
      work.clientNumber || '',
      work.clientName,
      work.location,
      work.services,
      work.startDate ? new Date(work.startDate).toLocaleDateString('es-MX') : '',
      formatCurrency(t),
      formatCurrency(a),
      formatCurrency(b)
    ];
  });

  // Table Generation
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 }, // Status
      1: { cellWidth: 20, halign: 'center' }, // Client Number
      2: { cellWidth: 35 }, // Client
      3: { cellWidth: 45 }, // Location
      4: { cellWidth: 'auto' }, // Services
      5: { halign: 'center', cellWidth: 20 }, // Date
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 28 }, // Total
      7: { halign: 'right', cellWidth: 28 }, // Advance
      8: { halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0], cellWidth: 28 }, // Balance
    },
    didParseCell: function(data) {
        // Style status column
        if (data.section === 'body' && data.column.index === 0) {
            const status = data.cell.raw;
            if (status === 'En Proceso') data.cell.styles.textColor = [34, 139, 34]; // Green
            if (status === 'Pausa') data.cell.styles.textColor = [218, 165, 32]; // Gold
            if (status === 'Terminado') data.cell.styles.textColor = [41, 128, 185]; // Blue
        }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 285, 200, { align: 'right' });
    doc.text(`Generado por Sistema de Gestión de Obras`, 14, 200);
  }

  doc.save(`Control_Obras_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.pdf`);
};

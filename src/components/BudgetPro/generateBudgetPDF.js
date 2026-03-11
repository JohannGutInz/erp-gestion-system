
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
};

export const generateBudgetPDF = (data) => {
  const doc = new jsPDF();
  const { contractor, client, services, materials, labor, machinery, totals, folio, date, observations, customTitle } = data;

  // Colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 73, 94]; // Dark Gray
  const accentColor = [230, 126, 34]; // Orange

  // --- Header ---
  // Logo Logic
  if (contractor.logo) {
    try {
      const img = new Image();
      img.src = contractor.logo;
      
      // Calculate aspect ratio
      const imgWidth = img.width;
      const imgHeight = img.height;
      const aspectRatio = imgWidth / imgHeight;

      // Max dimensions in mm
      const maxWidth = 60;
      const maxHeight = 30;

      let finalWidth = maxWidth;
      let finalHeight = maxWidth / aspectRatio;

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * aspectRatio;
      }

      // Add image with calculated dimensions
      // Position: x=15, y=10
      // We don't specify format 'PNG' or 'JPEG' explicitly unless necessary,
      // but 'PNG' usually works as a catch-all for data URIs in jsPDF, or let it auto-detect.
      // Using 'PNG' alias for safety if it's a data URL.
      doc.addImage(contractor.logo, 'PNG', 15, 10, finalWidth, finalHeight);

    } catch (e) {
      console.warn("Could not add logo", e);
    }
  }

  // Company Info (Right Aligned)
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(contractor.companyName || "NOMBRE DE LA EMPRESA", 195, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.setFont("helvetica", "normal");
  doc.text(contractor.responsible || "", 195, 26, { align: "right" });
  doc.text(contractor.address || "", 195, 31, { align: "right" });
  doc.text(contractor.phone || "", 195, 36, { align: "right" });

  // Title and Folio
  // Ensure enough space below logo (logo starts at y=10, max height 30 -> y=40)
  // Current title starts at y=50, which is safe (10mm buffer).
  doc.setFontSize(22);
  doc.setTextColor(...accentColor);
  doc.setFont("helvetica", "bold");
  
  // Use custom title if available, otherwise default
  const titleText = customTitle ? customTitle.toUpperCase() : "PRESUPUESTO DE OBRA";
  doc.text(titleText, 15, 50);

  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  doc.text(`Folio: ${folio}`, 195, 50, { align: "right" });
  doc.text(`Fecha: ${date}`, 195, 56, { align: "right" });

  // Divider
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(15, 60, 195, 60);

  // --- Client Info ---
  doc.setFontSize(11);
  doc.setTextColor(...secondaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE Y PROYECTO", 15, 68);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Cliente: ${client.name}`, 15, 75);
  doc.text(`Teléfono: ${client.phone}`, 15, 80);
  doc.text(`Email: ${client.email}`, 15, 85);
  
  doc.text(`Ubicación: ${client.location}`, 110, 75);
  doc.text(`Tipo de Proyecto: ${client.type}`, 110, 80);
  doc.text(`RFC: ${client.rfc || 'N/A'}`, 110, 85);

  let currentY = 95;

  // --- Selected Services ---
  if (services.length > 0) {
    doc.setFillColor(245, 245, 245);
    doc.rect(15, currentY - 5, 180, 7 + (Math.ceil(services.length / 3) * 6), 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text("SERVICIOS SOLICITADOS:", 18, currentY);
    currentY += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    // Grid layout for services
    let x = 18;
    services.forEach((service, index) => {
        // Construct string with name and price if exists
        let text = `• ${service.name}`;
        if (service.price > 0) {
             text += ` (${formatCurrency(service.price)})`;
        }
        
        doc.text(text, x, currentY);
        if ((index + 1) % 3 === 0) {
            currentY += 5;
            x = 18;
        } else {
            x += 60;
        }
    });
    currentY += 10;
  }

  // --- Tables Helper ---
  const generateTable = (title, items, startY, type = 'standard') => {
    if (!items || items.length === 0) return startY;

    // Check visibility for materials table prices
    let showPrices = true;
    if (type === 'materials') {
      showPrices = items.some(item => item.hasPrice !== false);
    }

    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(title, 15, startY);

    // Define columns based on visibility
    let headers = [['Concepto', 'Cant.', 'Unidad', 'P. Unitario', 'Total']];
    let columnStyles = {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    };

    if (!showPrices && type === 'materials') {
      headers = [['Concepto', 'Cant.', 'Unidad']];
      columnStyles = {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
      };
    }

    const tableBody = items.map(item => {
        // Standard row data
        const row = [
            item.concept,
            item.quantity,
            item.unit
        ];

        // Add price columns if needed
        if (showPrices || type !== 'materials') {
           const hasPrice = item.hasPrice !== false;
           row.push(
              hasPrice ? formatCurrency(item.unitPrice) : '-',
              hasPrice ? formatCurrency(item.total) : 'Sin precio'
           );
        }
        
        return row;
    });

    doc.autoTable({
      startY: startY + 2,
      head: headers,
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 9 },
      columnStyles: columnStyles
    });

    return doc.lastAutoTable.finalY + 10;
  };

  currentY = generateTable("MATERIALES", materials, currentY, 'materials');
  currentY = generateTable("MANO DE OBRA", labor, currentY, 'standard');
  currentY = generateTable("MAQUINARIA Y EQUIPO", machinery, currentY, 'standard');

  // --- Observations ---
  if (observations) {
    // Check page break
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVACIONES:", 15, currentY);
    
    doc.setFont("helvetica", "normal");
    const splitObs = doc.splitTextToSize(observations, 180);
    doc.text(splitObs, 15, currentY + 5);
    currentY += (splitObs.length * 5) + 10;
  }

  // --- Totals ---
  // Check page break for totals
  if (currentY > 240) { doc.addPage(); currentY = 20; }

  const boxX = 120;
  const boxWidth = 75;
  const boxHeight = 55; // Increased to fit Services
  
  doc.setFillColor(240, 240, 240);
  doc.rect(boxX, currentY, boxWidth, boxHeight, 'F');
  
  doc.setFontSize(11);
  let textY = currentY + 8;
  const rightAlignX = boxX + boxWidth - 5;

  // Services Subtotal
  if (totals.services > 0) {
      doc.setFont("helvetica", "normal");
      doc.text("Servicios:", boxX + 5, textY);
      doc.text(formatCurrency(totals.services), rightAlignX, textY, { align: "right" });
      textY += 6;
  }

  // Material Subtotal
  doc.setFont("helvetica", "normal");
  doc.text("Materiales:", boxX + 5, textY);
  doc.text(formatCurrency(totals.materials), rightAlignX, textY, { align: "right" });
  textY += 6;

  // Labor Subtotal
  doc.text("Mano de Obra:", boxX + 5, textY);
  doc.text(formatCurrency(totals.labor), rightAlignX, textY, { align: "right" });
  textY += 6;

  // Machinery Subtotal
  doc.text("Maquinaria:", boxX + 5, textY);
  doc.text(formatCurrency(totals.machinery), rightAlignX, textY, { align: "right" });
  textY += 6;

  // IVA
  if (totals.iva > 0) {
      doc.text("IVA (16%):", boxX + 5, textY);
      doc.text(formatCurrency(totals.iva), rightAlignX, textY, { align: "right" });
      textY += 6;
  }

  // Divider
  doc.setDrawColor(200);
  doc.line(boxX + 2, textY - 2, boxX + boxWidth - 2, textY - 2);

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", boxX + 5, textY + 2);
  doc.text(formatCurrency(totals.total), rightAlignX, textY + 2, { align: "right" });
  textY += 8;

  // Anticipo
  if (totals.advance > 0) {
    doc.setFontSize(10);
    doc.setTextColor(40, 167, 69); // Green
    doc.text("Anticipo:", boxX + 5, textY);
    doc.text(`- ${formatCurrency(totals.advance)}`, rightAlignX, textY, { align: "right" });
    textY += 6;

    // Balance
    doc.setTextColor(220, 53, 69); // Red
    doc.setFont("helvetica", "bold");
    doc.text("Saldo Pendiente:", boxX + 5, textY);
    doc.text(formatCurrency(totals.balance), rightAlignX, textY, { align: "right" });
  }

  // --- Terms ---
  const termsY = currentY + boxHeight + 10;
  // Ensure we are on page
  if (termsY > 270) { doc.addPage(); }

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.setFont("helvetica", "normal");
  doc.text("Términos y Condiciones: Este presupuesto tiene una validez de 15 días hábiles. Precios sujetos a cambios sin previo aviso. Se requiere anticipo para iniciar trabajos. No incluye trámites ni permisos salvo que se especifique.", 105, 280, { align: "center", maxWidth: 170 });

  doc.save(`Presupuesto_${folio}_${client.name.replace(/\s+/g, '_')}.pdf`);
};

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

const getBase64Image = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

const getServiceTheme = (serviceType) => {
    switch (serviceType) {
        case 'COLADO COMPLETO V11':
        case 'COLADO COMPLETO V16':
            return { color: [41, 128, 185], name: 'Concreto y Estructura' }; // Blue
        case 'PAQUETE VIGUETA V11':
        case 'PAQUETE VIGUETA V16':
            return { color: [230, 126, 34], name: 'Materiales de Construcción' }; // Orange
        case 'MANTENIMIENTO DE IMPERMEABILIZACION':
            return { color: [39, 174, 96], name: 'Impermeabilización' }; // Green
        case 'FABRICACION DE COCHERAS':
            return { color: [142, 68, 173], name: 'Estructuras Metálicas' }; // Purple
        default:
            return { color: [52, 73, 94], name: 'Servicios Generales' }; // Gray
    }
};

export const generateQuotationPDF = async (quotation, sellers) => {
    const doc = new jsPDF();
    const theme = getServiceTheme(quotation.serviceType);
    const sellerName = sellers.find(s => s.id === quotation.advisor)?.name || 'Asesor de Ventas';
    
    // Fixed Company Data
    const COMPANY_ADDRESS = "14 de Abril 143, San Benito, 83190 Hermosillo, Son.";
    const COMPANY_PHONE = "662 338 0072";

    // --- Header ---
    try {
        // Updated to the specific logo URL provided by user in the latest request
        const logoUrl = 'https://horizons-cdn.hostinger.com/5148a6aa-97b8-4a48-bd80-f2e7521206b9/5533312d9a68803b0dfb84c663b305ca.png';
        const logoBase64 = await getBase64Image(logoUrl);
        
        // Position: Top Left
        // Adjusted placement to match the reference image closely.
        // X=15, Y=10 keeps it aligned with the left margin. 
        // Width=60, Height=40 creates a balanced rectangular aspect ratio often seen in these logos, minimizing distortion.
        doc.addImage(logoBase64, 'PNG', 15, 10, 60, 40); 
    } catch (e) {
        console.warn("Logo load failed", e);
    }

    // Company Info - "COTIZACIÓN" Title
    // Aligned to right side
    doc.setFontSize(22);
    doc.setTextColor(...theme.color);
    doc.setFont("helvetica", "bold");
    doc.text("COTIZACIÓN", 195, 30, { align: "right" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Folio: ${quotation.id.slice(0, 8).toUpperCase()}`, 195, 38, { align: "right" });
    doc.text(`Fecha: ${new Date(quotation.date).toLocaleDateString('es-MX')}`, 195, 43, { align: "right" });

    const startContentY = 70;

    // Blue Separator Line
    doc.setDrawColor(...theme.color);
    doc.setLineWidth(1.5);
    doc.line(15, 60, 195, 60);

    // --- Info Section ---
    // Left Column: Client Info
    doc.setFontSize(11);
    doc.setTextColor(60);
    
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN DEL CLIENTE", 15, 75);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Cliente: ${quotation.clientName}`, 15, 82);
    doc.text(`Ubicación Obra: ${quotation.location}`, 15, 88);
    if (quotation.scheduledDate) {
        doc.text(`Fecha Programada: ${new Date(quotation.scheduledDate).toLocaleDateString('es-MX')}`, 15, 94);
    }

    // Right Column: Company Info (VICON EXPERTOS EN COLADOS)
    // Adjusted X position to 110 to create two columns
    doc.setFont("helvetica", "bold");
    doc.text("VICON EXPERTOS EN COLADOS", 110, 75);
    
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_ADDRESS, 110, 82);
    doc.text(`Tel: ${COMPANY_PHONE}`, 110, 88);
    doc.text(`Asesor: ${sellerName}`, 110, 94);

    // --- Details Table ---
    const tableBody = [
        [
            quotation.serviceType,
            `${quotation.m2 || 0} m²`,
            formatCurrency(quotation.price),
            formatCurrency(quotation.total)
        ]
    ];

    doc.autoTable({
        startY: 105,
        head: [['Descripción del Servicio', 'Cantidad / M²', 'Precio Unitario', 'Total']],
        body: tableBody,
        theme: 'grid', // Standard grid theme as seen in reference
        headStyles: { 
            fillColor: theme.color, 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: { 
            fontSize: 10, 
            cellPadding: 4,
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Description takes remaining space
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' }
        }
    });

    // --- Specs (Optional) ---
    let currentY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...theme.color);
    doc.text("ESPECIFICACIONES ADICIONALES:", 15, currentY);
    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    
    const specsText = quotation.specs ? quotation.specs : "Sin especificaciones adicionales.";
    const splitSpecs = doc.splitTextToSize(specsText, 180);
    doc.text(splitSpecs, 15, currentY);
    currentY += (splitSpecs.length * 5) + 10;

    // --- Financial Summary ---
    // Ensure we don't run off the page
    if (currentY > 220) {
        doc.addPage();
        currentY = 20;
    }
    
    // Align summary box to the right
    const summaryX = 125; 
    const summaryWidth = 70;
    const summaryY = currentY + 10;
    const lineHeight = 8;

    // Background for summary
    doc.setFillColor(245, 245, 245); // Light gray background
    doc.rect(summaryX, summaryY - 5, summaryWidth, 40, 'F');

    doc.setFontSize(11);
    doc.setTextColor(0);
    
    // Subtotal
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", summaryX + 5, summaryY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrency(quotation.total), summaryX + summaryWidth - 5, summaryY + 5, { align: "right" });

    // Anticipo
    doc.setFont("helvetica", "bold");
    doc.text("Anticipo:", summaryX + 5, summaryY + 5 + lineHeight);
    doc.setTextColor(46, 204, 113); // Green
    doc.setFont("helvetica", "normal");
    doc.text(`- ${formatCurrency(quotation.advance)}`, summaryX + summaryWidth - 5, summaryY + 5 + lineHeight, { align: "right" });

    // Resta
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Resta:", summaryX + 5, summaryY + 5 + (lineHeight * 2.5));
    doc.setTextColor(192, 57, 43); // Red
    doc.text(formatCurrency(quotation.balance), summaryX + summaryWidth - 5, summaryY + 5 + (lineHeight * 2.5), { align: "right" });

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    
    // Footer Line
    doc.setDrawColor(200);
    doc.setLineWidth(1);
    doc.line(15, pageHeight - 30, 195, pageHeight - 30);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    
    doc.text("Gracias por su preferencia. Esta cotización tiene una validez de 15 días.", 105, pageHeight - 22, { align: "center" });
    
    doc.setFont("helvetica", "bolditalic");
    doc.text("VICON EXPERTOS EN COLADOS - Soluciones profesionales en construcción", 105, pageHeight - 17, { align: "center" });
    
    doc.setFont("helvetica", "italic");
    doc.text(`${COMPANY_ADDRESS} | Tel: ${COMPANY_PHONE}`, 105, pageHeight - 12, { align: "center" });

    doc.save(`Cotizacion_${quotation.clientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};
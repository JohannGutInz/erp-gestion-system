import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
};

const getServiceText = (serviceType) => {
    switch (serviceType) {
        case 'colado': return 'Colado Completo';
        case 'envio': return 'Envío de Material';
        case 'impermeabilizacion': return 'Impermeabilización';
        case 'impermeabilizacion_otro': return 'Impermeabilización (Otro)';
        default: return serviceType || 'N/A';
    }
};

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
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const generateIncomeReportPDF = async (orders, dateRange, serviceType = 'all', waterproofingType = 'all') => {
    const doc = new jsPDF();

    // Filter orders by service type if strictly requested
    let finalOrders = orders;
    
    if (serviceType === 'all') {
        // Keep all orders if 'all' services selected
        // Note: This logic assumes 'orders' passed in are already date-filtered
        finalOrders = orders; 
    } else if (serviceType === 'impermeabilizacion') {
        if (waterproofingType === 'all') {
             // Include both standard and 'other' waterproofing
             finalOrders = orders.filter(o => o.serviceType === 'impermeabilizacion' || o.serviceType === 'impermeabilizacion_otro');
        } else {
             // Specific subtype
             finalOrders = orders.filter(o => o.serviceType === waterproofingType);
        }
    } else {
        // Simple filter for colado, envio, etc.
        finalOrders = orders.filter(order => order.serviceType === serviceType);
    }

    // Determine Report Title based on service type
    let reportTitle = "Reporte de Ingresos";
    
    if (serviceType === 'impermeabilizacion') {
         if (waterproofingType === 'all') {
             reportTitle += " - Impermeabilizaciones (Todos)";
         } else if (waterproofingType === 'impermeabilizacion') {
             reportTitle += " - Impermeabilizaciones (Completo)";
         } else if (waterproofingType === 'impermeabilizacion_otro') {
             reportTitle += " - Impermeabilizaciones (Otro)";
         }
    } else {
        switch (serviceType) {
            case 'colado':
                reportTitle += " - Colados";
                break;
            case 'envio':
                reportTitle += " - Envíos";
                break;
            default:
                if (serviceType !== 'all') {
                    reportTitle += ` - ${getServiceText(serviceType)}`;
                } else {
                    reportTitle += " por Trabajos";
                }
                break;
        }
    }

    // Add Logo
    try {
        const logoUrl = 'https://storage.googleapis.com/hostinger-horizons-assets-prod/5148a6aa-97b8-4a48-bd80-f2e7521206b9/e1395ce8a93a1b6ea47b3ebbd6d0e5da.png';
        const logoBase64 = await getBase64Image(logoUrl);
        doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
    } catch (error) {
        console.error("Could not add logo to PDF:", error);
    }

    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(reportTitle, 45, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateStr = `${format(dateRange.from, "d 'de' MMMM, yyyy", { locale: es })} - ${format(dateRange.to, "d 'de' MMMM, yyyy", { locale: es })}`;
    doc.text(`Periodo: ${dateStr}`, 45, 30);

    // Prepare Data
    const tableBody = [];
    let totalIncome = 0;

    // Filter and Sort Orders
    const sortedOrders = finalOrders.sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedOrders.forEach(order => {
        const amount = parseFloat(order.totalAmount) || 0;
        totalIncome += amount;

        const row = [
            format(new Date(order.date), "dd/MM/yyyy"),
            order.clientName,
            getServiceText(order.serviceType),
            `${order.quantity || 0} m²`,
            formatCurrency(amount)
        ];
        tableBody.push(row);
    });

    // Table
    doc.autoTable({
        startY: 40,
        head: [['Fecha', 'Cliente', 'Servicio', 'Cantidad', 'Monto Total']],
        body: tableBody,
        theme: 'striped',
        headStyles: { 
            fillColor: [63, 81, 181], 
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: { 
            fontSize: 10,
            cellPadding: 3,
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 25 }, // Date
            1: { cellWidth: 50 }, // Client
            2: { cellWidth: 50 }, // Service
            3: { cellWidth: 25, halign: 'center' }, // Quantity
            4: { cellWidth: 35, halign: 'right' }  // Total
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        }
    });

    // Summary Section
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(120, finalY, 75, 20, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Total Ingresos del Periodo:", 125, finalY + 8);
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(totalIncome), 190, finalY + 15, { align: 'right' });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Página ${i} de ${pageCount} - Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save(`Reporte_Ingresos_${serviceType}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
};

const getAgendaTitle = (agendaType) => {
    switch (agendaType) {
        case 'colado': return 'Agenda de Colados';
        case 'impermeabilizacion': return 'Agenda de Impermeabilización';
        case 'envio': return 'Agenda de Envíos';
        default: return 'Agenda General de Servicios';
    }
};

const getServiceText = (order) => {
    switch (order.serviceType) {
        case 'colado': return `Colado (${order.viguetaType || 'N/A'})`;
        case 'envio': return 'Envío';
        case 'impermeabilizacion': return 'Imper. Completo';
        case 'impermeabilizacion_otro': return 'Imper. Otro';
        default: return 'N/A';
    }
};

const getDateRangeTitle = (dateRange) => {
    const { from, to } = dateRange;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const fromStr = from.toLocaleDateString('es-ES', options);
    const toStr = to.toLocaleDateString('es-ES', options);
    if (fromStr === toStr) {
        return fromStr;
    }
    return `${fromStr} - ${toStr}`;
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

export const generateWeeklyPDF = async (orders, sellers, dateRange, agendaType, withPrices = true) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    const dateRangeTitle = getDateRangeTitle(dateRange);
    const agendaTitle = getAgendaTitle(agendaType);
    const showMaterialColumns = ['all', 'colado', 'envio'].includes(agendaType);

    try {
        const logoUrl = 'https://storage.googleapis.com/hostinger-horizons-assets-prod/5148a6aa-97b8-4a48-bd80-f2e7521206b9/e1395ce8a93a1b6ea47b3ebbd6d0e5da.png';
        const logoBase64 = await getBase64Image(logoUrl);
        doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
    } catch (error) {
        console.error("Could not add logo to PDF:", error);
    }

    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(agendaTitle, 45, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Periodo: ${dateRangeTitle}`, 45, 30);

    const startOfRange = new Date(dateRange.from);
    startOfRange.setHours(0, 0, 0, 0);

    const endOfRange = new Date(dateRange.to);
    endOfRange.setHours(23, 59, 59, 999);

    const rangeOrders = orders
        .filter(order => {
            const orderDate = new Date(order.date);
            const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
            return orderDay >= startOfRange && orderDay <= endOfRange;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const groupedOrders = rangeOrders.reduce((acc, order) => {
        const date = order.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(order);
        return acc;
    }, {});

    const tableBody = [];
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const headColumns = ['Nro. Nota', 'Cliente', 'Servicio/Vigueta', 'm²', 'Ubicación', 'Teléfono', 'Vendedor'];
    if (withPrices) {
        headColumns.push('Total', 'Anticipo', 'Saldo');
    }
    const head = [headColumns];

    if (showMaterialColumns) {
        head[0].splice(4, 0, 'Bov. Cierre', 'Bovedilla', 'Malla', 'Despiece Viguetas');
    }

    Object.keys(groupedOrders).sort().forEach(dateStr => {
        const date = new Date(dateStr);
        const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        const dayName = daysOfWeek[adjustedDate.getDay()];
        const formattedDate = adjustedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });

        tableBody.push([{
            content: `${dayName}, ${formattedDate}`,
            colSpan: head[0].length,
            styles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' }
        }]);

        groupedOrders[dateStr].forEach(order => {
            const sellerName = sellers.find(s => s.id === order.seller)?.name || 'N/A';
            
            const phoneCell = {
                content: order.phone || '',
                styles: { textColor: [0, 0, 255], fontStyle: 'italic' },
                url: order.phone ? `tel:${order.phone.replace(/\s/g, '')}` : null
            };

            const isMaterialService = order.serviceType === 'colado' || order.serviceType === 'envio';

            const viguetaDetailsText = (order.viguetaDetails && order.viguetaDetails.length > 0)
                ? order.viguetaDetails.map(d => `${d.quantity || '0'} ${order.viguetaType.toUpperCase()} de: ${d.measure}`).join('\n')
                : '';


            const bodyRow = [
                order.noteNumber || 'N/A',
                order.clientName,
                getServiceText(order),
                `${order.quantity || 0}`,
            ];

            if (showMaterialColumns) {
                bodyRow.push(
                    isMaterialService ? order.bovedillaCierreQuantity || '0' : '',
                    isMaterialService ? order.bovedillaQuantity || '0' : '',
                    isMaterialService ? `${order.mallaQuantity || 0}m` : '',
                    isMaterialService ? viguetaDetailsText : ''
                );
            }
            
            bodyRow.push(
                `${order.municipality || ''}\n${order.specificLocation || ''}`,
                phoneCell,
                sellerName
            );

            if (withPrices) {
                const balance = (order.totalAmount || 0) - (order.advancePayment || 0);
                bodyRow.push(
                    formatCurrency(order.totalAmount),
                    formatCurrency(order.advancePayment),
                    formatCurrency(balance)
                );
            }

            tableBody.push(bodyRow);
        });
    });
    
    let columnStyles = {};
    if (withPrices) {
        columnStyles = showMaterialColumns ? {
            0: { cellWidth: 15 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 }, 3: { cellWidth: 10 }, 4: { cellWidth: 15 }, 5: { cellWidth: 15 }, 6: { cellWidth: 15 }, 7: { cellWidth: 40 }, 8: { cellWidth: 30 }, 9: { cellWidth: 20 }, 10: { cellWidth: 15 }, 11: { cellWidth: 18 }, 12: { cellWidth: 18 }, 13: { cellWidth: 18 },
        } : {
            0: { cellWidth: 20 }, 1: { cellWidth: 45 }, 2: { cellWidth: 30 }, 3: { cellWidth: 15 }, 4: { cellWidth: 45 }, 5: { cellWidth: 25 }, 6: { cellWidth: 25 }, 7: { cellWidth: 25 }, 8: { cellWidth: 25 }, 9: { cellWidth: 25 },
        };
    } else {
        columnStyles = showMaterialColumns ? {
            0: { cellWidth: 18 }, 1: { cellWidth: 35 }, 2: { cellWidth: 25 }, 3: { cellWidth: 12 }, 4: { cellWidth: 18 }, 5: { cellWidth: 18 }, 6: { cellWidth: 18 }, 7: { cellWidth: 45 }, 8: { cellWidth: 40 }, 9: { cellWidth: 25 }, 10: { cellWidth: 25 },
        } : {
            0: { cellWidth: 25 }, 1: { cellWidth: 60 }, 2: { cellWidth: 40 }, 3: { cellWidth: 20 }, 4: { cellWidth: 60 }, 5: { cellWidth: 35 }, 6: { cellWidth: 35 },
        };
    }

    const phoneColumnIndex = showMaterialColumns ? (withPrices ? 9 : 9) : (withPrices ? 5 : 5);

    doc.autoTable({
        startY: 40,
        head: head,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133], fontSize: 7 },
        styles: { cellPadding: 2, fontSize: 7, valign: 'middle' },
        columnStyles: columnStyles,
        didParseCell: function (data) {
            if (data.column.index === phoneColumnIndex && data.cell.raw.url) {
                data.cell.styles.textColor = [0, 0, 238];
                data.cell.styles.fontStyle = 'italic';
            }
        },
        willDrawCell: function (data) {
            if (data.column.index === phoneColumnIndex && data.cell.raw.url && data.section === 'body') {
                doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: data.cell.raw.url });
            }
        },
    });

    if (tableBody.length === 0) {
        doc.text('No hay órdenes programadas para el rango y tipo de agenda seleccionados.', 14, doc.autoTable.previous.finalY + 10);
    }

    const fileNameSuffix = withPrices ? 'Administracion' : 'Personal';
    doc.save(`Agenda_${agendaType}_${fileNameSuffix}_${startOfRange.toISOString().split('T')[0]}_a_${endOfRange.toISOString().split('T')[0]}.pdf`);
};
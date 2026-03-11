
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const generateWorksExcel = async (works) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Control de Obras');

  // Define Columns
  worksheet.columns = [
    { header: 'No. Cliente', key: 'clientNumber', width: 15 },
    { header: 'Cliente', key: 'client', width: 25 },
    { header: 'Ubicación', key: 'location', width: 30 },
    { header: 'Servicios', key: 'services', width: 40 },
    { header: 'Fecha Inicio', key: 'startDate', width: 15, style: { alignment: { horizontal: 'center' } } },
    { header: 'Total', key: 'total', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { header: 'Anticipo', key: 'advance', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { header: 'Saldo Pendiente', key: 'balance', width: 15, style: { numFmt: '"$"#,##0.00', font: { color: { argb: 'FFFF0000' } } } },
  ];

  // Header Styling
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Blue header
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  // Add Data
  let totalAmount = 0;
  let totalAdvance = 0;
  let totalBalance = 0;

  // Sort by Date
  const sortedWorks = [...works].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  sortedWorks.forEach((work) => {
    const t = parseFloat(work.total) || 0;
    const a = parseFloat(work.advance) || 0;
    const b = t - a;

    totalAmount += t;
    totalAdvance += a;
    totalBalance += b;

    worksheet.addRow({
      clientNumber: work.clientNumber || '',
      client: work.clientName,
      location: work.location,
      services: work.services,
      startDate: work.startDate ? new Date(work.startDate) : null,
      total: t,
      advance: a,
      balance: b
    });
  });

  // Borders for data rows
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Totals Row
  const totalRow = worksheet.addRow({
    clientNumber: '',
    client: 'TOTALES',
    total: totalAmount,
    advance: totalAdvance,
    balance: totalBalance
  });

  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' } // Light gray
  };
  
  // Merge cells for "TOTALES" label if desired, or just leave in first column
  // worksheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`); 
  // But let's keep it simple in first col since columns are fixed

  // Generate File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(blob, `Control_de_Obras_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.xlsx`);
};

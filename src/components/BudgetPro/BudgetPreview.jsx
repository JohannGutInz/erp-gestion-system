
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { generateBudgetPDF } from './generateBudgetPDF';

export const BudgetPreview = ({ data, onBack }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

  const { contractor, client, services, materials, labor, machinery, totals, folio, date, observations, customTitle } = data;

  const handleDownload = () => {
    generateBudgetPDF(data);
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine if we should show price columns for materials
  // Show columns if AT LEAST ONE material has price enabled
  const showMaterialPrices = materials.length > 0 && materials.some(m => m.hasPrice !== false);

  return (
    <div className="bg-white min-h-screen text-black p-4 md:p-8 animate-in fade-in duration-300">
      {/* Toolbar - Hidden when printing */}
      <div className="print:hidden flex justify-between items-center mb-8 bg-gray-900 p-4 rounded-xl shadow-lg sticky top-4 z-50">
         <Button onClick={onBack} variant="ghost" className="text-white hover:bg-gray-800">
            <ArrowLeft className="mr-2 h-4 w-4" /> Editar
         </Button>
         <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-800">
                <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
         </div>
      </div>

      {/* Printable Area */}
      <div id="printable-budget" className="max-w-[210mm] mx-auto bg-white shadow-none md:shadow-2xl md:p-12 print:shadow-none print:p-0 print:max-w-none">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-blue-800 pb-6">
            <div className="flex gap-4 items-center">
                {contractor.logo && <img src={contractor.logo} alt="Logo" className="h-20 w-auto object-contain" />}
                <div>
                   <h1 className="text-2xl font-bold text-blue-900 uppercase">
                        {customTitle || "PRESUPUESTO DE OBRA"}
                   </h1>
                   <div className="text-sm text-gray-500 mt-1">
                      <p>Folio: <span className="font-mono font-bold text-black text-lg">{folio}</span></p>
                      <p>Fecha: {date}</p>
                   </div>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-xl font-bold text-gray-800">{contractor.companyName}</h2>
                <p className="text-sm text-gray-600">{contractor.responsible}</p>
                <p className="text-sm text-gray-600">{contractor.address}</p>
                <p className="text-sm text-gray-600 font-medium">{contractor.phone}</p>
            </div>
        </div>

        {/* Client */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-blue-900 font-bold mb-3 uppercase text-sm tracking-wider border-b border-gray-200 pb-1">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p><span className="font-semibold">Cliente:</span> {client.name}</p>
                    <p><span className="font-semibold">Teléfono:</span> {client.phone}</p>
                    <p><span className="font-semibold">Email:</span> {client.email}</p>
                </div>
                <div>
                    <p><span className="font-semibold">Ubicación:</span> {client.location}</p>
                    <p><span className="font-semibold">Tipo Proyecto:</span> {client.type}</p>
                    <p><span className="font-semibold">RFC:</span> {client.rfc}</p>
                </div>
            </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
            <div className="mb-8">
                <h3 className="text-blue-900 font-bold mb-3 uppercase text-sm tracking-wider">Servicios Solicitados</h3>
                <div className="flex flex-wrap gap-2">
                    {services.map((s, i) => (
                        <div key={i} className="flex items-center px-3 py-1 bg-blue-50 text-blue-800 text-xs rounded-full border border-blue-100 font-medium">
                            <span>{s.name}</span>
                            {parseFloat(s.price) > 0 && (
                                <span className="ml-1 pl-1 border-l border-blue-200 text-blue-900">
                                    {formatCurrency(s.price)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Materials Table - Conditional Columns */}
        {materials.length > 0 && (
            <div className="mb-6">
                <h3 className="text-blue-900 font-bold mb-2 uppercase text-sm tracking-wider">Materiales</h3>
                <table className="w-full text-sm">
                    <thead className="bg-blue-900 text-white">
                        <tr>
                            <th className="p-2 text-left">Concepto</th>
                            <th className="p-2 text-center">Cant.</th>
                            <th className="p-2 text-center">Unidad</th>
                            {showMaterialPrices && (
                                <>
                                    <th className="p-2 text-right">P. Unitario</th>
                                    <th className="p-2 text-right">Total</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {materials.map((item, i) => (
                            <tr key={i} className="even:bg-gray-50">
                                <td className="p-2">{item.concept}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-center">{item.unit}</td>
                                {showMaterialPrices && (
                                    <>
                                        <td className="p-2 text-right">
                                            {item.hasPrice !== false ? formatCurrency(item.unitPrice) : '-'}
                                        </td>
                                        <td className="p-2 text-right font-medium">
                                            {item.hasPrice !== false ? formatCurrency(item.total) : <span className="text-xs italic text-gray-500">Sin precio</span>}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Labor Table - Standard */}
        {labor.length > 0 && (
            <div className="mb-6">
                <h3 className="text-orange-600 font-bold mb-2 uppercase text-sm tracking-wider">Mano de Obra</h3>
                <table className="w-full text-sm">
                    <thead className="bg-orange-600 text-white">
                        <tr>
                            <th className="p-2 text-left">Concepto / Trabajo</th>
                            <th className="p-2 text-center">Cant.</th>
                            <th className="p-2 text-center">Unidad</th>
                            <th className="p-2 text-right">Precio</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {labor.map((item, i) => (
                            <tr key={i} className="even:bg-gray-50">
                                <td className="p-2">{item.concept}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-center">{item.unit}</td>
                                <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Machinery Table - Standard */}
        {machinery.length > 0 && (
            <div className="mb-6">
                <h3 className="text-purple-700 font-bold mb-2 uppercase text-sm tracking-wider">Maquinaria y Equipo</h3>
                <table className="w-full text-sm">
                    <thead className="bg-purple-700 text-white">
                        <tr>
                            <th className="p-2 text-left">Concepto</th>
                            <th className="p-2 text-center">Cant.</th>
                            <th className="p-2 text-center">Unidad</th>
                            <th className="p-2 text-right">P. Unitario</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {machinery.map((item, i) => (
                            <tr key={i} className="even:bg-gray-50">
                                <td className="p-2">{item.concept}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-center">{item.unit}</td>
                                <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Observations */}
        {observations && (
            <div className="mb-8 mt-8 border-t border-gray-200 pt-4">
                <h4 className="font-bold text-gray-700 mb-2">Observaciones:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{observations}</p>
            </div>
        )}

        {/* Totals Section */}
        <div className="flex justify-end mt-8 page-break-inside-avoid">
            <div className="w-1/2 min-w-[300px]">
                <div className="space-y-2 border-b border-gray-300 pb-2">
                    {totals.services > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Servicios:</span>
                            <span>{formatCurrency(totals.services)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Materiales:</span>
                        <span>{formatCurrency(totals.materials)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Mano de Obra:</span>
                        <span>{formatCurrency(totals.labor)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Maquinaria:</span>
                        <span>{formatCurrency(totals.machinery)}</span>
                    </div>
                </div>

                <div className="py-2 space-y-2">
                    <div className="flex justify-between font-semibold text-gray-800">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(totals.materials + totals.labor + totals.machinery + totals.services)}</span>
                    </div>
                    {totals.iva > 0 && (
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>IVA (16%):</span>
                            <span>{formatCurrency(totals.iva)}</span>
                        </div>
                    )}
                </div>

                <div className="bg-gray-100 p-3 rounded mt-2 border border-gray-200">
                    <div className="flex justify-between font-bold text-lg text-blue-900">
                        <span>TOTAL:</span>
                        <span>{formatCurrency(totals.total)}</span>
                    </div>
                </div>

                {totals.advance > 0 && (
                    <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between text-green-700 font-medium">
                            <span>Anticipo:</span>
                            <span>- {formatCurrency(totals.advance)}</span>
                        </div>
                         <div className="flex justify-between text-red-700 font-bold border-t border-gray-300 pt-1">
                            <span>SALDO PENDIENTE:</span>
                            <span>{formatCurrency(totals.balance)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
            <p className="italic">Este presupuesto es válido por 15 días hábiles a partir de la fecha de emisión.</p>
            <p className="mt-1">Generado por BudgetPro - Sistema de Gestión Profesional</p>
        </div>

      </div>
    </div>
  );
};

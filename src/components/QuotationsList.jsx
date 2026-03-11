import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Edit, Trash2, Calendar, User } from 'lucide-react';
import { generateQuotationPDF } from '@/components/QuotationPDF';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

export const QuotationsList = ({ quotations, sellers, onEdit, onDelete }) => {
  if (!quotations.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No hay cotizaciones registradas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {quotations.map((q) => {
        const seller = sellers.find(s => s.id === q.advisor);
        return (
          <Card key={q.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{q.clientName}</h3>
                  <p className="text-sm text-gray-400">{q.location || 'Sin ubicación'}</p>
                </div>
                <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
                  {q.serviceType}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                <div className="flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-gray-500" />
                   <span>{new Date(q.date).toLocaleDateString('es-MX')}</span>
                </div>
                <div className="flex items-center gap-2">
                   <User className="w-4 h-4 text-gray-500" />
                   <span>{seller ? seller.name : 'Sin Asesor'}</span>
                </div>
              </div>

              <div className="bg-black/20 p-3 rounded-md mb-4 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500 uppercase">Total</p>
                    <p className="font-bold text-white">{formatCurrency(q.total)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase">Resta</p>
                    <p className={`font-bold ${q.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(q.balance)}
                    </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => onDelete(q.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(q)} className="border-gray-700">
                    <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button size="sm" onClick={() => generateQuotationPDF(q, sellers)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const WorksTable = ({ works, onEdit, onDelete, isLoading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    let classes = "bg-gray-100 text-gray-800";
    if (status === 'En Proceso') classes = "bg-green-100 text-green-800 border-green-200";
    if (status === 'Pausa') classes = "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (status === 'Terminado') classes = "bg-blue-100 text-blue-800 border-blue-200";

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${classes}`}>
        {status || 'En Proceso'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay obras registradas</p>
          <p className="text-sm">Agrega una nueva obra para comenzar a gestionar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-200 uppercase bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4">Estatus</th>
              <th className="px-6 py-4">No. Cliente</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Ubicación</th>
              <th className="px-6 py-4 w-1/4">Servicios</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-right">Anticipo</th>
              <th className="px-6 py-4 text-right">Saldo</th>
              <th className="px-6 py-4 text-center">Fecha Inicio</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {works.map((work) => {
               const balance = (parseFloat(work.total) || 0) - (parseFloat(work.advance) || 0);
               return (
                <tr key={work.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    {getStatusBadge(work.estatus)}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400">{work.clientNumber || '-'}</td>
                  <td className="px-6 py-4 font-medium text-white">{work.clientName}</td>
                  <td className="px-6 py-4">{work.location}</td>
                  <td className="px-6 py-4 truncate max-w-xs" title={work.services}>
                    {work.services}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                    {formatCurrency(work.total)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-400">
                    {formatCurrency(work.advance)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-400 font-bold">
                    {formatCurrency(balance)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {formatDate(work.startDate)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(work)}
                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(work.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const SellersDashboard = ({ sellers, stats, onEdit, onDelete }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="glass-effect border-gray-800">
        <CardHeader>
          <CardTitle>Control de Ventas por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {stats && stats.map(stat => (
              <div key={stat.name} className="glass-effect rounded-lg p-4 border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">{stat.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-400">{stat.totalOrders}</div>
                    <div className="text-gray-400">Órdenes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{stat.totalM2Colado}</div>
                    <div className="text-gray-400">m² Colados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{stat.totalM2Material}</div>
                    <div className="text-gray-400">m² Materiales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{stat.totalM2Colado + stat.totalM2Material}</div>
                    <div className="text-gray-400">Total m²</div>
                  </div>
                </div>

                {stat.sales.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Ventas Recientes:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {stat.sales.map((sale, index) => (
                            <div key={index} className="text-xs bg-gray-800/50 p-2 rounded-md flex justify-between">
                                <div>
                                    <p className="font-medium text-white">{sale.client}</p>
                                    <p className="text-gray-400">{sale.quantity}m² de {sale.serviceType === 'colado' ? 'Colado' : 'Material'}</p>
                                </div>
                                <p className="text-gray-400">{new Date(sale.date).toLocaleDateString('es-ES')}</p>
                            </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-gray-800">
        <CardHeader>
          <CardTitle>Vendedores Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sellers.map(seller => (
              <div key={seller.id} className="flex items-center justify-between p-3 glass-effect rounded-lg border border-gray-800">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-white">{seller.name}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <div className="flex items-center space-x-1"><Phone className="w-3 h-3" /><span>{seller.phone}</span></div>
                      {seller.email && <div className="flex items-center space-x-1"><Mail className="w-3 h-3" /><span>{seller.email}</span></div>}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="icon" variant="outline" onClick={() => onEdit(seller)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente al vendedor "{seller.name}" de los servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(seller.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
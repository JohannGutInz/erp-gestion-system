import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { OrderCard } from '@/components/OrderCard';

export const OrdersList = ({ orders, sellers, onEdit, onDelete, onStatusChange }) => {
  if (orders.length === 0) {
    return (
      <Card className="glass-effect border-gray-800">
        <CardContent className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No hay órdenes registradas</p>
          <p className="text-gray-500">Crea tu primera orden para comenzar</p>
        </CardContent>
      </Card>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };


  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {orders.map(order => (
        <motion.div key={order.id} variants={item}>
          <OrderCard
            order={order}
            sellers={sellers}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
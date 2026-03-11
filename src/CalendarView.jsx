import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/OrderCard';
import { X, Calendar as CalendarIcon, Package, Droplets, Truck } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

const getServiceIcon = (serviceType) => {
    switch(serviceType) {
        case 'colado': return <Package className="w-3 h-3 flex-shrink-0 text-blue-400" />;
        case 'impermeabilizacion':
        case 'impermeabilizacion_otro':
             return <Droplets className="w-3 h-3 flex-shrink-0 text-green-400" />;
        case 'envio': return <Truck className="w-3 h-3 flex-shrink-0 text-yellow-400" />;
        default: return <Package className="w-3 h-3 flex-shrink-0" />;
    }
};

const DayContent = ({ date, orders }) => {
  const dayNumber = format(date, 'd');
  return (
    <div className="w-full h-full p-2 flex flex-col text-left relative">
      <span className="font-semibold">{dayNumber}</span>
      {orders.length > 0 && (
        <div className="mt-1 space-y-1 overflow-hidden text-xs">
          {orders.slice(0, 2).map(order => (
            <div key={order.id} className="flex items-center gap-1 bg-gray-500/20 px-1 rounded-sm truncate">
              {getServiceIcon(order.serviceType)}
              <span className="truncate">{order.clientName}</span>
            </div>
          ))}
          {orders.length > 2 && (
            <div className="text-indigo-400 font-bold">
              + {orders.length - 2} más...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CalendarView = ({ getOrdersForDate, handleEditOrder, handleDeleteOrder, updateOrderStatus, sellers }) => {
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const ordersByDay = useMemo(() => {
    const map = new Map();
    // Assuming getOrdersForDate(null) returns all orders for the current context
    const allOrders = getOrdersForDate(null);
    allOrders.forEach(order => {
        if (order.date) {
            const dateObj = new Date(order.date);
            const dateStr = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr).push(order);
        }
    });
    return map;
  }, [getOrdersForDate, month]);

  const modifiers = {
    hasEvents: Array.from(ordersByDay.keys()).map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    })
  };

  const modifiersClassNames = {
    hasEvents: 'has-events',
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const orders = getOrdersForDate(day);
    setSelectedDay({ date: day, orders });
  };
  
  const footer = (
    <div className="text-center text-gray-400 text-sm mt-2">
      Los días con eventos están marcados en azul.
    </div>
  );

  return (
    <div className="relative">
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="glass-effect rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-6 shadow-glow border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-indigo-400" />
                  Órdenes para el {selectedDay.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="overflow-y-auto space-y-4 pr-2">
                {selectedDay.orders.length > 0 ? (
                  selectedDay.orders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        sellers={sellers}
                        onEdit={handleEditOrder}
                        onDelete={handleDeleteOrder}
                        onStatusChange={updateOrderStatus}
                        onCloseDialog={() => setSelectedDay(null)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>No hay órdenes agendadas para este día.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-effect rounded-2xl p-6"
      >
        <Calendar
            mode="single"
            selected={selectedDay?.date}
            onSelect={handleDayClick}
            month={month}
            onMonthChange={setMonth}
            className="p-0"
            classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center',
                month: 'space-y-4 w-full',
                caption_label: 'text-2xl font-bold text-white capitalize',
                nav_button: 'h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100 text-white border-gray-700 hover:bg-gray-800',
                table: 'w-full border-collapse mt-6',
                head_row: 'flex',
                head_cell:'w-full text-center font-semibold text-gray-400 pb-3',
                row: 'flex w-full mt-2',
                cell: 'p-0 h-32 w-full text-center text-sm relative focus-within:relative focus-within:z-20',
                day: 'w-full h-full p-0 border border-gray-800 text-white transition-colors hover:bg-gray-800/50 rounded-md',
                day_today: 'bg-indigo-500/10 text-indigo-400 font-bold',
                day_outside: 'text-muted-foreground opacity-40 bg-gray-900/50',
                day_selected: 'bg-indigo-600 text-white hover:bg-indigo-700 ring-2 ring-indigo-400',
            }}
            components={{
              DayContent: ({ date }) => <DayContent date={date} orders={getOrdersForDate(date)} />
            }}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            locale={es}
            footer={footer}
        />
      </motion.div>
    </div>
  );
};
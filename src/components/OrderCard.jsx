import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Clock, Phone, User, TrendingUp, Edit, Trash2, Check, AlertTriangle, DollarSign, ArrowDown, ArrowUp, Zap, Droplets, Box, Grid } from 'lucide-react';

const getStatusInfo = (status) => {
  switch (status) {
    case 'pending': return { text: 'Pendiente', className: 'status-pending' };
    case 'in-progress': return { text: 'En Proceso', className: 'status-in-progress' };
    case 'completed': return { text: 'Completado', className: 'status-completed' };
    default: return { text: 'Desconocido', className: 'status-pending' };
  }
};

const getServiceInfo = (serviceType) => {
  switch (serviceType) {
    case 'colado': return { text: 'Colado Completo', icon: Package };
    case 'envio': return { text: 'Envío de Material', icon: Package };
    case 'impermeabilizacion': return { text: 'Impermeabilizante Completo', icon: Droplets };
    case 'impermeabilizacion_otro': return { text: 'Impermeabilizante Otro', icon: Droplets };
    default: return { text: 'Servicio Desconocido', icon: Package };
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(amount || 0);
};

export const OrderCard = ({ order, sellers, onEdit, onDelete, onStatusChange, onCloseDialog }) => {
  const { text: statusText, className: statusClassName } = getStatusInfo(order.status);
  const { text: serviceText, icon: ServiceIcon } = getServiceInfo(order.serviceType);
  
  const handleEdit = () => {
    if (onCloseDialog) onCloseDialog();
    onEdit(order);
  };

  const handleStatusChange = async (newStatus) => {
    if (onStatusChange) {
      await onStatusChange(order.id, newStatus);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(order.id);
    }
  };

  const hasFinancials = typeof order.totalAmount === 'number';
  const balance = (order.totalAmount || 0) - (order.advancePayment || 0);
  const showMaterialDetails = order.serviceType === 'colado' || order.serviceType === 'envio';

  return (
    <Card className="glass-effect border-gray-800 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-white">{order.clientName}</h3>
              <Badge className={`status-badge ${statusClassName}`}>{statusText}</Badge>
              {order.noteNumber && (
                <Badge variant="outline" className="border-amber-500 text-amber-500">
                  Nota: {order.noteNumber}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-gray-300 text-sm">
              <InfoItem icon={ServiceIcon} text={serviceText} />
              <InfoItem icon={MapPin} text={order.municipality || 'No especificado'} />
              <InfoItem 
                icon={Clock} 
                text={new Date(order.date).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  timeZone: 'UTC' 
                })} 
              />
              <InfoItem icon={Phone} text={order.phone || 'No especificado'} />
              <InfoItem 
                icon={User} 
                text={sellers.find(s => s.id === order.seller)?.name || 'Vendedor no encontrado'} 
              />
              <InfoItem icon={TrendingUp} text={`${order.quantity || 0} m²`} />
            </div>

            {showMaterialDetails && (
              <div className="border-t border-gray-800 pt-3 mt-3">
                <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                  Detalles de Materiales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-gray-300 text-sm">
                  {order.viguetaType && (
                    <InfoItem icon={Zap} text={`Vigueta: ${order.viguetaType.toUpperCase()}`} />
                  )}
                  {order.bovedillaQuantity && (
                    <InfoItem icon={Box} text={`Bovedilla: ${order.bovedillaQuantity}`} />
                  )}
                  {order.bovedillaCierreQuantity && (
                    <InfoItem icon={Box} text={`Bov. Cierre: ${order.bovedillaCierreQuantity}`} />
                  )}
                  {order.mallaQuantity && (
                    <InfoItem icon={Grid} text={`Malla: ${order.mallaQuantity} m`} />
                  )}
                </div>
              </div>
            )}

            {hasFinancials && (
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-b border-gray-800 py-2 my-2">
                <FinancialInfoItem 
                  icon={DollarSign} 
                  label="Total" 
                  value={formatCurrency(order.totalAmount)} 
                  color="text-amber-400" 
                />
                <FinancialInfoItem 
                  icon={ArrowDown} 
                  label="Anticipo" 
                  value={formatCurrency(order.advancePayment)} 
                  color="text-emerald-400" 
                />
                <FinancialInfoItem 
                  icon={ArrowUp} 
                  label="Saldo" 
                  value={formatCurrency(balance)} 
                  color="text-red-400" 
                />
              </div>
            )}

            {order.specificLocation && (
              <p className="text-gray-400 text-sm">
                <strong>Ubicación:</strong> {order.specificLocation}
              </p>
            )}
            {order.notes && (
              <p className="text-gray-400 text-sm">
                <strong>Notas:</strong> {order.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-2 self-start">
            <div className="flex space-x-2">
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="destructive" 
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {order.status === 'pending' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('in-progress')} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <AlertTriangle className="w-4 h-4 mr-2" /> Iniciar
              </Button>
            )}
            {order.status === 'in-progress' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('completed')} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" /> Completar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InfoItem = ({ icon: Icon, text }) => (
  <div className="flex items-center space-x-2">
    <Icon className="w-4 h-4 text-gray-500" />
    <span>{text}</span>
  </div>
);

const FinancialInfoItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center space-x-1">
      <Icon className={`w-3 h-3 ${color}`} />
      <span className="text-gray-400">{label}</span>
    </div>
    <span className={`font-semibold ${color}`}>{value}</span>
  </div>
);
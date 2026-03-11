
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export const WorkForm = ({ isOpen, onClose, onSave, initialData }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientNumber: '',
    clientName: '',
    location: '',
    services: '',
    total: '',
    advance: '',
    startDate: new Date().toISOString().split('T')[0],
    estatus: 'En Proceso'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        clientNumber: initialData.clientNumber || '',
        clientName: initialData.clientName || '',
        location: initialData.location || '',
        services: initialData.services || '',
        total: initialData.total || '',
        advance: initialData.advance || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        estatus: initialData.estatus || 'En Proceso'
      });
    } else {
      setFormData({
        clientNumber: '',
        clientName: '',
        location: '',
        services: '',
        total: '',
        advance: '',
        startDate: new Date().toISOString().split('T')[0],
        estatus: 'En Proceso'
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setFormData(prev => ({ ...prev, estatus: value }));
  };

  const calculateBalance = () => {
    const total = parseFloat(formData.total) || 0;
    const advance = parseFloat(formData.advance) || 0;
    return total - advance;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.total) {
      toast({
        title: "Error de validación",
        description: "Por favor completa los campos requeridos (Cliente y Total).",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      toast({
        title: "Éxito",
        description: `Obra ${initialData ? 'actualizada' : 'registrada'} correctamente.`,
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la obra.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? 'Editar Obra' : 'Nueva Obra'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="clientNumber" className="text-gray-200">Número de Cliente</Label>
                <Input
                  id="clientNumber"
                  name="clientNumber"
                  value={formData.clientNumber}
                  onChange={handleChange}
                  placeholder="Ej. 12345"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="estatus" className="text-gray-200">Estatus</Label>
                <Select value={formData.estatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Seleccionar estatus" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="En Proceso">En Proceso</SelectItem>
                        <SelectItem value="Pausa">Pausa</SelectItem>
                        <SelectItem value="Terminado">Terminado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-gray-200">Nombre del Cliente *</Label>
            <Input
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-gray-200">Ubicación de la Obra</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ej. Col. Centro, Calle 5"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="services" className="text-gray-200">Servicios</Label>
            <Textarea
              id="services"
              name="services"
              value={formData.services}
              onChange={handleChange}
              placeholder="Descripción de los trabajos a realizar..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total" className="text-gray-200">Total Presupuesto *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="total"
                  name="total"
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white pl-7 placeholder:text-gray-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance" className="text-gray-200">Anticipo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="advance"
                  name="advance"
                  type="number"
                  step="0.01"
                  value={formData.advance}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white pl-7 placeholder:text-gray-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-gray-200">Saldo Pendiente</Label>
                <div className="p-2 bg-gray-800/50 border border-gray-700 rounded text-right font-mono font-bold text-red-400">
                    {formatCurrency(calculateBalance())}
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="startDate" className="text-gray-200">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white"
                />
             </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Guardando...' : 'Guardar Obra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

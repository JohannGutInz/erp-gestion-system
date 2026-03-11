import React, { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const SERVICE_TYPES = [
  "COLADO COMPLETO V11",
  "COLADO COMPLETO V16",
  "PAQUETE VIGUETA V11",
  "PAQUETE VIGUETA V16",
  "MANTENIMIENTO DE IMPERMEABILIZACION",
  "FABRICACION DE COCHERAS"
];

const INITIAL_STATE = {
  clientName: '',
  location: '',
  serviceType: '',
  m2: '',
  price: '',
  total: '',
  advance: '',
  balance: '',
  date: new Date().toISOString().split('T')[0],
  scheduledDate: '',
  advisor: '',
  specs: ''
};

export const QuotationForm = ({ isOpen, setIsOpen, onSave, sellers, editingQuotation }) => {
  const [form, setForm] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingQuotation) {
      setForm({
        ...INITIAL_STATE,
        ...editingQuotation,
      });
    } else {
      setForm(INITIAL_STATE);
    }
  }, [editingQuotation, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm(prev => {
      const newState = { ...prev, [id]: value };
      
      if (id === 'm2' || id === 'price' || id === 'advance') {
        const m2 = parseFloat(id === 'm2' ? value : prev.m2) || 0;
        const price = parseFloat(id === 'price' ? value : prev.price) || 0;
        const advance = parseFloat(id === 'advance' ? value : prev.advance) || 0;
        
        const total = m2 * price;
        newState.total = total;
        newState.balance = total - advance;
      }
      if (id === 'total') {
        const total = parseFloat(value) || 0;
        const advance = parseFloat(prev.advance) || 0;
        newState.balance = total - advance;
      }

      return newState;
    });
  };

  const handleSelectChange = (id, value) => {
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.clientName?.trim()) {
      toast({ 
        title: "Campos incompletos", 
        description: "El nombre del cliente es obligatorio.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!form.serviceType) {
      toast({ 
        title: "Campos incompletos", 
        description: "Selecciona un tipo de servicio.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!form.total || parseFloat(form.total) === 0) {
      toast({ 
        title: "Campos incompletos", 
        description: "El total debe ser mayor a cero.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await onSave(form);
      
      if (result && result.success !== false) {
        setIsOpen(false);
        setForm(INITIAL_STATE);
      }
    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast({
        title: "Error al guardar",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingQuotation ? 'Editar Cotización' : 'Nueva Cotización'}
        </DialogTitle>
      </DialogHeader>
      
      <form id="quotation-form" onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Nombre del Cliente *</Label>
          <Input 
            id="clientName" 
            value={form.clientName} 
            onChange={handleChange} 
            placeholder="Ej. Juan Pérez" 
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input 
            id="location" 
            value={form.location} 
            onChange={handleChange} 
            placeholder="Ej. Col. Centro, Hermosillo" 
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serviceType">Tipo de Servicio *</Label>
            <Select 
              value={form.serviceType} 
              onValueChange={(v) => handleSelectChange('serviceType', v)}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="advisor">Asesor</Label>
            <Select 
              value={form.advisor} 
              onValueChange={(v) => handleSelectChange('advisor', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {sellers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha de Cotización</Label>
            <Input 
              id="date" 
              type="date" 
              value={form.date} 
              onChange={handleChange} 
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Fecha Programada</Label>
            <Input 
              id="scheduledDate" 
              type="date" 
              value={form.scheduledDate} 
              onChange={handleChange} 
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50 space-y-4">
          <h4 className="text-sm font-semibold text-indigo-400">Detalles Financieros</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="m2">Cantidad M²</Label>
              <Input 
                id="m2" 
                type="number" 
                step="0.01"
                value={form.m2} 
                onChange={handleChange} 
                placeholder="0" 
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Precio Unitario</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                value={form.price} 
                onChange={handleChange} 
                placeholder="$0.00" 
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="total">Total *</Label>
              <Input 
                id="total" 
                type="number" 
                step="0.01"
                value={form.total} 
                onChange={handleChange} 
                placeholder="$0.00" 
                className="border-indigo-500/50" 
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="advance">Anticipo</Label>
              <Input 
                id="advance" 
                type="number" 
                step="0.01"
                value={form.advance} 
                onChange={handleChange} 
                placeholder="$0.00" 
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-800">
            <div className="text-right">
              <span className="text-sm text-gray-400">Resta por Pagar: </span>
              <span className="text-lg font-bold text-white">
                ${(parseFloat(form.balance) || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specs">Especificaciones Adicionales</Label>
          <Textarea 
            id="specs" 
            value={form.specs} 
            onChange={handleChange} 
            placeholder="Detalles específicos del trabajo..." 
            rows={3} 
            disabled={isSubmitting}
          />
        </div>
      </form>

      <DialogFooter className="mt-6">
        <Button 
          variant="outline" 
          type="button" 
          onClick={() => setIsOpen(false)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          form="quotation-form" 
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Cotización'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
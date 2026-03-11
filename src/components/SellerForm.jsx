import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const INITIAL_FORM_STATE = { name: '', phone: '', email: '' };

export const SellerForm = ({ isOpen, setIsOpen, addSeller, updateSeller, editingSeller, setEditingSeller }) => {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingSeller) {
      setFormState(editingSeller);
    } else {
      setFormState(INITIAL_FORM_STATE);
    }
  }, [editingSeller, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formState.name?.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formState.phone?.trim()) {
      toast({
        title: "Error",
        description: "El teléfono es obligatorio.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let result;
      if (editingSeller) {
        result = await updateSeller(formState);
      } else {
        result = await addSeller(formState);
      }
      
      if (result && result.success !== false) {
        closeDialog();
      }
    } catch (error) {
      console.error('Error submitting seller:', error);
      toast({
        title: "Error al guardar",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeDialog = () => {
    setIsOpen(false);
    setEditingSeller(null);
    setFormState(INITIAL_FORM_STATE);
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="dialog-content-class">
      <DialogHeader>
        <DialogTitle>
          {editingSeller ? 'Editar Vendedor' : 'Agregar Nuevo Vendedor'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input 
            id="name" 
            value={formState.name} 
            onChange={handleChange} 
            required 
            placeholder="Ej. Juan Pérez"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono *</Label>
          <Input 
            id="phone" 
            value={formState.phone} 
            onChange={handleChange} 
            required 
            placeholder="662-123-4567"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="email">Email (Opcional)</Label>
          <Input 
            id="email" 
            type="email" 
            value={formState.email} 
            onChange={handleChange} 
            placeholder="vendedor@empresa.com"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={closeDialog}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Guardando...' 
              : editingSeller 
                ? 'Actualizar Vendedor' 
                : 'Agregar Vendedor'
            }
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};
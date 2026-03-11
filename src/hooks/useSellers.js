import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const DEFAULT_SELLERS = [
  { id: '1', name: 'Juan Pérez', phone: '662-123-4567', email: 'juan@empresa.com' },
  { id: '2', name: 'María González', phone: '662-234-5678', email: 'maria@empresa.com' }
];

export const useSellers = (toast, orders) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('construction-sellers', JSON.stringify(data));
    } catch (error) {
      console.error("Error saving sellers to localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const savedSellers = localStorage.getItem('construction-sellers');
        if (savedSellers) {
          setSellers(JSON.parse(savedSellers));
        } else {
          setSellers(DEFAULT_SELLERS);
          syncToLocalStorage(DEFAULT_SELLERS);
        }
      } catch (error) {
        console.error("Failed to load sellers from localStorage", error);
        setSellers(DEFAULT_SELLERS);
      } finally {
        setLoading(false);
      }
    }
  }, [syncToLocalStorage]);

  const fetchSellers = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sellers:', error);
        toast({
          title: "Error al cargar vendedores",
          description: error.message || "No se pudieron cargar los vendedores.",
          variant: "destructive"
        });
        setSellers(DEFAULT_SELLERS);
      } else {
        setSellers(data && data.length > 0 ? data : DEFAULT_SELLERS);
      }
    } catch (err) {
      console.error('Unexpected error fetching sellers:', err);
      setSellers(DEFAULT_SELLERS);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      fetchSellers();

      const channel = supabase.channel('realtime-sellers')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'sellers' 
        }, () => {
          fetchSellers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchSellers]);

  const addSeller = useCallback(async (seller) => {
    const newSeller = {
      ...seller,
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured || !supabase) {
      setSellers(prev => {
        const newSellers = [...prev, { ...newSeller, id: Date.now().toString() }];
        syncToLocalStorage(newSellers);
        return newSellers;
      });
      toast({
        title: "¡Vendedor agregado!",
        description: "Guardado localmente (sin conexión a Supabase).",
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('sellers')
        .insert([newSeller])
        .select()
        .single();

      if (error) {
        console.error('Error adding seller:', error);
        toast({
          title: "Error al agregar vendedor",
          description: error.message || "No se pudo agregar el vendedor.",
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({
        title: "¡Vendedor agregado!",
        description: "Nuevo vendedor registrado en el sistema.",
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error adding seller:', err);
      toast({
        title: "Error inesperado",
        description: "No se pudo agregar el vendedor.",
        variant: "destructive"
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const updateSeller = useCallback(async (updatedSeller) => {
    if (!isSupabaseConfigured || !supabase) {
      setSellers(prev => {
        const newSellers = prev.map(s => s.id === updatedSeller.id ? updatedSeller : s);
        syncToLocalStorage(newSellers);
        return newSellers;
      });
      toast({ 
        title: "Vendedor actualizado", 
        description: "Actualizado localmente." 
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('sellers')
        .update(updatedSeller)
        .eq('id', updatedSeller.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating seller:', error);
        toast({
          title: "Error al actualizar vendedor",
          description: error.message || "No se pudo actualizar el vendedor.",
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({ 
        title: "Vendedor actualizado", 
        description: "Los datos han sido guardados." 
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating seller:', err);
      toast({
        title: "Error inesperado",
        description: "No se pudo actualizar el vendedor.",
        variant: "destructive"
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const deleteSeller = useCallback(async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setSellers(prev => {
        const newSellers = prev.filter(s => s.id !== id);
        syncToLocalStorage(newSellers);
        return newSellers;
      });
      toast({ 
        title: "Vendedor eliminado", 
        description: "Eliminado localmente.", 
        variant: "destructive" 
      });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('sellers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting seller:', error);
        toast({
          title: "Error al eliminar vendedor",
          description: error.message || "No se pudo eliminar el vendedor.",
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({ 
        title: "Vendedor eliminado", 
        description: "El vendedor ha sido removido del sistema.", 
        variant: "destructive" 
      });
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting seller:', err);
      toast({
        title: "Error inesperado",
        description: "No se pudo eliminar el vendedor.",
        variant: "destructive"
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const getSellerStats = useCallback(() => {
    const stats = {};
    
    sellers.forEach(seller => {
      stats[seller.id] = {
        id: seller.id,
        name: seller.name,
        totalOrders: 0,
        totalM2Colado: 0,
        totalM2Material: 0,
        sales: []
      };
    });

    if (orders && Array.isArray(orders)) {
      orders.forEach(order => {
        if (order.seller && stats[order.seller]) {
          stats[order.seller].totalOrders++;
          const quantity = parseFloat(order.quantity) || 0;
          
          if (order.serviceType === 'colado') {
            stats[order.seller].totalM2Colado += quantity;
          } else if (order.serviceType === 'envio') {
            stats[order.seller].totalM2Material += quantity;
          }
          
          stats[order.seller].sales.push({
            id: order.id,
            date: order.date,
            client: order.clientName,
            quantity: quantity,
            serviceType: order.serviceType
          });
        }
      });
    }
    
    Object.values(stats).forEach(sellerStat => {
      sellerStat.sales.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return Object.values(stats);
  }, [sellers, orders]);

  return { 
    sellers, 
    addSeller, 
    updateSeller, 
    deleteSeller, 
    getSellerStats, 
    loading 
  };
};
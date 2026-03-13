import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const useOrders = (toast) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('construction-orders', JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const localData = localStorage.getItem('construction-orders');
        setOrders(localData ? JSON.parse(localData) : []);
      } catch (error) {
        console.error("Error loading from localStorage", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
  }, []);
  
  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error al cargar órdenes",
          description: error.message || "No se pudieron cargar las órdenes.",
          variant: "destructive"
        });
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching orders:', err);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar las órdenes.",
        variant: "destructive"
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      fetchOrders();
      
      const channel = supabase.channel('realtime-orders')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchOrders]);
  
  const addOrder = useCallback(async (order) => {
    const newOrder = { 
      ...order,
      created_at: new Date().toISOString(),
      viguetaDetails: order.viguetaDetails || []
    };

    if (!isSupabaseConfigured || !supabase) {
      setOrders(prev => {
        const newOrders = [{...newOrder, id: Date.now().toString()}, ...prev];
        syncToLocalStorage(newOrders);
        return newOrders;
      });
      toast({ 
        title: "¡Orden creada!", 
        description: "Guardada localmente (sin conexión a Supabase)." 
      });
      return { success: true };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('orders')
        .insert([{ ...newOrder, created_by: user?.id }])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding order:', error);
        toast({ 
          title: "Error al crear orden", 
          description: error.message || "No se pudo crear la orden.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }
      
      toast({ 
        title: "¡Orden creada!", 
        description: "Nueva orden agregada al sistema." 
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error adding order:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo crear la orden.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const updateOrder = useCallback(async (updatedOrder) => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(prev => {
        const newOrders = prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        syncToLocalStorage(newOrders);
        return newOrders;
      });
      toast({ 
        title: "¡Orden actualizada!", 
        description: "Actualizada localmente." 
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updatedOrder)
        .eq('id', updatedOrder.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating order:', error);
        toast({ 
          title: "Error al actualizar orden", 
          description: error.message || "No se pudo actualizar la orden.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }
      
      toast({ 
        title: "¡Orden actualizada!", 
        description: "La orden se ha actualizado correctamente." 
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating order:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo actualizar la orden.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const deleteOrder = useCallback(async (orderId) => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(prev => {
        const newOrders = prev.filter(o => o.id !== orderId);
        syncToLocalStorage(newOrders);
        return newOrders;
      });
      toast({ 
        title: "Orden eliminada", 
        description: "Eliminada localmente.", 
        variant: "destructive" 
      });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (error) {
        console.error('Error deleting order:', error);
        toast({ 
          title: "Error al eliminar orden", 
          description: error.message || "No se pudo eliminar la orden.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }
      
      toast({ 
        title: "Orden eliminada", 
        description: "La orden ha sido eliminada del sistema.", 
        variant: "destructive" 
      });
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting order:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo eliminar la orden.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(prev => {
        const newOrders = prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        );
        syncToLocalStorage(newOrders);
        return newOrders;
      });
      toast({ 
        title: "Estado actualizado", 
        description: "Actualizado localmente." 
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating status:', error);
        toast({ 
          title: "Error al actualizar estado", 
          description: error.message || "No se pudo actualizar el estado.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }
      
      toast({ 
        title: "Estado actualizado", 
        description: "El estado de la orden ha sido actualizado." 
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating status:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo actualizar el estado.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);
  
  const getOrders = useCallback(({ date, serviceType, allForMonth } = {}) => {
    let filteredOrders = [...orders];
    
    if (serviceType && serviceType !== 'all') {
      if (serviceType === 'impermeabilizacion') {
        filteredOrders = filteredOrders.filter(order => 
          order.serviceType === 'impermeabilizacion' || 
          order.serviceType === 'impermeabilizacion_otro'
        );
      } else {
        filteredOrders = filteredOrders.filter(order => 
          order.serviceType === serviceType
        );
      }
    }

    if (date) {
      if (!(date instanceof Date) || isNaN(date)) return [];
      const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      
      return filteredOrders.filter(order => {
        if (!order.date) return false;
        const orderDate = new Date(order.date);
        const orderDateUTC = new Date(Date.UTC(
          orderDate.getUTCFullYear(), 
          orderDate.getUTCMonth(), 
          orderDate.getUTCDate()
        ));
        return orderDateUTC.getTime() === targetDate.getTime();
      });
    }
    
    if (allForMonth) {
      return filteredOrders;
    }

    return filteredOrders;
  }, [orders]);
  
  return { 
    orders, 
    addOrder, 
    updateOrder, 
    deleteOrder, 
    updateOrderStatus, 
    getOrders, 
    loading 
  };
};
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const mapFromDb = (order) => ({
  ...order,
  clientName: order.clients?.name || '',
  phone: order.clients?.phone || '',
  address: order.clients?.address || '',
  noteNumber: order.note_number,
  serviceType: order.service_type,
  totalAmount: Number(order.total_amount) || 0,
  advancePayment: Number(order.advance_payment) || 0,
  specificLocation: order.specific_location || '',
  viguetaType: order.vigueta_type || '',
  bovedillaQuantity: order.bovedilla_quantity,
  bovedillaCierreQuantity: order.bovedilla_cierre_quantity,
  mallaQuantity: order.malla_quantity,
  viguetaDetails: order.vigueta_details || [],
  seller: order.seller_id,
  clients: undefined,
});

const mapToDb = (formData) => ({
  client_id: formData.client_id,
  seller_id: formData.seller,
  date: formData.date,
  status: formData.status,
  note_number: formData.noteNumber || '',
  service_type: formData.serviceType,
  total_amount: Number(formData.totalAmount) || 0,
  advance_payment: Number(formData.advancePayment) || 0,
  balance: Number(formData.balance) || 0,
  quantity: Number(formData.quantity) || 0,
  municipality: formData.municipality || '',
  specific_location: formData.specificLocation || '',
  vigueta_details: formData.viguetaDetails || [],
  vigueta_type: formData.viguetaType || '',
  bovedilla_quantity: Number(formData.bovedillaQuantity) || 0,
  bovedilla_cierre_quantity: Number(formData.bovedillaCierreQuantity) || 0,
  malla_quantity: Number(formData.mallaQuantity) || 0,
  notes: formData.notes || '',
});

export const useOrders = (toast) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncToLocalStorage = useCallback((data) => {
    try { localStorage.setItem('construction-orders', JSON.stringify(data)); }
    catch (error) { console.error('Error saving to localStorage', error); }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const localData = localStorage.getItem('construction-orders');
        setOrders(localData ? JSON.parse(localData) : []);
      } catch (error) { setOrders([]); }
      finally { setLoading(false); }
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, clients(name, phone, address)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching orders:', error);
        toast({ title: 'Error al cargar ordenes', description: error.message, variant: 'destructive' });
        setOrders([]);
      } else {
        setOrders((data || []).map(mapFromDb));
      }
    } catch (err) { console.error(err); setOrders([]); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      fetchOrders();
      const channel = supabase.channel('realtime-orders-' + Date.now())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [fetchOrders]);

  const addOrder = useCallback(async (order) => {
    if (!isSupabaseConfigured || !supabase) {
      const lo = { ...order, id: Date.now().toString(), created_at: new Date().toISOString(), viguetaDetails: order.viguetaDetails || [] };
      setOrders(prev => { const n=[lo,...prev]; syncToLocalStorage(n); return n; });
      toast({ title: 'Orden creada', description: 'Guardada localmente.' });
      return { success: true };
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('orders').insert([{ ...mapToDb(order), created_by: user?.id }]).select('*, clients(name, phone, address)').single();
      if (error) { console.error(error); toast({ title: 'Error al crear orden', description: error.message, variant: 'destructive' }); return { success: false, error }; }
      const mapped = mapFromDb(data);
      setOrders(prev => [mapped, ...prev]);
      toast({ title: 'Orden creada', description: 'Nueva orden agregada al sistema.' });
      return { success: true, data: mapped };
    } catch (err) { console.error(err); toast({ title: 'Error inesperado', description: 'No se pudo crear la orden.', variant: 'destructive' }); return { success: false, error: err }; }
  }, [toast, syncToLocalStorage]);

  const updateOrder = useCallback(async (updatedOrder) => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(prev => { const n=prev.map(o => o.id===updatedOrder.id ? updatedOrder : o); syncToLocalStorage(n); return n; });
      toast({ title: 'Orden actualizada', description: 'Actualizada localmente.' }); return { success: true };
    }
    try {
      const { id } = updatedOrder;
      const { data, error } = await supabase.from('orders').update(mapToDb(updatedOrder)).eq('id', id).select('*, clients(name, phone, address)').single();
      if (error) { console.error(error); toast({ title: 'Error al actualizar orden', description: error.message, variant: 'destructive' }); return { success: false, error }; }
      const mapped = mapFromDb(data);
      setOrders(prev => prev.map(o => o.id===mapped.id ? mapped : o));
      toast({ title: 'Orden actualizada', description: 'La orden se ha actualizado correctamente.' });
      return { success: true, data: mapped };
    } catch (err) { console.error(err); toast({ title: 'Error inesperado', description: 'No se pudo actualizar.', variant: 'destructive' }); return { success: false, error: err }; }
  }, [toast, syncToLocalStorage]);

  const deleteOrder = useCallback(async (orderId) => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(prev => { const n=prev.filter(o => o.id!==orderId); syncToLocalStorage(n); return n; });
      toast({ title: 'Orden eliminada', description: 'Eliminada localmente.', variant: 'destructive' }); return { success: true };
    }
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) { console.error(error); toast({ title: 'Error al eliminar orden', description: error.message, variant: 'destructive' }); return { success: false, error }; }
      setOrders(prev => prev.filter(o => o.id!==orderId));
      toast({ title: 'Orden eliminada', description: 'La orden ha sido eliminada del sistema.', variant: 'destructive' });
      return { success: true };
    } catch (err) { console.error(err); toast({ title: 'Error inesperado', description: 'No se pudo eliminar.', variant: 'destructive' }); return { success: false, error: err }; }
  }, [toast, syncToLocalStorage]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(prev => { const n=prev.map(o => o.id===orderId ? {...o,status:newStatus} : o); syncToLocalStorage(n); return n; });
      toast({ title: 'Estado actualizado', description: 'Actualizado localmente.' }); return { success: true };
    }
    try {
      const { data, error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId).select('*, clients(name, phone, address)').single();
      if (error) { console.error(error); toast({ title: 'Error al actualizar estado', description: error.message, variant: 'destructive' }); return { success: false, error }; }
      const mapped = mapFromDb(data);
      setOrders(prev => prev.map(o => o.id===mapped.id ? mapped : o));
      toast({ title: 'Estado actualizado', description: 'El estado de la orden ha sido actualizado.' });
      return { success: true, data: mapped };
    } catch (err) { console.error(err); toast({ title: 'Error inesperado', description: 'No se pudo actualizar el estado.', variant: 'destructive' }); return { success: false, error: err }; }
  }, [toast, syncToLocalStorage]);

  const getOrders = useCallback(({ date, serviceType, allForMonth } = {}) => {
    let filtered = [...orders];
    if (serviceType && serviceType !== 'all') {
      if (serviceType === 'impermeabilizacion') {
        filtered = filtered.filter(o => o.serviceType==='impermeabilizacion' || o.serviceType==='impermeabilizacion_otro');
      } else { filtered = filtered.filter(o => o.serviceType===serviceType); }
    }
    if (date) {
      if (!(date instanceof Date) || isNaN(date)) return [];
      const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      return filtered.filter(order => {
        if (!order.date) return false;
        const d = new Date(order.date);
        const orderDateUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        return orderDateUTC.getTime() === targetDate.getTime();
      });
    }
    return filtered;
  }, [orders]);

  return { orders, addOrder, updateOrder, deleteOrder, updateOrderStatus, getOrders, loading };
};

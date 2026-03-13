import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const useClients = (toast, companyId) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('construction-clients', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving clients to localStorage', error);
    }
  }, []);

  // Modo offline
  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const localData = localStorage.getItem('construction-clients');
        setClients(localData ? JSON.parse(localData) : []);
      } catch (error) {
        console.error('Error loading clients from localStorage', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const fetchClients = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: 'Error al cargar clientes',
          description: error.message || 'No se pudieron cargar los clientes.',
          variant: 'destructive',
        });
        setClients([]);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching clients:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [toast, companyId]);

  // Suscripción realtime
  useEffect(() => {
    if (isSupabaseConfigured && supabase && companyId) {
      fetchClients();

      const channel = supabase
        .channel('realtime-clients-' + Date.now())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
          fetchClients();
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [fetchClients]);

  const addClient = useCallback(async (client) => {
    const newClient = {
      name: client.name?.trim(),
      phone: client.phone?.trim() || '',
      email: client.email?.trim() || '',
      address: client.address?.trim() || '',
    };

    if (!isSupabaseConfigured || !supabase) {
      const localClient = {
        ...newClient,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      setClients(prev => {
        const updated = [localClient, ...prev];
        syncToLocalStorage(updated);
        return updated;
      });
      toast({ title: '¡Cliente agregado!', description: 'Guardado localmente.' });
      return { success: true, data: localClient };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...newClient, created_by: user?.id, company_id: companyId }])
        .select()
        .single();

      if (error) {
        console.error('Error adding client:', error);
        toast({
          title: 'Error al agregar cliente',
          description: error.message || 'No se pudo agregar el cliente.',
          variant: 'destructive',
        });
        return { success: false, error };
      }

      setClients(prev => [data, ...prev]);
      toast({ title: '¡Cliente agregado!', description: 'Registrado en el sistema.' });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error adding client:', err);
      toast({
        title: 'Error inesperado',
        description: 'No se pudo agregar el cliente.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const updateClient = useCallback(async (updatedClient) => {
    if (!isSupabaseConfigured || !supabase) {
      setClients(prev => {
        const updated = prev.map(c => c.id === updatedClient.id ? updatedClient : c);
        syncToLocalStorage(updated);
        return updated;
      });
      toast({ title: 'Cliente actualizado', description: 'Actualizado localmente.' });
      return { success: true };
    }

    try {
      const { id, created_at, created_by, ...fields } = updatedClient;
      const { data, error } = await supabase
        .from('clients')
        .update(fields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        toast({
          title: 'Error al actualizar cliente',
          description: error.message || 'No se pudo actualizar el cliente.',
          variant: 'destructive',
        });
        return { success: false, error };
      }

      setClients(prev => prev.map(c => c.id === data.id ? data : c));
      toast({ title: 'Cliente actualizado', description: 'Datos guardados correctamente.' });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating client:', err);
      toast({
        title: 'Error inesperado',
        description: 'No se pudo actualizar el cliente.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const deleteClient = useCallback(async (clientId) => {
    if (!isSupabaseConfigured || !supabase) {
      setClients(prev => {
        const updated = prev.filter(c => c.id !== clientId);
        syncToLocalStorage(updated);
        return updated;
      });
      toast({ title: 'Cliente eliminado', description: 'Eliminado localmente.', variant: 'destructive' });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting client:', error);
        toast({
          title: 'Error al eliminar cliente',
          description: error.message || 'No se pudo eliminar el cliente.',
          variant: 'destructive',
        });
        return { success: false, error };
      }

      setClients(prev => prev.filter(c => c.id !== clientId));
      toast({ title: 'Cliente eliminado', description: 'El cliente ha sido eliminado.', variant: 'destructive' });
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting client:', err);
      toast({
        title: 'Error inesperado',
        description: 'No se pudo eliminar el cliente.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  // Filtra por name o phone (case-insensitive)
  const searchClients = useCallback((query) => {
    if (!query?.trim()) return [];
    const q = query.toLowerCase();
    return clients.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }, [clients]);

  return { clients, loading, addClient, updateClient, deleteClient, searchClients };
};

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const useWorks = (toast) => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('works_data', JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  }, []);

  // Modo offline
  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const localData = localStorage.getItem('works_data');
        setWorks(localData ? JSON.parse(localData) : []);
      } catch (error) {
        console.error("Error loading from localStorage", error);
        setWorks([]);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Modo online — fetch desde Supabase
  const fetchWorks = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching works:', error);
        toast({
          title: "Error al cargar obras",
          description: error.message || "No se pudieron cargar las obras.",
          variant: "destructive"
        });
        setWorks([]);
      } else {
        setWorks(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching works:', err);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar las obras.",
        variant: "destructive"
      });
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Suscripción realtime
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      fetchWorks();

      const channel = supabase.channel('realtime-works')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'works'
        }, () => {
          fetchWorks();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchWorks]);

  const addWork = useCallback(async (work) => {
    const newWork = {
      client_number: work.client_number || '',
      client_name: work.client_name,
      location: work.location || '',
      services: work.services || '',
      start_date: work.start_date || '',
      status: work.status || 'En Proceso',
      total: Number(work.total) || 0,
      advance: Number(work.advance) || 0,
      balance: Number(work.balance) || 0,
    };

    if (!isSupabaseConfigured || !supabase) {
      setWorks(prev => {
        const updated = [{ ...newWork, id: Date.now().toString(), created_at: new Date().toISOString() }, ...prev];
        syncToLocalStorage(updated);
        return updated;
      });
      toast({
        title: "¡Obra creada!",
        description: "Guardada localmente (sin conexión a Supabase)."
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('works')
        .insert([newWork])
        .select()
        .single();

      if (error) {
        console.error('Error adding work:', error);
        toast({
          title: "Error al crear obra",
          description: error.message || "No se pudo crear la obra.",
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({
        title: "¡Obra creada!",
        description: "Nueva obra agregada al sistema."
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error adding work:', err);
      toast({
        title: "Error inesperado",
        description: "No se pudo crear la obra.",
        variant: "destructive"
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const updateWork = useCallback(async (updatedWork) => {
    if (!isSupabaseConfigured || !supabase) {
      setWorks(prev => {
        const updated = prev.map(w => w.id === updatedWork.id ? updatedWork : w);
        syncToLocalStorage(updated);
        return updated;
      });
      toast({
        title: "¡Obra actualizada!",
        description: "Actualizada localmente."
      });
      return { success: true };
    }

    try {
      const { id, created_at, created_by, ...fields } = updatedWork;
      const { data, error } = await supabase
        .from('works')
        .update(fields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating work:', error);
        toast({
          title: "Error al actualizar obra",
          description: error.message || "No se pudo actualizar la obra.",
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({
        title: "¡Obra actualizada!",
        description: "La obra se ha actualizado correctamente."
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating work:', err);
      toast({
        title: "Error inesperado",
        description: "No se pudo actualizar la obra.",
        variant: "destructive"
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const deleteWork = useCallback(async (workId) => {
    if (!isSupabaseConfigured || !supabase) {
      setWorks(prev => {
        const updated = prev.filter(w => w.id !== workId);
        syncToLocalStorage(updated);
        return updated;
      });
      toast({
        title: "Obra eliminada",
        description: "Eliminada localmente.",
        variant: "destructive"
      });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', workId);

      if (error) {
        console.error('Error deleting work:', error);
        toast({
          title: "Error al eliminar obra",
          description: error.message || "No se pudo eliminar la obra.",
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({
        title: "Obra eliminada",
        description: "La obra ha sido eliminada del sistema.",
        variant: "destructive"
      });
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting work:', err);
      toast({
        title: "Error inesperado",
        description: "No se pudo eliminar la obra.",
        variant: "destructive"
      });
      return { success: false, error: err };
    }
  }, [toast]);

  const updateWorkStatus = useCallback(async (workId, newStatus) => {
    if (!isSupabaseConfigured || !supabase) {
      setWorks(prev => {
        const updated = prev.map(w => w.id === workId ? { ...w, status: newStatus } : w);
        syncToLocalStorage(updated);
        return updated;
      });
      toast({
        title: "Estado actualizado",
        description: "Actualizado localmente."
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('works')
        .update({ status: newStatus })
        .eq('id', workId)
        .select()
        .single();

      if (error) {
        console.error('Error updating work status:', error);
        toast({
          title: "Error al actualizar estado",
          description: error.message || "No se pudo actualizar el estado.",
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({
        title: "Estado actualizado",
        description: "El estado de la obra ha sido actualizado."
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating work status:', err);
      toast({
        title: "Error inesperado",
        description: "No se pudo actualizar el estado.",
        variant: "destructive"
      });
      return { success: false, error: err };
    }
  }, [toast]);

  return {
    works,
    loading,
    addWork,
    updateWork,
    deleteWork,
    updateWorkStatus,
  };
};

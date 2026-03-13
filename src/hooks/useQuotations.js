import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const useQuotations = (toast, companyId) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('construction-quotations', JSON.stringify(data));
    } catch (error) {
      console.error("Error saving quotations to localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const localData = localStorage.getItem('construction-quotations');
        setQuotations(localData ? JSON.parse(localData) : []);
      } catch (error) {
        console.error("Error loading quotations from localStorage", error);
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotations:', error);
        toast({
          title: "Error al cargar cotizaciones",
          description: error.message || "No se pudieron cargar las cotizaciones.",
          variant: "destructive"
        });
        setQuotations([]);
      } else {
        setQuotations(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching quotations:', err);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [toast, companyId]);

  useEffect(() => {
    if (isSupabaseConfigured && supabase && companyId) {
      fetchQuotations();

      const channel = supabase.channel('realtime-quotations-' + Date.now())
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'quotations' 
        }, () => {
          fetchQuotations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchQuotations]);

  const addQuotation = useCallback(async (quotation) => {
    const newQuotation = { 
      ...quotation, 
      created_at: new Date().toISOString() 
    };

    if (!isSupabaseConfigured || !supabase) {
      setQuotations(prev => {
        const newQuotations = [{ ...newQuotation, id: Date.now().toString() }, ...prev];
        syncToLocalStorage(newQuotations);
        return newQuotations;
      });
      toast({ 
        title: "Cotización Guardada", 
        description: "Guardada localmente (sin conexión a Supabase)." 
      });
      return { success: true };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('quotations')
        .insert([{ ...newQuotation, created_by: user?.id, company_id: companyId }])
        .select()
        .single();

      if (error) {
        console.error('Error adding quotation:', error);
        toast({ 
          title: "Error al guardar cotización", 
          description: error.message || "No se pudo guardar la cotización.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }

      setQuotations(prev => [data, ...prev]);
      toast({
        title: "Cotización Guardada",
        description: "Sincronizada con la nube."
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error adding quotation:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo guardar la cotización.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const updateQuotation = useCallback(async (updatedQuotation) => {
    if (!isSupabaseConfigured || !supabase) {
      setQuotations(prev => {
        const newQuotations = prev.map(q => 
          q.id === updatedQuotation.id ? updatedQuotation : q
        );
        syncToLocalStorage(newQuotations);
        return newQuotations;
      });
      toast({ 
        title: "Actualizada", 
        description: "Cambios guardados localmente." 
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('quotations')
        .update(updatedQuotation)
        .eq('id', updatedQuotation.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating quotation:', error);
        toast({ 
          title: "Error al actualizar cotización", 
          description: error.message || "Falló la actualización.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }

      setQuotations(prev => prev.map(q => q.id === data.id ? data : q));
      toast({
        title: "Actualizada",
        description: "Cambios sincronizados."
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating quotation:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo actualizar la cotización.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const deleteQuotation = useCallback(async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setQuotations(prev => {
        const newQuotations = prev.filter(q => q.id !== id);
        syncToLocalStorage(newQuotations);
        return newQuotations;
      });
      toast({ 
        title: "Eliminada", 
        description: "Cotización borrada localmente." 
      });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting quotation:', error);
        toast({ 
          title: "Error al eliminar cotización", 
          description: error.message || "No se pudo borrar.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }

      setQuotations(prev => prev.filter(q => q.id !== id));
      toast({
        title: "Eliminada",
        description: "Cotización borrada permanentemente."
      });
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting quotation:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo eliminar la cotización.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  return { 
    quotations, 
    addQuotation, 
    updateQuotation, 
    deleteQuotation, 
    loading 
  };
};
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const useAccounting = (toast, orders, companyId) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('construction-accounting', JSON.stringify(data));
    } catch (error) {
      console.error("Error saving transactions to localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const localData = localStorage.getItem('construction-accounting');
        setTransactions(localData ? JSON.parse(localData) : []);
      } catch (error) {
        console.error("Error loading transactions from localStorage", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error al cargar transacciones",
          description: error.message || "No se pudieron cargar las transacciones.",
          variant: "destructive"
        });
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [toast, companyId]);

  useEffect(() => {
    if (isSupabaseConfigured && supabase && companyId) {
      fetchTransactions();

      const channel = supabase.channel('realtime-transactions-' + Date.now())
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'transactions' 
        }, () => {
          fetchTransactions();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchTransactions]);

  useEffect(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const incomeFromOrders = completedOrders.map(order => ({
      id: `order-${order.id}`,
      type: 'income',
      amount: parseFloat(order.totalAmount) || 0,
      description: `Ingreso de orden: ${order.clientName} (#${order.noteNumber || order.id})`,
      date: order.date,
      isAuto: true,
    }));

    setTransactions(prev => {
      const manualTransactions = prev.filter(t => !t.isAuto);
      const newTransactions = [...manualTransactions, ...incomeFromOrders];
      const uniqueTransactions = Array.from(
        new Map(newTransactions.map(t => [t.id, t])).values()
      );
      
      if (!isSupabaseConfigured) {
        syncToLocalStorage(uniqueTransactions);
      }
      
      return uniqueTransactions;
    });
  }, [orders, syncToLocalStorage]);

  const addTransaction = useCallback(async (transaction) => {
    const newTransaction = { 
      ...transaction, 
      created_at: new Date().toISOString(),
      isAuto: false
    };
    
    if (!isSupabaseConfigured || !supabase) {
      setTransactions(prev => {
        const newTransactions = [
          { ...newTransaction, id: Date.now().toString() }, 
          ...prev
        ];
        syncToLocalStorage(newTransactions);
        return newTransactions;
      });
      toast({ 
        title: "¡Transacción agregada!", 
        description: "Guardada localmente." 
      });
      return { success: true };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...newTransaction, created_by: user?.id, company_id: companyId }])
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        toast({ 
          title: "Error al agregar transacción", 
          description: error.message || "No se pudo agregar.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }

      setTransactions(prev => [data, ...prev]);
      toast({
        title: "¡Transacción agregada!",
        description: "Registrada en el sistema."
      });
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error adding transaction:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo agregar la transacción.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const deleteTransaction = useCallback(async (transactionId) => {
    if (!isSupabaseConfigured || !supabase) {
      setTransactions(prev => {
        const newTransactions = prev.filter(t => t.id !== transactionId);
        syncToLocalStorage(newTransactions);
        return newTransactions;
      });
      toast({ 
        title: "Transacción eliminada", 
        description: "Eliminada localmente.", 
        variant: "destructive" 
      });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        console.error('Error deleting transaction:', error);
        toast({ 
          title: "Error al eliminar transacción", 
          description: error.message || "No se pudo eliminar.", 
          variant: "destructive" 
        });
        return { success: false, error };
      }

      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      toast({
        title: "Transacción eliminada",
        variant: "destructive"
      });
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting transaction:', err);
      toast({ 
        title: "Error inesperado", 
        description: "No se pudo eliminar la transacción.", 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [toast, syncToLocalStorage]);

  const getTransactions = useCallback(() => {
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  const getSummary = useCallback(() => {
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
    };
    
    transactions.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        summary.totalIncome += amount;
      } else {
        summary.totalExpenses += amount;
      }
    });
    
    summary.netProfit = summary.totalIncome - summary.totalExpenses;
    return summary;
  }, [transactions]);

  return { 
    transactions, 
    addTransaction, 
    deleteTransaction, 
    getTransactions, 
    getSummary, 
    loading 
  };
};
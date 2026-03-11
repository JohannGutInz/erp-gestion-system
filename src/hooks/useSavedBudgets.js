import { useState, useEffect } from 'react';

export const useSavedBudgets = () => {
  const [savedBudgets, setSavedBudgets] = useState([]);

  useEffect(() => {
    refreshBudgets();
  }, []);

  const refreshBudgets = () => {
    try {
        const stored = localStorage.getItem('budget_pro_saves');
        if (stored) {
          setSavedBudgets(JSON.parse(stored));
        } else {
            setSavedBudgets([]);
        }
    } catch(e) {
        console.error("Error loading budgets", e);
        setSavedBudgets([]);
    }
  };

  const saveBudget = (budgetData) => {
    try {
        const stored = localStorage.getItem('budget_pro_saves');
        const budgets = stored ? JSON.parse(stored) : [];
        const newBudget = {
          ...budgetData,
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
        };
        budgets.push(newBudget);
        localStorage.setItem('budget_pro_saves', JSON.stringify(budgets));
        refreshBudgets();
        return newBudget.id;
    } catch(e) {
        console.error("Error saving budget", e);
        return null;
    }
  };

  const updateBudget = (id, budgetData) => {
    try {
        const stored = localStorage.getItem('budget_pro_saves');
        let budgets = stored ? JSON.parse(stored) : [];
        
        // Ensure we keep the original ID and just update the content and timestamp
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            budgets[index] = { 
                ...budgetData, 
                id, // Preserve ID
                savedAt: new Date().toISOString() // Update timestamp
            };
            localStorage.setItem('budget_pro_saves', JSON.stringify(budgets));
            refreshBudgets();
            return true;
        }
        return false;
    } catch(e) {
        console.error("Error updating budget", e);
        return false;
    }
  };

  const deleteBudget = (id) => {
    try {
        const stored = localStorage.getItem('budget_pro_saves');
        if (!stored) return;
        let budgets = JSON.parse(stored);
        budgets = budgets.filter(b => b.id !== id);
        localStorage.setItem('budget_pro_saves', JSON.stringify(budgets));
        refreshBudgets();
    } catch(e) {
        console.error("Error deleting budget", e);
    }
  };
  
  const loadBudget = (id) => {
     try {
         const stored = localStorage.getItem('budget_pro_saves');
         if (!stored) return null;
         const budgets = JSON.parse(stored);
         return budgets.find(b => b.id === id);
     } catch(e) {
         console.error("Error loading specific budget", e);
         return null;
     }
  }

  return { savedBudgets, saveBudget, updateBudget, deleteBudget, refreshBudgets, loadBudget };
};
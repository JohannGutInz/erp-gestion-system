import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Clock, PlusCircle } from 'lucide-react';
import { ContractorDataSection } from './BudgetPro/ContractorDataSection';
import { ClientAndProjectSection } from './BudgetPro/ClientAndProjectSection';
import { ServicesCatalog } from './BudgetPro/ServicesCatalog';
import { MaterialsTable } from './BudgetPro/MaterialsTable';
import { LaborTable } from './BudgetPro/LaborTable';
import { MachineryTable } from './BudgetPro/MachineryTable';
import { BudgetSummary } from './BudgetPro/BudgetSummary';
import { BudgetPreview } from './BudgetPro/BudgetPreview';
import { useSavedBudgets } from '@/hooks/useSavedBudgets';
import { SavedBudgetsList } from './BudgetPro/SavedBudgetsList';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

// Helper to get sum of total property in array of objects
const getSum = (arr) => arr.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);

export const BudgetPro = ({ onBack }) => {
  const { toast } = useToast();
  const [view, setView] = useState('editor'); // 'editor' | 'preview'
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // -- Hook for saved budgets --
  const { savedBudgets, saveBudget, updateBudget, deleteBudget, loadBudget } = useSavedBudgets();
  const [currentBudgetId, setCurrentBudgetId] = useState(null); // ID if editing existing budget

  // -- State --
  const [folio, setFolio] = useState("001");
  const [customTitle, setCustomTitle] = useState(""); 
  
  const [contractor, setContractor] = useState({
    companyName: '',
    responsible: '',
    phone: '',
    address: '',
    logo: ''
  });

  const [client, setClient] = useState({
    name: '',
    phone: '',
    email: '',
    rfc: '',
    location: '',
    type: ''
  });

  // Services now stores objects: { name, price, isCustom }
  const [services, setServices] = useState([]); 
  const [materials, setMaterials] = useState([]);
  const [labor, setLabor] = useState([]);
  const [machinery, setMachinery] = useState([]);
  const [observations, setObservations] = useState("");
  const [includeIva, setIncludeIva] = useState(true);
  const [advance, setAdvance] = useState("");

  // -- Effects --

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Contractor Data & Folio
  useEffect(() => {
    const savedContractor = localStorage.getItem('budget_contractor_data');
    if (savedContractor) {
      setContractor(JSON.parse(savedContractor));
    }

    const savedFolio = localStorage.getItem('budget_next_folio');
    if (savedFolio) {
        setFolio(String(savedFolio).padStart(3, '0'));
    } else {
        localStorage.setItem('budget_next_folio', '001');
    }
  }, []);

  // Save Contractor Data on Change
  const handleContractorChange = (field, value) => {
    const newContractor = { ...contractor, [field]: value };
    setContractor(newContractor);
    localStorage.setItem('budget_contractor_data', JSON.stringify(newContractor));
  };

  const clearContractorData = () => {
    const empty = { companyName: '', responsible: '', phone: '', address: '', logo: '' };
    setContractor(empty);
    localStorage.removeItem('budget_contractor_data');
  };

  // -- CRUD Operations --

  const collectBudgetData = () => ({
    contractor,
    client,
    services,
    materials,
    labor,
    machinery,
    observations,
    includeIva,
    advance,
    folio,
    customTitle,
    totals: calculateTotals()
  });

  const handleSaveNew = (saveName) => {
    const finalTitle = saveName || customTitle || 'Presupuesto Sin Título';
    setCustomTitle(finalTitle); // Sync title
    
    const data = {
        ...collectBudgetData(),
        customTitle: finalTitle
    };

    const newId = saveBudget(data);
    if (newId) {
        setCurrentBudgetId(newId);
        toast({
            title: "Presupuesto guardado",
            description: "El presupuesto se ha guardado correctamente en tu historial."
        });
    }
  };

  const handleUpdate = () => {
    if (!currentBudgetId) return;
    
    const data = collectBudgetData();
    const success = updateBudget(currentBudgetId, data);
    
    if (success) {
        toast({
            title: "Presupuesto actualizado",
            description: "Los cambios se han guardado exitosamente."
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo actualizar el presupuesto."
        });
    }
  };

  const handleLoadBudget = (id) => {
    const budget = loadBudget(id);
    if (!budget) {
        toast({ variant: "destructive", title: "Error", description: "No se encontró el presupuesto." });
        return;
    }

    setContractor(budget.contractor || {});
    setClient(budget.client || {});
    setServices(budget.services || []);
    setMaterials(budget.materials || []);
    setLabor(budget.labor || []);
    setMachinery(budget.machinery || []);
    setObservations(budget.observations || "");
    setIncludeIva(budget.includeIva ?? true);
    setAdvance(budget.advance || "");
    setFolio(budget.folio || "001");
    setCustomTitle(budget.customTitle || "");
    setCurrentBudgetId(budget.id);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({
        title: "Presupuesto cargado",
        description: `Se ha cargado "${budget.customTitle || 'el presupuesto'}"`
    });
  };

  const handleNewBudget = () => {
    setClient({ name: '', phone: '', email: '', rfc: '', location: '', type: '' });
    setServices([]);
    setMaterials([]);
    setLabor([]);
    setMachinery([]);
    setObservations("");
    setAdvance("");
    setCustomTitle("");
    setCurrentBudgetId(null);
    setIncludeIva(true);
    // Note: We deliberately don't clear contractor data as that's usually constant
    
    // Auto increment folio for new budget logic could go here if requested, 
    // but typically user manually sets it or it persists until changed.
    
    toast({
        title: "Nuevo presupuesto",
        description: "Formulario limpiado para un nuevo presupuesto."
    });
  };

  // Calculations
  const matTotal = materials.reduce((acc, curr) => {
    if (curr.hasPrice === false) return acc;
    return acc + (parseFloat(curr.total) || 0);
  }, 0);

  const labTotal = getSum(labor);
  const macTotal = getSum(machinery);
  const servicesTotal = services.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

  const subtotal = matTotal + labTotal + macTotal + servicesTotal;
  const iva = includeIva ? subtotal * 0.16 : 0;
  const total = subtotal + iva;
  const balance = total - (parseFloat(advance) || 0);

  const calculateTotals = () => ({
    materials: matTotal,
    labor: labTotal,
    machinery: macTotal,
    services: servicesTotal,
    iva,
    total,
    advance: parseFloat(advance) || 0,
    balance
  });

  const totals = calculateTotals();

  if (view === 'preview') {
    return <BudgetPreview 
        data={{
            contractor,
            client,
            services,
            materials,
            labor,
            machinery,
            totals,
            folio,
            customTitle,
            date: currentTime.toLocaleDateString('es-MX'),
            observations
        }} 
        onBack={() => setView('editor')} 
    />;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">BudgetPro <span className="text-blue-500">Ultimate</span></h1>
                    {currentBudgetId && (
                        <Badge variant="outline" className="text-orange-400 border-orange-500/50 bg-orange-900/20">
                            EDITANDO MODO
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-gray-500 font-mono">FOLIO: {folio}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap justify-end">
            <div className="hidden lg:flex flex-col items-end text-right mr-4">
                <div className="text-2xl font-mono font-bold text-gray-200 tabular-nums">
                    {currentTime.toLocaleTimeString('es-MX')}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>
            
            <Button onClick={handleNewBudget} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Presupuesto
            </Button>

            <Button onClick={() => setView('preview')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
                <Eye className="mr-2 h-4 w-4" /> Vista Previa
            </Button>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        <ContractorDataSection 
            data={contractor} 
            onChange={handleContractorChange} 
            onClear={clearContractorData} 
        />
        
        <ClientAndProjectSection 
            data={client} 
            onChange={(field, value) => setClient(prev => ({ ...prev, [field]: value }))} 
        />
        
        <ServicesCatalog 
            selectedServices={services} 
            onChange={setServices} 
        />

        <MaterialsTable 
            items={materials} 
            onChange={setMaterials} 
        />

        <LaborTable 
            items={labor} 
            onChange={setLabor} 
        />

        <MachineryTable 
            items={machinery} 
            onChange={setMachinery} 
        />

        <BudgetSummary 
            subtotals={{ materials: matTotal, labor: labTotal, machinery: macTotal }}
            servicesTotal={servicesTotal}
            observations={observations}
            onObservationChange={setObservations}
            includeIva={includeIva}
            onIvaChange={setIncludeIva}
            advance={advance}
            onAdvanceChange={setAdvance}
            customTitle={customTitle}
            onCustomTitleChange={setCustomTitle}
            onSave={handleSaveNew}
            onUpdate={handleUpdate}
            isEditing={!!currentBudgetId}
        />

        <SavedBudgetsList 
            budgets={savedBudgets}
            onLoad={handleLoadBudget}
            onDelete={deleteBudget}
        />
      </div>
    </div>
  );
};
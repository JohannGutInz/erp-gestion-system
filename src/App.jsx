import React, { useState, useCallback, useMemo, useEffect  } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Users, BarChart3, Package, Download, ArrowLeft, Droplets, Truck, ClipboardList, DollarSign, FileText, HardHat, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { Dialog } from '@/components/ui/dialog';
import { useOrders } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useClients';
import { useSellers } from '@/hooks/useSellers';
import { useAccounting } from '@/hooks/useAccounting';
import { OrderForm } from '@/components/OrderForm';
import { SellerForm } from '@/components/SellerForm';
import { CalendarView } from '@/components/CalendarView';
import { OrdersList } from '@/components/OrdersList';
import { SellersDashboard } from '@/components/SellersDashboard';
import { AccountingDashboard } from '@/components/AccountingDashboard';
import { generateWeeklyPDF } from '@/components/WeeklySchedulePDF';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { addDays } from 'date-fns';
import { LoginScreen } from '@/components/LoginScreen';
import { IncomeRangeSelector } from '@/components/IncomeRangeSelector';
import { BudgetPro } from '@/components/BudgetPro';
import { WorksModule } from '@/components/Works/WorksModule';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { isValidUUID } from '@/lib/validators';

const AgendaCard = ({ icon, title, description, onClick, className }) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.4)' }}
    className={`glass-effect rounded-2xl p-6 cursor-pointer flex flex-col items-center text-center shadow-lg transition-all duration-300 ${className}`}
    onClick={onClick}
  >
    {icon}
    <h3 className="text-xl font-bold text-white mt-4">{title}</h3>
    <p className="text-gray-400 mt-2 text-sm">{description}</p>
  </motion.div>
);

const AgendaView = ({ title, serviceType, sellers, getOrders, openEditOrderDialog, deleteOrder, updateOrderStatus, onBack }) => {
  const [view, setView] = useState('calendar');
  
  const orders = useMemo(() => getOrders({ serviceType }), [getOrders, serviceType]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Button onClick={onBack} variant="outline" className="mb-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú
        </Button>
        <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
        <div className="flex space-x-2 mb-6">
            <Button onClick={() => setView('calendar')} variant={view === 'calendar' ? 'secondary' : 'ghost'} className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendario
            </Button>
            <Button onClick={() => setView('list')} variant={view === 'list' ? 'secondary' : 'ghost'} className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white">
                <Package className="w-4 h-4 mr-2" />
                Lista
            </Button>
        </div>
        {view === 'calendar' ? (
            <CalendarView
                getOrdersForDate={getOrders}
                serviceType={serviceType}
                handleEditOrder={openEditOrderDialog}
                handleDeleteOrder={deleteOrder}
                updateOrderStatus={updateOrderStatus}
                sellers={sellers}
            />
        ) : (
            <OrdersList
                orders={orders}
                sellers={sellers}
                onEdit={openEditOrderDialog}
                onDelete={deleteOrder}
                onStatusChange={updateOrderStatus}
            />
        )}
    </motion.div>
  );
};


function AppContent() {
  const { toast } = useToast();
  const { session, loading: authLoading, logout, companyId, noCompany } = useAuth();

  // Dev-only: limpia datos con ids no-UUID que causarían error 400 en Supabase
  useEffect(() => {
    if (import.meta.env.DEV) {
      const KEYS = [
        { key: 'construction-orders', idField: 'seller' },
        { key: 'construction-sellers', idField: 'id' },
        { key: 'construction-clients', idField: 'id' },
      ];
      KEYS.forEach(({ key, idField }) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const arr = JSON.parse(raw);
          const clean = arr.filter(r => !r[idField] || isValidUUID(r[idField]));
          if (clean.length !== arr.length) {
            localStorage.setItem(key, JSON.stringify(clean));
            console.warn(`[dev] localStorage "${key}": eliminados ${arr.length - clean.length} registros con ids no-UUID`);
          }
        } catch (_) {}
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isAuthenticated = !!session;
  const [currentView, setCurrentView] = useState('dashboard');
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfDateRange, setPdfDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 6),
  });
  const [pdfAgendaType, setPdfAgendaType] = useState('all');

  const {
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getOrders,
  } = useOrders(toast, companyId);

  const { searchClients, addClient } = useClients(toast, companyId);

  const {
    sellers,
    addSeller,
    updateSeller,
    deleteSeller,
    getSellerStats,
  } = useSellers(toast, orders, companyId);

  const {
    transactions,
    addTransaction,
    deleteTransaction,
    getTransactions,
    getSummary,
  } = useAccounting(toast, orders, companyId);

  const [isOrderDialogOpen, setOrderDialogOpen] = useState(false);
  const [isSellerDialogOpen, setSellerDialogOpen] = useState(false);
  
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingSeller, setEditingSeller] = useState(null);

  const openNewOrderDialog = useCallback(() => {
    setEditingOrder(null);
    setOrderDialogOpen(true);
  }, []);

  const openEditOrderDialog = useCallback((order) => {
    setEditingOrder(order);
    setOrderDialogOpen(true);
  }, []);
  
  const openNewSellerDialog = useCallback(() => {
    setEditingSeller(null);
    setSellerDialogOpen(true);
  }, []);

  const openEditSellerDialog = useCallback((seller) => {
    setEditingSeller(seller);
    setSellerDialogOpen(true);
  }, []);

  const handleDownloadPDF = async (withPrices = true) => {
    if (!pdfDateRange?.from || !pdfDateRange?.to) {
      toast({
        variant: "destructive",
        title: "Selección incompleta",
        description: "Por favor, selecciona un rango de fechas válido.",
      });
      return;
    }
    setIsDownloading(true);
    toast({
      title: "Generando PDF...",
      description: "Por favor espera, estamos preparando tu agenda.",
    });
    try {
      const ordersToExport = getOrders({ serviceType: pdfAgendaType === 'all' ? undefined : pdfAgendaType });
      await generateWeeklyPDF(ordersToExport, sellers, pdfDateRange, pdfAgendaType, withPrices);
      toast({
        title: "¡PDF Generado!",
        description: "La agenda se ha descargado.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error al generar PDF",
        description: "No se pudo crear el archivo. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const sellerStats = useMemo(() => getSellerStats(), [getSellerStats, orders, sellers]);
  
  const renderContent = () => {
    switch(currentView) {
      case 'colados':
        return <AgendaView
          title="Agenda de Colados"
          serviceType="colado"
          sellers={sellers}
          getOrders={getOrders}
          openEditOrderDialog={openEditOrderDialog}
          deleteOrder={deleteOrder}
          updateOrderStatus={updateOrderStatus}
          onBack={() => setCurrentView('dashboard')}
        />;
      case 'impermeabilizacion':
        return <AgendaView
          title="Agenda de Impermeabilización"
          serviceType="impermeabilizacion"
          sellers={sellers}
          getOrders={getOrders}
          openEditOrderDialog={openEditOrderDialog}
          deleteOrder={deleteOrder}
          updateOrderStatus={updateOrderStatus}
          onBack={() => setCurrentView('dashboard')}
        />;
      case 'works':
        return (
          <WorksModule onBack={() => setCurrentView('dashboard')} />
        );
      case 'budgetpro':
         return (
             <BudgetPro onBack={() => setCurrentView('dashboard')} />
         );
      case 'sellers':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
              <Button onClick={() => setCurrentView('dashboard')} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Menú
              </Button>
              <Button onClick={openNewSellerDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Vendedor
              </Button>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">Control de Vendedores</h2>
            <SellersDashboard 
              sellers={sellers} 
              stats={sellerStats} 
              onEdit={openEditSellerDialog}
              onDelete={deleteSeller}
            />
          </motion.div>
        );
      case 'accounting':
        return (
          <>
            <Button onClick={() => setCurrentView('dashboard')} variant="outline" className="mb-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Menú
            </Button>
            <AccountingDashboard
              getTransactions={getTransactions}
              addTransaction={addTransaction}
              deleteTransaction={deleteTransaction}
              getSummary={getSummary}
            />
          </>
        );
      case 'dashboard':
      default:
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <AgendaCard 
                icon={<Package className="w-12 h-12 text-blue-400" />}
                title="Colados"
                description="Gestiona los colados completos."
                onClick={() => setCurrentView('colados')}
                className="hover:border-blue-500"
              />
              <AgendaCard 
                icon={<Droplets className="w-12 h-12 text-green-400" />}
                title="Impermeabilización"
                description="Servicios de impermeabilización."
                onClick={() => setCurrentView('impermeabilizacion')}
                className="hover:border-green-500"
              />
              <AgendaCard 
                icon={<HardHat className="w-12 h-12 text-orange-400" />}
                title="Control de Obras"
                description="Gestión de proyectos y obras."
                onClick={() => setCurrentView('works')}
                className="hover:border-orange-500"
              />
               <AgendaCard 
                icon={<FileText className="w-12 h-12 text-pink-400" />}
                title="Presupuestos"
                description="Generador profesional de presupuestos."
                onClick={() => setCurrentView('budgetpro')}
                className="hover:border-pink-500"
              />
               <AgendaCard 
                icon={<BarChart3 className="w-12 h-12 text-indigo-400" />}
                title="Ventas"
                description="Rendimiento de vendedores."
                onClick={() => setCurrentView('sellers')}
                className="hover:border-indigo-500"
              />
              <AgendaCard 
                icon={<DollarSign className="w-12 h-12 text-emerald-400" />}
                title="Contabilidad"
                description="Ingresos y gastos."
                onClick={() => setCurrentView('accounting')}
                className="hover:border-emerald-500"
              />
            </div>
        );
    }
  };


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-grid-pattern">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sistema de Gestión - Sonora</title>
        <meta name="description" content="Sistema profesional para gestionar envíos de materiales y colados completos en todo el estado de Sonora" />
      </Helmet>

      <div className="min-h-screen text-white">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoginScreen />
            </motion.div>
          ) : noCompany ? (
            <motion.div
              key="no-company"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-screen bg-grid-pattern"
            >
              <div className="glass-effect rounded-2xl p-8 max-w-md text-center space-y-4">
                <HardHat className="w-12 h-12 text-orange-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">Sin empresa asignada</h2>
                <p className="text-gray-400 text-sm">
                  Tu cuenta no está asociada a ninguna empresa. Contacta al administrador.
                </p>
                <Button onClick={logout} variant="outline" className="border-gray-700">
                  Cerrar sesión
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="container mx-auto px-4 py-8">
                <motion.header
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-effect rounded-2xl p-6 mb-8 shadow-glow"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src="https://storage.googleapis.com/hostinger-horizons-assets-prod/5148a6aa-97b8-4a48-bd80-f2e7521206b9/e1395ce8a93a1b6ea47b3ebbd6d0e5da.png"
                        alt="Logo de la empresa"
                        className="h-20 w-auto"
                      />
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Programación y Logística</h1>
                        <p className="text-gray-300">Sonora</p>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap justify-center gap-3">
                      <Button
                        onClick={logout}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-gray-800"
                        title="Cerrar sesión"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                      {currentView !== 'budgetpro' && currentView !== 'sellers' && currentView !== 'works' && (
                          <>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-[200px] justify-start text-left font-normal border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {pdfDateRange?.from ? (
                                    pdfDateRange.to ? (
                                        <>
                                        {format(pdfDateRange.from, "d MMM", { locale: es })} - {format(pdfDateRange.to, "d MMM", { locale: es })}
                                        </>
                                    ) : (
                                        format(pdfDateRange.from, "d MMM", { locale: es })
                                    )
                                    ) : (
                                    <span>Fechas</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={pdfDateRange?.from}
                                    selected={pdfDateRange}
                                    onSelect={setPdfDateRange}
                                    numberOfMonths={2}
                                    locale={es}
                                />
                                </PopoverContent>
                            </Popover>

                            <Select value={pdfAgendaType} onValueChange={setPdfAgendaType}>
                                <SelectTrigger className="w-[150px] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                                <SelectValue placeholder="Agenda"/>
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="colado">Colados</SelectItem>
                                <SelectItem value="impermeabilizacion">Imperme.</SelectItem>
                                <SelectItem value="envio">Envíos</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={() => handleDownloadPDF(true)}
                                disabled={isDownloading || !pdfDateRange?.from || !pdfDateRange?.to}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg disabled:opacity-50 p-2"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                            
                            <Button
                                onClick={() => handleDownloadPDF(false)}
                                disabled={isDownloading || !pdfDateRange?.from || !pdfDateRange?.to}
                                className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg disabled:opacity-50 p-2"
                            >
                                <ClipboardList className="w-4 h-4" />
                            </Button>

                            <IncomeRangeSelector orders={orders} />

                            <Button
                                onClick={openNewOrderDialog}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Orden
                            </Button>
                          </>
                      )}
                    </div>
                  </div>
                </motion.header>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={isOrderDialogOpen} onOpenChange={setOrderDialogOpen}>
          {companyId && (
            <OrderForm
              isOpen={isOrderDialogOpen}
              setIsOpen={setOrderDialogOpen}
              addOrder={addOrder}
              updateOrder={updateOrder}
              sellers={sellers}
              editingOrder={editingOrder}
              setEditingOrder={setEditingOrder}
              searchClients={searchClients}
              addClient={addClient}
            />
          )}
        </Dialog>

        <Dialog open={isSellerDialogOpen} onOpenChange={setSellerDialogOpen}>
          <SellerForm
            isOpen={isSellerDialogOpen}
            setIsOpen={setSellerDialogOpen}
            addSeller={addSeller}
            updateSeller={updateSeller}
            editingSeller={editingSeller}
            setEditingSeller={setEditingSeller}
          />
        </Dialog>

        <Toaster />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
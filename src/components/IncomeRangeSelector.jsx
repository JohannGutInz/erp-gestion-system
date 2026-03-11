import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { generateIncomeReportPDF } from './generateIncomeReportPDF';
import { FileBarChart, Calendar as CalendarIcon, Download, DollarSign } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function IncomeRangeSelector({ orders }) {
  const { toast } = useToast();
  const [date, setDate] = useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [serviceType, setServiceType] = useState('impermeabilizacion');
  const [waterproofingType, setWaterproofingType] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleServiceChange = (value) => {
    setServiceType(value);
    // Reset waterproofing type if moving away or back to default
    setWaterproofingType('all');
  };

  // Calculate filtered orders for UI summary
  const summaryData = useMemo(() => {
    if (!date?.from || !date?.to) return { count: 0, total: 0 };

    const startOfRange = new Date(date.from);
    startOfRange.setHours(0, 0, 0, 0);

    const endOfRange = new Date(date.to);
    endOfRange.setHours(23, 59, 59, 999);

    const filtered = orders.filter(order => {
      if (!order.date) return false;
      const orderDate = new Date(order.date);
      const isDateInRange = orderDate >= startOfRange && orderDate <= endOfRange;
      
      let isServiceMatch = false;

      if (serviceType === 'all') {
        isServiceMatch = true;
      } else if (serviceType === 'impermeabilizacion') {
        if (waterproofingType === 'all') {
           // Match both standard and 'other' waterproofing types
           isServiceMatch = order.serviceType === 'impermeabilizacion' || order.serviceType === 'impermeabilizacion_otro';
        } else {
           // Match specific selected subtype
           isServiceMatch = order.serviceType === waterproofingType;
        }
      } else {
        isServiceMatch = order.serviceType === serviceType;
      }

      return isDateInRange && isServiceMatch;
    });

    const total = filtered.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);
    return { count: filtered.length, total };
  }, [orders, date, serviceType, waterproofingType]);

  const handleDownload = async () => {
    if (!date?.from || !date?.to) {
      toast({
        variant: "destructive",
        title: "Rango incompleto",
        description: "Por favor selecciona una fecha de inicio y fin.",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Filter orders based on the selected date range only
      // The service/subtype type filtering will be handled by generateIncomeReportPDF
      const startOfRange = new Date(date.from);
      startOfRange.setHours(0, 0, 0, 0);

      const endOfRange = new Date(date.to);
      endOfRange.setHours(23, 59, 59, 999);

      const dateFilteredOrders = orders.filter(order => {
        if (!order.date) return false;
        const orderDate = new Date(order.date);
        return orderDate >= startOfRange && orderDate <= endOfRange;
      });

      if (dateFilteredOrders.length === 0) {
        toast({
            variant: "warning",
            title: "Sin datos",
            description: "No se encontraron órdenes en el rango de fechas seleccionado.",
        });
        setIsGenerating(false);
        return;
      }

      await generateIncomeReportPDF(dateFilteredOrders, date, serviceType, waterproofingType);
      
      let successDesc = "Se ha descargado el reporte de ingresos.";
      if (serviceType !== 'all') {
         successDesc = `Reporte generado para ${serviceType === 'impermeabilizacion' && waterproofingType !== 'all' ? waterproofingType : serviceType}.`;
      }

      toast({
        title: "¡Reporte Generado!",
        description: successDesc,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el reporte PDF.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white gap-2",
            !date && "text-muted-foreground"
          )}
        >
          <FileBarChart className="h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">Reporte Ingresos</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4 bg-gray-900 border-gray-700" align="end">
        <div className="space-y-4">
            <div className="space-y-2">
                <h4 className="font-medium text-white leading-none">Rango del Reporte</h4>
                <p className="text-sm text-gray-400">Selecciona fechas y servicio para calcular ingresos.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium">Tipo de Servicio</label>
                <Select value={serviceType} onValueChange={handleServiceChange}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecciona servicio" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="impermeabilizacion">Impermeabilizaciones</SelectItem>
                        <SelectItem value="colado">Colados</SelectItem>
                        <SelectItem value="envio">Envíos</SelectItem>
                        <SelectItem value="all">Todos los Servicios</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {serviceType === 'impermeabilizacion' && (
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-medium">Tipo de Impermeabilización</label>
                    <Select value={waterproofingType} onValueChange={setWaterproofingType}>
                        <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="impermeabilizacion">Impermeabilizante Completo</SelectItem>
                            <SelectItem value="impermeabilizacion_otro">Impermeabilizante Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div className="border border-gray-800 rounded-md">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={1}
                    locale={es}
                    className="text-white flex justify-center"
                />
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Total Estimado</span>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-end justify-between">
                    <span className="text-xs text-gray-500">{summaryData.count} órdenes</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(summaryData.total)}</span>
                </div>
            </div>

            <Button 
                onClick={handleDownload} 
                disabled={isGenerating || !date?.from || !date?.to || summaryData.count === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    "Generando..."
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Reporte
                    </>
                )}
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
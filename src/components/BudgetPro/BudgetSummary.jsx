
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

export const BudgetSummary = ({ 
    subtotals, 
    servicesTotal,
    observations, 
    onObservationChange,
    includeIva,
    onIvaChange,
    advance,
    onAdvanceChange,
    customTitle,
    onCustomTitleChange,
    onSave,
    onUpdate,
    isEditing
}) => {
  const { materials, labor, machinery } = subtotals;
  const servicesSum = parseFloat(servicesTotal) || 0;
  const subtotalSum = materials + labor + machinery + servicesSum;
  const ivaAmount = includeIva ? subtotalSum * 0.16 : 0;
  const total = subtotalSum + ivaAmount;
  const balance = total - (parseFloat(advance) || 0);

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleSaveClick = () => {
    setSaveName(customTitle || '');
    setIsSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (onCustomTitleChange) {
        onCustomTitleChange(saveName); // Update the main title as well
    }
    onSave(saveName);
    setIsSaveDialogOpen(false);
  };

  return (
    <>
        <Card className="bg-gray-900 border-gray-800 text-white mb-6">
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Title & Observations */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label htmlFor="customTitle" className="text-lg font-semibold text-blue-400">Título del Presupuesto (Opcional)</Label>
                        <Input
                            id="customTitle"
                            value={customTitle}
                            onChange={(e) => onCustomTitleChange(e.target.value)}
                            placeholder="Ej. PRESUPUESTO CASA HABITACIÓN"
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        />
                    </div>

                    <div className="space-y-4">
                        <Label htmlFor="observations" className="text-lg font-semibold">Observaciones y Condiciones</Label>
                        <Textarea 
                            id="observations"
                            value={observations}
                            onChange={(e) => onObservationChange(e.target.value)}
                            placeholder="Detalles adicionales, tiempos de entrega, condiciones de pago..."
                            className="h-32 bg-gray-800 border-gray-700 text-white resize-none"
                        />
                    </div>
                </div>

                {/* Right Column: Totals */}
                <div className="space-y-4 bg-gray-800/50 p-6 rounded-xl border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-center">Resumen Financiero</h3>
                    
                    {servicesSum > 0 && (
                        <div className="flex justify-between text-yellow-300 font-medium">
                            <span>Servicios:</span>
                            <span>{formatCurrency(servicesSum)}</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between text-gray-300">
                        <span>Materiales:</span>
                        <span>{formatCurrency(materials)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                        <span>Mano de Obra:</span>
                        <span>{formatCurrency(labor)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                        <span>Maquinaria:</span>
                        <span>{formatCurrency(machinery)}</span>
                    </div>

                    <div className="border-t border-gray-700 my-2"></div>

                    <div className="flex justify-between items-center font-semibold text-white">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotalSum)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="iva-check" 
                                checked={includeIva}
                                onCheckedChange={onIvaChange}
                                className="border-gray-500 data-[state=checked]:bg-blue-500"
                            />
                            <Label htmlFor="iva-check" className="cursor-pointer text-sm">Agregar IVA (16%)</Label>
                        </div>
                        <span className="text-gray-400">{formatCurrency(ivaAmount)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xl font-bold text-white border-t border-gray-600 pt-3 mt-2">
                        <span>TOTAL PRESUPUESTO:</span>
                        <span>{formatCurrency(total)}</span>
                    </div>

                    <div className="pt-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="advance" className="whitespace-nowrap font-medium text-emerald-400">ANTICIPO REQUERIDO:</Label>
                            <div className="relative w-1/2">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <Input 
                                    id="advance"
                                    type="number"
                                    value={advance}
                                    onChange={(e) => onAdvanceChange(e.target.value)}
                                    className="bg-gray-900 border-emerald-500/50 text-right pl-6 text-white"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-lg font-bold text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                            <span>SALDO PENDIENTE:</span>
                            <span>{formatCurrency(balance)}</span>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex flex-col gap-3">
                        {isEditing ? (
                             <Button onClick={onUpdate} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2">
                                <RefreshCw className="w-4 h-4 mr-2" /> ACTUALIZAR PRESUPUESTO
                            </Button>
                        ) : (
                            <Button onClick={handleSaveClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2">
                                <Save className="w-4 h-4 mr-2" /> GUARDAR PRESUPUESTO
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </CardContent>
        </Card>

        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>Guardar Presupuesto</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Asigna un nombre para identificar este presupuesto fácilmente.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="saveName" className="mb-2 block">Nombre / Título del Presupuesto</Label>
                    <Input 
                        id="saveName" 
                        value={saveName} 
                        onChange={(e) => setSaveName(e.target.value)} 
                        placeholder="Ej. Remodelación Cocina Sr. Pérez"
                        className="bg-gray-800 border-gray-700 text-white"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)} className="hover:bg-gray-800 hover:text-white">Cancelar</Button>
                    <Button onClick={handleConfirmSave} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
};

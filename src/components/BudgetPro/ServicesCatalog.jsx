
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ListChecks, Plus, Trash2 } from 'lucide-react';

const PREDEFINED_SERVICES = [
  "Barda Perimetral", "Losa Maciza", "Losa Aligerada", 
  "Cimentación", "Firme de Concreto", "Enjarre/Aplanado", 
  "Cuarto Adicional", "Remodelación", "Inst. Eléctrica", 
  "Inst. Hidráulica", "Colocación Pisos", "Azulejos/Baños", 
  "Impermeabilización", "Demolición", "Pintura"
];

export const ServicesCatalog = ({ selectedServices, onChange }) => {
  // customServiceInput state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const handleServiceToggle = (serviceName, isChecked) => {
    if (isChecked) {
      // Add service with default price 0
      onChange([...selectedServices, { name: serviceName, price: '', isCustom: false }]);
    } else {
      // Remove service
      onChange(selectedServices.filter(s => s.name !== serviceName));
    }
  };

  const handlePriceChange = (serviceName, newPrice) => {
    const updated = selectedServices.map(s => {
      if (s.name === serviceName) {
        return { ...s, price: newPrice };
      }
      return s;
    });
    onChange(updated);
  };

  const addCustomService = () => {
    if (customName.trim()) {
      // Avoid duplicates
      if (selectedServices.some(s => s.name.toLowerCase() === customName.trim().toLowerCase())) {
        return; 
      }
      onChange([...selectedServices, { name: customName.trim(), price: customPrice, isCustom: true }]);
      setCustomName("");
      setCustomPrice("");
    }
  };

  const removeCustomService = (serviceName) => {
    onChange(selectedServices.filter(s => s.name !== serviceName));
  };

  // Helper to check if a predefined service is selected
  const getSelectedService = (name) => selectedServices.find(s => s.name === name);

  return (
    <Card className="bg-gray-900 border-gray-800 text-white mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-yellow-400">
          <ListChecks className="h-6 w-6" />
          Catálogo de Servicios y Precios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Predefined Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 mb-8">
          {PREDEFINED_SERVICES.map((serviceName) => {
            const selected = getSelectedService(serviceName);
            const isChecked = !!selected;

            return (
              <div key={serviceName} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isChecked ? 'bg-gray-800/50 border border-gray-700' : ''}`}>
                <Checkbox 
                  id={`srv-${serviceName}`} 
                  checked={isChecked}
                  onCheckedChange={(checked) => handleServiceToggle(serviceName, checked)}
                  className="border-gray-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black shrink-0"
                />
                <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                    <Label 
                        htmlFor={`srv-${serviceName}`}
                        className={`text-sm cursor-pointer truncate ${isChecked ? 'text-yellow-400 font-medium' : 'text-gray-300'}`}
                        title={serviceName}
                    >
                        {serviceName}
                    </Label>
                    
                    {isChecked && (
                        <div className="flex items-center w-24 shrink-0 relative">
                            <span className="absolute left-2 text-gray-400 text-xs">$</span>
                            <Input 
                                type="number"
                                value={selected.price}
                                onChange={(e) => handlePriceChange(serviceName, e.target.value)}
                                placeholder="0.00"
                                className="h-7 text-xs bg-gray-900 border-gray-600 text-right pl-4 pr-1 focus-visible:ring-1 focus-visible:ring-yellow-500"
                            />
                        </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-800 pt-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Servicios Personalizados</h4>
            
            {/* Custom Services List */}
            <div className="space-y-3 mb-4">
                {selectedServices.filter(s => s.isCustom).map((service, idx) => (
                    <div key={`custom-${idx}`} className="flex items-center gap-4 bg-gray-800/30 p-2 rounded border border-gray-700/50">
                        <div className="flex-1 font-medium text-sm pl-2">{service.name}</div>
                        <div className="flex items-center gap-2">
                             <span className="text-gray-400 text-sm">Precio:</span>
                             <div className="relative w-32">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <Input 
                                    type="number"
                                    value={service.price}
                                    onChange={(e) => handlePriceChange(service.name, e.target.value)}
                                    className="h-8 bg-gray-900 border-gray-600 text-right pl-5"
                                />
                             </div>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeCustomService(service.name)}
                                className="h-8 w-8 text-gray-500 hover:text-red-400"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Custom Service Form */}
            <div className="flex flex-col sm:flex-row gap-3 items-end bg-gray-800/50 p-3 rounded-lg border border-gray-700 border-dashed">
                <div className="w-full sm:flex-1 space-y-1">
                    <Label className="text-xs text-gray-400">Nombre del Servicio</Label>
                    <Input 
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ej. Instalación de especialidad..."
                        className="bg-gray-900 border-gray-600"
                    />
                </div>
                <div className="w-full sm:w-32 space-y-1">
                    <Label className="text-xs text-gray-400">Precio (Opcional)</Label>
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <Input 
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            placeholder="0.00"
                            className="bg-gray-900 border-gray-600 pl-5 text-right"
                        />
                    </div>
                </div>
                <Button 
                    onClick={addCustomService}
                    disabled={!customName.trim()}
                    className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

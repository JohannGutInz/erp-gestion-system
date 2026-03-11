
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Upload, Trash2, User, Phone, MapPin } from 'lucide-react';

export const ContractorDataSection = ({ data, onChange, onClear }) => {
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange('logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <Card className="bg-gray-900 border-gray-800 text-white mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl text-blue-400">
          <Building2 className="h-6 w-6" />
          Datos del Profesional / Empresa
        </CardTitle>
        <Button 
            variant="destructive" 
            size="sm" 
            onClick={onClear}
            className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Borrar Datos
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-4 bg-gray-800/30">
            {data.logo ? (
              <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-md group">
                <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="ghost" className="text-white" onClick={() => fileInputRef.current.click()}>Cambiar</Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-500 mb-2" />
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current.click()}
                    className="border-gray-600 text-gray-300"
                >
                  Subir Logo
                </Button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                 <Building2 className="h-4 w-4 text-blue-400" /> Empresa / Nombre Comercial
              </Label>
              <Input
                id="companyName"
                value={data.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Ej. Construcciones del Norte"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsible" className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" /> Arq. / Ing. / Maestro Responsable
              </Label>
              <Input
                id="responsible"
                value={data.responsible}
                onChange={(e) => handleInputChange('responsible', e.target.value)}
                placeholder="Ej. Arq. Juan Pérez"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" /> Teléfono / WhatsApp
              </Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ej. 662 123 4567"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" /> Dirección Oficina
              </Label>
              <Input
                id="address"
                value={data.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Ej. Blvd. Morelos 123, Col. Centro"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

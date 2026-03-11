
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCircle, Map, Briefcase } from 'lucide-react';

export const ClientAndProjectSection = ({ data, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <Card className="bg-gray-900 border-gray-800 text-white mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-emerald-400">
          <UserCircle className="h-6 w-6" />
          Datos del Cliente y Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nombre del Cliente</Label>
            <Input
              id="clientName"
              value={data.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nombre completo"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Teléfono</Label>
            <Input
              id="clientPhone"
              value={data.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Número de contacto"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Correo Electrónico</Label>
            <Input
              id="clientEmail"
              value={data.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="cliente@email.com"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientRFC">RFC (Opcional)</Label>
            <Input
              id="clientRFC"
              value={data.rfc}
              onChange={(e) => handleInputChange('rfc', e.target.value)}
              placeholder="RFC del cliente"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectLocation">Ubicación del Proyecto</Label>
            <Input
              id="projectLocation"
              value={data.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Dirección de la obra"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectType">Tipo de Proyecto</Label>
            <Select 
                value={data.type} 
                onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="Residencial">Residencial</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Remodelación">Remodelación</SelectItem>
                <SelectItem value="Ampliación">Ampliación</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="Obra Civil">Obra Civil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

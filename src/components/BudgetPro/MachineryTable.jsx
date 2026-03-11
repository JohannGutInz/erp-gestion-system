
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Truck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const MachineryTable = ({ items, onChange }) => {
  const addItem = () => {
    onChange([...items, { id: Date.now(), concept: '', quantity: '', unit: '', unitPrice: '', total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const q = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
      const p = parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0;
      item.total = q * p;
    }

    newItems[index] = item;
    onChange(newItems);
  };

  return (
    <Card className="bg-gray-900 border-gray-800 text-white mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl text-purple-400">
            <Truck className="h-5 w-5" />
            Maquinaria y Equipo
            </CardTitle>
            <Button onClick={addItem} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" /> Agregar Fila
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-800">
            <Table>
                <TableHeader className="bg-gray-800/50">
                    <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400 w-[40%]">Concepto</TableHead>
                        <TableHead className="text-gray-400 w-[15%]">Cantidad</TableHead>
                        <TableHead className="text-gray-400 w-[15%]">Unidad</TableHead>
                        <TableHead className="text-gray-400 w-[15%]">P. Unitario</TableHead>
                        <TableHead className="text-gray-400 w-[15%] text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow className="border-gray-800 hover:bg-transparent">
                            <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                                No hay maquinaria agregada
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item, index) => (
                            <TableRow key={item.id} className="border-gray-800 hover:bg-gray-800/30">
                                <TableCell>
                                    <Input 
                                        value={item.concept} 
                                        onChange={(e) => updateItem(index, 'concept', e.target.value)}
                                        placeholder="Ej. Retroexcavadora"
                                        className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-purple-500 h-8 p-0 placeholder:text-gray-600"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number"
                                        value={item.quantity} 
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        placeholder="0"
                                        className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-purple-500 h-8 p-0 text-center placeholder:text-gray-600"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={item.unit} 
                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                        placeholder="horas"
                                        className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-purple-500 h-8 p-0 text-center placeholder:text-gray-600"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number"
                                        value={item.unitPrice} 
                                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                        placeholder="0.00"
                                        className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-purple-500 h-8 p-0 text-right placeholder:text-gray-600"
                                    />
                                </TableCell>
                                <TableCell className="text-right font-medium text-purple-300">
                                    ${(item.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeItem(index)}
                                        className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-transparent"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
};

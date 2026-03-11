
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Package, CheckSquare, Square } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

export const MaterialsTable = ({ items, onChange }) => {
  const addItem = () => {
    onChange([...items, { id: Date.now(), concept: '', quantity: '', unit: '', unitPrice: '', total: 0, hasPrice: true }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Auto calculate total only if price is enabled
    if (field === 'quantity' || field === 'unitPrice' || field === 'hasPrice') {
      const q = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
      const p = parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0;
      
      // If hasPrice is false (or being set to false), total is 0
      const priceEnabled = field === 'hasPrice' ? value : (item.hasPrice !== false);
      
      item.total = priceEnabled ? (q * p) : 0;
    }

    newItems[index] = item;
    onChange(newItems);
  };

  return (
    <Card className="bg-gray-900 border-gray-800 text-white mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl text-blue-400">
            <Package className="h-5 w-5" />
            Materiales
            </CardTitle>
            <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Agregar Fila
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-800">
            <Table>
                <TableHeader className="bg-gray-800/50">
                    <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400 w-[50px] text-center" title="Incluir precio">$$</TableHead>
                        <TableHead className="text-gray-400 w-[35%]">Concepto</TableHead>
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
                            <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                                No hay materiales agregados
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item, index) => (
                            <TableRow key={item.id} className="border-gray-800 hover:bg-gray-800/30">
                                <TableCell className="text-center">
                                    <Checkbox 
                                        checked={item.hasPrice !== false}
                                        onCheckedChange={(checked) => updateItem(index, 'hasPrice', checked)}
                                        className="border-gray-500 data-[state=checked]:bg-blue-500"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={item.concept} 
                                        onChange={(e) => updateItem(index, 'concept', e.target.value)}
                                        placeholder="Ej. Cemento Portland"
                                        className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500 h-8 p-0 placeholder:text-gray-600"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number"
                                        value={item.quantity} 
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        placeholder="0"
                                        className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500 h-8 p-0 text-center placeholder:text-gray-600"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={item.unit} 
                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                        placeholder="saco"
                                        className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500 h-8 p-0 text-center placeholder:text-gray-600"
                                    />
                                </TableCell>
                                <TableCell>
                                    {item.hasPrice !== false ? (
                                        <Input 
                                            type="number"
                                            value={item.unitPrice} 
                                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                            placeholder="0.00"
                                            className="bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500 h-8 p-0 text-right placeholder:text-gray-600"
                                        />
                                    ) : (
                                        <div className="text-xs text-gray-500 text-right italic h-8 flex items-center justify-end px-3">
                                            Sin precio
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium text-blue-300">
                                    {item.hasPrice !== false ? (
                                        `$${(item.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
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

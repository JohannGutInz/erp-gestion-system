import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, CalendarDays } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const SavedBudgetsList = ({ budgets, onLoad, onDelete }) => {
    const { toast } = useToast();

    if (!budgets || budgets.length === 0) {
        return (
            <Card className="bg-gray-900 border-gray-800 text-white mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <CalendarDays className="w-5 h-5 text-blue-400" />
                        Presupuestos Guardados
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-gray-500">
                    No hay presupuestos guardados aún.
                </CardContent>
            </Card>
        );
    }

    const handleDelete = (id) => {
        onDelete(id);
        toast({
            title: "Presupuesto eliminado",
            description: "El presupuesto se ha eliminado correctamente."
        });
    };

    return (
        <Card className="bg-gray-900 border-gray-800 text-white mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <CalendarDays className="w-5 h-5 text-blue-400" />
                    Presupuestos Guardados
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-gray-800 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-800">
                            <TableRow className="border-gray-700 hover:bg-gray-800">
                                <TableHead className="text-gray-300">Nombre / Título</TableHead>
                                <TableHead className="text-gray-300">Cliente</TableHead>
                                <TableHead className="text-gray-300">Fecha</TableHead>
                                <TableHead className="text-right text-gray-300">Total</TableHead>
                                <TableHead className="text-center text-gray-300">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budgets.map((budget) => (
                                <TableRow key={budget.id} className="border-gray-800 hover:bg-gray-800/50">
                                    <TableCell className="font-medium text-white">{budget.customTitle || budget.folio || 'Sin título'}</TableCell>
                                    <TableCell>{budget.client?.name || '-'}</TableCell>
                                    <TableCell>
                                        {new Date(budget.savedAt).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-400 font-mono">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(budget.totals?.total || 0)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => onLoad(budget.id)}
                                                className="text-blue-400 hover:text-white hover:bg-blue-600"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-red-400 hover:text-white hover:bg-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-gray-400">
                                                            Esta acción no se puede deshacer. Se eliminará el presupuesto permanentemente.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(budget.id)} className="bg-red-600 text-white hover:bg-red-700">Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};
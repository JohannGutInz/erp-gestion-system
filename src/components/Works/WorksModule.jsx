import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Download, HardHat, FileText } from 'lucide-react';
import { WorksTable } from './WorksTable';
import { WorkForm } from './WorkForm';
import { generateWorksExcel } from './generateWorksExcel';
import { generateWorksControlPDF } from './generateWorksControlPDF';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { useWorks } from '@/hooks/useWorks';

// Supabase usa snake_case, WorkForm/WorksTable usan camelCase
const mapToUI = (work) => ({
  ...work,
  clientNumber: work.client_number,
  clientName: work.client_name,
  startDate: work.start_date,
  estatus: work.status,
});

const mapToHook = (formData) => ({
  client_number: formData.clientNumber,
  client_name: formData.clientName,
  location: formData.location,
  services: formData.services,
  start_date: formData.startDate,
  status: formData.estatus,
  total: parseFloat(formData.total) || 0,
  advance: parseFloat(formData.advance) || 0,
  balance: (parseFloat(formData.total) || 0) - (parseFloat(formData.advance) || 0),
});

export const WorksModule = ({ onBack }) => {
  const { toast } = useToast();
  const { works, loading, addWork, updateWork, deleteWork } = useWorks(toast);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const worksForUI = works.map(mapToUI);

  const handleAdd = () => {
    setEditingWork(null);
    setIsFormOpen(true);
  };

  const handleEdit = (work) => {
    setEditingWork(work);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteWork(deleteId);
      setDeleteId(null);
    }
  };

  const handleSave = async (formData) => {
    const hookData = mapToHook(formData);
    if (editingWork) {
      await updateWork({ ...hookData, id: editingWork.id });
    } else {
      await addWork(hookData);
    }
  };

  const handleDownloadExcel = () => {
    if (works.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay obras para exportar.",
        variant: "destructive"
      });
      return;
    }
    generateWorksExcel(worksForUI);
    toast({
      title: "Descargando Excel",
      description: "Generando archivo de control de obras...",
    });
  };

  const handleDownloadPDF = () => {
    if (works.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay obras para generar el reporte PDF.",
        variant: "destructive"
      });
      return;
    }
    generateWorksControlPDF(worksForUI);
    toast({
      title: "Descargando PDF",
      description: "Generando reporte de control de obras...",
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                    <HardHat className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Control de Obras</h1>
                    <p className="text-xs text-gray-500 font-mono">GESTIÓN DE PROYECTOS</p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
             <Button onClick={handleDownloadPDF} variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-900/20 hover:text-red-300">
                <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
             <Button onClick={handleDownloadExcel} variant="outline" className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300">
                <Download className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
                <Plus className="mr-2 h-4 w-4" /> Nueva Obra
            </Button>
        </div>
      </div>

      <WorksTable
        works={worksForUI}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        isLoading={loading}
      />

      <WorkForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialData={editingWork}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente la obra seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

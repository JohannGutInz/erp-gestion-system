import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Scale, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

const SummaryCard = ({ title, value, icon, color }) => (
  <Card className="glass-effect border-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</div>
    </CardContent>
  </Card>
);

const TransactionForm = ({ addTransaction, setIsOpen }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description || !date) {
      toast({ title: "Error", description: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    addTransaction({ type, amount: parseFloat(amount), description, date });
    toast({ title: "Éxito", description: "Transacción agregada." });
    setIsOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Tipo de Transacción</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Gasto</SelectItem>
            <SelectItem value="income">Ingreso (Manual)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label htmlFor="amount">Monto</Label><Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
      <div><Label htmlFor="description">Descripción</Label><Input id="description" value={description} onChange={e => setDescription(e.target.value)} required /></div>
      <div><Label htmlFor="date">Fecha</Label><Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
};

const generateAccountingPDF = (transactions, summary) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Contabilidad", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);

    doc.autoTable({
        startY: 40,
        head: [['Resumen', 'Monto']],
        body: [
            ['Ingresos Totales', formatCurrency(summary.totalIncome)],
            ['Gastos Totales', formatCurrency(summary.totalExpenses)],
            ['Ganancia Neta', formatCurrency(summary.netProfit)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
    });

    doc.autoTable({
        startY: doc.autoTable.previous.finalY + 10,
        head: [['Fecha', 'Tipo', 'Descripción', 'Monto']],
        body: transactions.map(t => [
            new Date(t.date).toLocaleDateString('es-ES'),
            t.type === 'income' ? 'Ingreso' : 'Gasto',
            t.description,
            formatCurrency(t.amount)
        ]),
        theme: 'grid',
    });

    doc.save(`Reporte_Contabilidad_${new Date().toISOString().split('T')[0]}.pdf`);
};


export const AccountingDashboard = ({ getTransactions, addTransaction, deleteTransaction, getSummary }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const transactions = useMemo(() => getTransactions(), [getTransactions]);
  const summary = useMemo(() => getSummary(), [getSummary]);

  const chartData = useMemo(() => {
    const dataByMonth = {};
    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
      if (!dataByMonth[month]) {
        dataByMonth[month] = { name: month, ingresos: 0, gastos: 0 };
      }
      if (t.type === 'income') {
        dataByMonth[month].ingresos += t.amount;
      } else {
        dataByMonth[month].gastos += t.amount;
      }
    });
    return Object.values(dataByMonth).reverse();
  }, [transactions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Ingresos Totales" value={summary.totalIncome} icon={<TrendingUp className="h-4 w-4 text-gray-500" />} color="text-emerald-400" />
        <SummaryCard title="Gastos Totales" value={summary.totalExpenses} icon={<TrendingDown className="h-4 w-4 text-gray-500" />} color="text-red-400" />
        <SummaryCard title="Ganancia Neta" value={summary.netProfit} icon={<Scale className="h-4 w-4 text-gray-500" />} color="text-sky-400" />
      </div>

      <Card className="glass-effect border-gray-800">
        <CardHeader>
          <CardTitle>Flujo Financiero Mensual</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Legend />
              <Bar dataKey="ingresos" fill="#34d399" name="Ingresos" />
              <Bar dataKey="gastos" fill="#f87171" name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-effect border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historial de Transacciones</CardTitle>
            <CardDescription>Todos los movimientos registrados.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generateAccountingPDF(transactions, summary)}>
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Nuevo Gasto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Agregar Transacción</DialogTitle></DialogHeader>
                <TransactionForm addTransaction={addTransaction} setIsOpen={setIsFormOpen} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 glass-effect rounded-lg border border-gray-800">
                <div className="flex items-center space-x-3">
                  {t.type === 'income' ? <ArrowUpCircle className="w-6 h-6 text-emerald-500" /> : <ArrowDownCircle className="w-6 h-6 text-red-500" />}
                  <div>
                    <p className="font-medium text-white">{t.description}</p>
                    <p className="text-sm text-gray-400">{new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(t.amount)}</span>
                  {!t.isAuto && (
                    <Button size="icon" variant="destructive" onClick={() => deleteTransaction(t.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
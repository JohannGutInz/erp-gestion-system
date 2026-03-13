import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Combobox } from '@/components/ui/combobox';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Search, UserPlus, X } from 'lucide-react';
import { isValidUUID } from '@/lib/validators';

const MUNICIPIOS_SONORA = [
  { value: 'aconchi', label: 'Aconchi' }, { value: 'agua prieta', label: 'Agua Prieta' }, { value: 'alamos', label: 'Alamos' }, { value: 'altar', label: 'Altar' }, { value: 'arivechi', label: 'Arivechi' }, { value: 'arizpe', label: 'Arizpe' }, { value: 'atil', label: 'Atil' }, { value: 'bacadéhuachi', label: 'Bacadéhuachi' }, { value: 'bacanora', label: 'Bacanora' }, { value: 'bacerac', label: 'Bacerac' }, { value: 'bacoachi', label: 'Bacoachi' }, { value: 'bácum', label: 'Bácum' }, { value: 'banámichi', label: 'Banámichi' }, { value: 'baviácora', label: 'Baviácora' }, { value: 'bavispe', label: 'Bavispe' }, { value: 'benjamín hill', label: 'Benjamín Hill' }, { value: 'caborca', label: 'Caborca' }, { value: 'cajeme', label: 'Cajeme' }, { value: 'cananea', label: 'Cananea' }, { value: 'carbó', label: 'Carbó' }, { value: 'la colorada', label: 'La Colorada' }, { value: 'cucurpe', label: 'Cucurpe' }, { value: 'cumpas', label: 'Cumpas' }, { value: 'divisaderos', label: 'Divisaderos' }, { value: 'empalme', label: 'Empalme' }, { value: 'etchojoa', label: 'Etchojoa' }, { value: 'fronteras', label: 'Fronteras' }, { value: 'granados', label: 'Granados' }, { value: 'guaymas', label: 'Guaymas' }, { value: 'hermosillo', label: 'Hermosillo' }, { value: 'huachinera', label: 'Huachinera' }, { value: 'huásabas', label: 'Huásabas' }, { value: 'huatabampo', label: 'Huatabampo' }, { value: 'huépac', label: 'Huépac' }, { value: 'imuris', label: 'Imuris' }, { value: 'magdalena', label: 'Magdalena' }, { value: 'mazatán', label: 'Mazatán' }, { value: 'moctezuma', label: 'Moctezuma' }, { value: 'naco', label: 'Naco' }, { value: 'nácori chico', label: 'Nácori Chico' }, { value: 'nacozari de garcía', label: 'Nacozari de García' }, { value: 'navojoa', label: 'Navojoa' }, { value: 'nogales', label: 'Nogales' }, { value: 'onavas', label: 'Onavas' }, { value: 'opodepe', label: 'Opodepe' }, { value: 'oquitoa', label: 'Oquitoa' }, { value: 'pitiquito', label: 'Pitiquito' }, { value: 'puerto peñasco', label: 'Puerto Peñasco' }, { value: 'quiriego', label: 'Quiriego' }, { value: 'rayón', label: 'Rayón' }, { value: 'rosario', label: 'Rosario' }, { value: 'sahuaripa', label: 'Sahuaripa' }, { value: 'san felipe de jesús', label: 'San Felipe de Jesús' }, { value: 'san javier', label: 'San Javier' }, { value: 'san luis río colorado', label: 'San Luis Río Colorado' }, { value: 'san miguel de horcasitas', label: 'San Miguel de Horcasitas' }, { value: 'san pedro de la cueva', label: 'San Pedro de la Cueva' }, { value: 'santa ana', label: 'Santa Ana' }, { value: 'santa cruz', label: 'Santa Cruz' }, { value: 'sáric', label: 'Sáric' }, { value: 'soyopa', label: 'Soyopa' }, { value: 'suaqui grande', label: 'Suaqui Grande' }, { value: 'tepache', label: 'Tepache' }, { value: 'trincheras', label: 'Trincheras' }, { value: 'tubutama', label: 'Tubutama' }, { value: 'ures', label: 'Ures' }, { value: 'villa hidalgo', label: 'Villa Hidalgo' }, { value: 'villa pesqueira', label: 'Villa Pesqueira' }, { value: 'yécora', label: 'Yécora' }
];

const INITIAL_FORM_STATE = {
  noteNumber: '',
  client_id: null,
  clientName: '',
  phone: '',
  address: '',
  serviceType: '',
  viguetaType: '',
  viguetaDetails: [],
  bovedillaQuantity: '',
  bovedillaCierreQuantity: '',
  mallaQuantity: '',
  municipality: '',
  specificLocation: '',
  quantity: '',
  date: '',
  seller: '',
  notes: '',
  status: 'pending',
  totalAmount: '',
  advancePayment: ''
};

const FormSection = ({ title, children }) => (
  <div className="border-t border-gray-800 pt-4">
    <h3 className="text-lg font-semibold text-indigo-400 mb-4">{title}</h3>
    {children}
  </div>
);

const ViguetaDetails = React.memo(({ viguetaType, details, onDetailChange, onAdd, onRemove }) => (
  <div className="mt-6">
    <h4 className="font-semibold text-indigo-300 mb-2">Despiece de Viguetas</h4>
    {details.map((detail, index) => (
      <div key={detail.id} className="flex items-center gap-2 mb-2">
        <Input
          type="number"
          placeholder="Cant."
          value={detail.quantity}
          onChange={(e) => onDetailChange(index, 'quantity', e.target.value)}
          className="w-20"
        />
        <Label className="text-gray-400 whitespace-nowrap">
          {viguetaType ? viguetaType.toUpperCase() : ''} de:
        </Label>
        <Input
          placeholder="Medida (ej: 4.50m)"
          value={detail.measure}
          onChange={(e) => onDetailChange(index, 'measure', e.target.value)}
          className="flex-grow"
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    ))}
    <Button type="button" variant="outline" size="sm" onClick={onAdd} className="mt-2">
      <Plus className="h-4 w-4 mr-2" />
      Añadir Medida
    </Button>
  </div>
));

const ClientSearch = ({ searchClients, addClient, selectedClientName, selectedClientId, onSelect, onClear }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      setResults(searchClients ? searchClients(val) : []);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (client) => {
    onSelect(client);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setShowNewForm(false);
  };

  const handleSaveNew = async () => {
    if (!newClient.name.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const result = await addClient(newClient);
    setSaving(false);
    if (result?.success && result.data) {
      handleSelect(result.data);
      setNewClient({ name: '', phone: '', address: '' });
      setShowNewForm(false);
    }
  };

  const handleStartNew = () => {
    setShowDropdown(false);
    setShowNewForm(true);
    setNewClient(prev => ({ ...prev, name: query }));
  };

  if (selectedClientId || selectedClientName) {
    return (
      <div className="flex items-center gap-2 p-2 bg-indigo-900/30 border border-indigo-700 rounded-md">
        <div className="flex-grow">
          <p className="text-sm font-medium text-white">{selectedClientName}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClear} className="h-6 w-6 shrink-0">
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.trim() && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Buscar cliente por nombre o teléfono..."
          className="pl-9"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-56 overflow-y-auto">
          {results.slice(0, 6).map(client => (
            <button
              key={client.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-800 border-b border-gray-800 last:border-0"
              onMouseDown={() => handleSelect(client)}
            >
              <p className="text-sm font-medium text-white">{client.name}</p>
              {client.phone && <p className="text-xs text-gray-400">{client.phone}</p>}
            </button>
          ))}
          {results.length === 0 && query.trim() && (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
          )}
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-indigo-400 hover:bg-gray-800 flex items-center gap-2 border-t border-gray-800"
            onMouseDown={handleStartNew}
          >
            <UserPlus className="h-4 w-4" />
            + Crear cliente nuevo
          </button>
        </div>
      )}

      {showNewForm && (
        <div className="mt-2 p-3 border border-indigo-800 rounded-md bg-indigo-950/30 space-y-2">
          <p className="text-xs text-indigo-400 font-medium">Nuevo cliente</p>
          <Input
            placeholder="Nombre *"
            value={newClient.name}
            onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            placeholder="Teléfono"
            value={newClient.phone}
            onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))}
          />
          <Input
            placeholder="Dirección"
            value={newClient.address}
            onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveNew}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Guardando...' : 'Guardar y seleccionar'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrderForm = ({ isOpen, setIsOpen, addOrder, updateOrder, sellers, editingOrder, setEditingOrder, searchClients, addClient }) => {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (editingOrder) {
        setFormState({
          ...INITIAL_FORM_STATE,
          ...editingOrder,
          viguetaDetails: (editingOrder.viguetaDetails || []).map(d => ({
            ...d,
            id: d.id || Date.now() + Math.random()
          }))
        });
      } else {
        setFormState(INITIAL_FORM_STATE);
      }
    }
  }, [editingOrder, isOpen]);

  // Pre-seleccionar el primer vendedor disponible al crear una orden nueva
  useEffect(() => {
    if (isOpen && !editingOrder && sellers.length > 0) {
      setFormState(prev => {
        if (!prev.seller && isValidUUID(sellers[0].id)) {
          return { ...prev, seller: sellers[0].id };
        }
        return prev;
      });
    }
  }, [isOpen, editingOrder, sellers]);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setEditingOrder(null);
    setFormState(INITIAL_FORM_STATE);
    setIsSubmitting(false);
  }, [setIsOpen, setEditingOrder]);

  const handleChange = useCallback((e) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleSelectChange = useCallback((id, value) => {
    setFormState(prev => {
      const newState = { ...prev, [id]: value };
      if (id === 'serviceType' && !['colado', 'envio'].includes(value)) {
        newState.viguetaType = '';
        newState.viguetaDetails = [];
        newState.bovedillaQuantity = '';
        newState.bovedillaCierreQuantity = '';
        newState.mallaQuantity = '';
      }
      if (id === 'viguetaType') {
        newState.viguetaDetails = [];
      }
      return newState;
    });
  }, []);

  const handleViguetaDetailChange = useCallback((index, field, value) => {
    setFormState(prev => {
      const newDetails = [...prev.viguetaDetails];
      newDetails[index] = { ...newDetails[index], [field]: value };
      return { ...prev, viguetaDetails: newDetails };
    });
  }, []);

  const addViguetaDetail = useCallback(() => {
    if (!formState.viguetaType) {
      toast({ title: 'Seleccione un tipo de vigueta primero', variant: 'destructive' });
      return;
    }
    setFormState(prev => ({
      ...prev,
      viguetaDetails: [
        ...prev.viguetaDetails,
        { id: Date.now() + Math.random(), quantity: '', measure: '' }
      ]
    }));
  }, [formState.viguetaType, toast]);

  const removeViguetaDetail = useCallback((index) => {
    setFormState(prev => ({
      ...prev,
      viguetaDetails: prev.viguetaDetails.filter((_, i) => i !== index)
    }));
  }, []);

  const balance = useMemo(() =>
    (parseFloat(formState.totalAmount) || 0) - (parseFloat(formState.advancePayment) || 0),
    [formState.totalAmount, formState.advancePayment]
  );

  const showMaterialFields = useMemo(() =>
    formState.serviceType === 'colado' || formState.serviceType === 'envio',
    [formState.serviceType]
  );

  const handleClientSelect = useCallback((client) => {
    setFormState(prev => ({
      ...prev,
      client_id: client.id,
      clientName: client.name,
      phone: client.phone || '',
      address: client.address || '',
    }));
  }, []);

  const handleClientClear = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      client_id: null,
      clientName: '',
      phone: '',
      address: '',
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formState.clientName?.trim()) {
      toast({
        title: 'Error',
        description: 'El cliente es obligatorio.',
        variant: 'destructive'
      });
      return;
    }

    if (!formState.client_id || !isValidUUID(formState.client_id)) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar o crear un cliente válido antes de guardar.',
        variant: 'destructive'
      });
      return;
    }

    if (!formState.serviceType) {
      toast({
        title: 'Error',
        description: 'Selecciona un tipo de servicio.',
        variant: 'destructive'
      });
      return;
    }

    if (!formState.date) {
      toast({
        title: 'Error',
        description: 'La fecha es obligatoria.',
        variant: 'destructive'
      });
      return;
    }

    if (!formState.seller) {
      toast({
        title: 'Error',
        description: 'Selecciona un vendedor.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    const finalOrder = {
      ...formState,
      totalAmount: parseFloat(formState.totalAmount) || 0,
      advancePayment: parseFloat(formState.advancePayment) || 0,
      balance,
      quantity: parseFloat(formState.quantity) || 0
    };

    try {
      let result;
      if (editingOrder) {
        result = await updateOrder(finalOrder);
      } else {
        result = await addOrder(finalOrder);
      }

      if (result && result.success !== false) {
        closeDialog();
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error al guardar',
        description: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, editingOrder, addOrder, updateOrder, toast, closeDialog, balance]);

  return (
    <DialogContent className="dialog-content-class max-w-4xl h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{editingOrder ? 'Editar Orden' : 'Crear Nueva Orden'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow pr-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="noteNumber">Número de Nota</Label>
                <Input
                  id="noteNumber"
                  value={formState.noteNumber}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Cliente *</Label>
                <ClientSearch
                  searchClients={searchClients}
                  addClient={addClient}
                  selectedClientName={formState.clientName}
                  selectedClientId={formState.client_id}
                  onSelect={handleClientSelect}
                  onClear={handleClientClear}
                />
              </div>
            </div>

            <FormSection title="Detalles del Servicio">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio *</Label>
                  <Select
                    value={formState.serviceType}
                    onValueChange={(v) => handleSelectChange('serviceType', v)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colado">Colado Completo</SelectItem>
                      <SelectItem value="envio">Envío de Material</SelectItem>
                      <SelectItem value="impermeabilizacion">Impermeabilizante Completo</SelectItem>
                      <SelectItem value="impermeabilizacion_otro">Impermeabilizante Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Cantidad (m²)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formState.quantity}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Fecha Programada *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formState.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </FormSection>

            <AnimatePresence>
              {showMaterialFields && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <FormSection title="Detalles de Materiales">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="viguetaType">Tipo de Vigueta</Label>
                        <Select
                          value={formState.viguetaType}
                          onValueChange={(v) => handleSelectChange('viguetaType', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="v11">V11</SelectItem>
                            <SelectItem value="v16">V16</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bovedillaQuantity">Cant. Bovedilla</Label>
                        <Input
                          id="bovedillaQuantity"
                          type="number"
                          value={formState.bovedillaQuantity}
                          onChange={handleChange}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bovedillaCierreQuantity">Bovedilla de Cierre</Label>
                        <Input
                          id="bovedillaCierreQuantity"
                          type="number"
                          value={formState.bovedillaCierreQuantity}
                          onChange={handleChange}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mallaQuantity">Metros de Malla (m)</Label>
                        <Input
                          id="mallaQuantity"
                          type="number"
                          step="0.01"
                          value={formState.mallaQuantity}
                          onChange={handleChange}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <ViguetaDetails
                      viguetaType={formState.viguetaType}
                      details={formState.viguetaDetails}
                      onDetailChange={handleViguetaDetailChange}
                      onAdd={addViguetaDetail}
                      onRemove={removeViguetaDetail}
                    />
                  </FormSection>
                </motion.div>
              )}
            </AnimatePresence>

            <FormSection title="Ubicación y Vendedor">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="municipality">Municipio</Label>
                  <Combobox
                    items={MUNICIPIOS_SONORA}
                    value={formState.municipality}
                    onChange={(value) => handleSelectChange('municipality', value)}
                    placeholder="Buscar municipio..."
                    noResultsText="No se encontró el municipio."
                  />
                </div>
                <div>
                  <Label htmlFor="seller">Vendedor *</Label>
                  <Select
                    value={formState.seller}
                    onValueChange={(v) => handleSelectChange('seller', v)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="specificLocation">Ubicación Específica</Label>
                  <Input
                    id="specificLocation"
                    value={formState.specificLocation}
                    onChange={handleChange}
                    placeholder="Calle, colonia, referencias..."
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Finanzas">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Costo Total ($)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formState.totalAmount}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="advancePayment">Anticipo ($)</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formState.advancePayment}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="balance">Saldo Pendiente ($)</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={balance.toFixed(2)}
                    readOnly
                    className="bg-gray-800 text-white font-bold"
                  />
                </div>
              </div>
            </FormSection>

            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formState.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Información adicional sobre la orden..."
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-6 border-t border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

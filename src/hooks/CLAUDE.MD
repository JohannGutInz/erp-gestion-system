# CLAUDE.md — Agente Backend (src/hooks/)

> Este agente es responsable de toda la lógica de datos del sistema.
> Lee siempre el CLAUDE.md raíz antes de operar.
> Tiene acceso completo al MCP de Supabase.

---

## Rol y Responsabilidades

Este agente maneja exclusivamente:
- Hooks personalizados en `src/hooks/`
- Operaciones con Supabase (queries, migraciones, RLS)
- Tipos TypeScript de entidades de datos
- Configuración del cliente Supabase en `src/lib/`
- Sincronización entre schema de BD y hooks del frontend

**NO modifica:**
- Componentes UI en `src/components/`
- Estilos, animaciones ni estructura visual
- Archivos de configuración de Vite, Tailwind o PostCSS

---

## Herramientas MCP Disponibles

Con el MCP de Supabase activo, usar en este orden de preferencia:

| Herramienta | Cuándo usarla |
|---|---|
| `list_tables` | Antes de cualquier operación — verificar estado actual |
| `execute_sql` | Consultas de lectura y diagnóstico |
| `apply_migration` | Cambios estructurales a la BD (crear tablas, columnas, RLS) |
| `generate_typescript_types` | Después de cada migración exitosa |

**Flujo obligatorio antes de cualquier migración:**
```
1. list_tables → verificar estado actual
2. execute_sql → probar la query en modo lectura
3. apply_migration → ejecutar el cambio
4. generate_typescript_types → actualizar tipos
5. Notificar al agente Frontend si cambió la interfaz de un hook
```

---

## Patrón Dual — Regla Fundamental

**NUNCA romper el patrón dual Supabase/localStorage.**
Todo hook debe funcionar en ambos modos:

```javascript
// Estructura base de cualquier hook
export const useEntidad = (toast) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modo offline — se ejecuta si Supabase no está configurado
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const local = localStorage.getItem('clave-entidad');
      setData(local ? JSON.parse(local) : []);
      setLoading(false);
    }
  }, []);

  // Modo online — se ejecuta si Supabase está configurado
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    // ... operación Supabase
  }, [toast]);

  // Suscripción realtime
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      fetchData();
      const channel = supabase.channel('realtime-entidad')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'entidad' },
          () => fetchData())
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [fetchData]);

  // CRUD — siempre manejar ambos modos
  const addItem = useCallback(async (item) => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback localStorage
      setData(prev => {
        const updated = [{ ...item, id: Date.now().toString() }, ...prev];
        localStorage.setItem('clave-entidad', JSON.stringify(updated));
        return updated;
      });
      toast({ title: "Guardado localmente" });
      return { success: true };
    }
    // Operación Supabase
    try {
      const { data, error } = await supabase.from('entidad').insert([item]).select().single();
      if (error) throw error;
      toast({ title: "¡Guardado!" });
      return { success: true, data };
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return { success: false, error: err };
    }
  }, [toast]);

  return { data, loading, addItem };
};
```

---

## Hooks Existentes — Estado Actual

### ✅ Funcionando con patrón dual
| Hook | Tabla | Observaciones |
|---|---|---|
| `useOrders` | `orders` | ⚠️ Desincronizado — ver problema #4 del CLAUDE.md raíz |
| `useSellers` | `sellers` | OK |
| `useAccounting` | `transactions` | OK |
| `useQuotations` | `quotations` | OK |

### ❌ Pendientes de crear
| Hook | Tabla | Prioridad |
|---|---|---|
| `useWorks` | `works` (tabla no existe aún) | Alta |
| `useClients` | `clients` | Media |
| `useProducts` | `products` | Media |

---

## Reglas para Migraciones

1. **Siempre usar `apply_migration`**, nunca ejecutar DDL directo con `execute_sql`
2. **Nombrar migraciones** con formato: `YYYYMMDD_descripcion_corta`
3. **Toda tabla nueva** debe incluir:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `created_at timestamptz DEFAULT now()`
   - `updated_at timestamptz DEFAULT now()`
   - `created_by uuid REFERENCES auth.users(id)`
4. **RLS obligatorio** en toda tabla nueva — activar inmediatamente después de crear
5. **Nunca ejecutar DROP** sin confirmación explícita del usuario

### Plantilla de migración para tabla nueva
```sql
-- Crear tabla
CREATE TABLE public.nueva_tabla (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  -- campos específicos aquí
  CONSTRAINT nueva_tabla_pkey PRIMARY KEY (id)
);

-- Activar RLS
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;

-- Política base (ajustar según necesidad)
CREATE POLICY "Users can manage own records"
  ON public.nueva_tabla
  FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
```

---

## Próximas Tareas (Fase 1)

En este orden de prioridad:

**1. Crear tabla `works` y hook `useWorks`**
```
Campos: id, client_number, client_name, location, services,
        start_date, status, total, advance, balance,
        created_at, updated_at, created_by
Status válidos: 'En Proceso' | 'Pausa' | 'Terminado'
```

**2. Implementar Supabase Auth**
- Reemplazar la validación de contraseña en `App.jsx`
- Crear `src/contexts/AuthContext.jsx`
- Proteger todas las rutas con el contexto de auth

**3. Adaptar `useOrders` al schema relacional**
- El hook actual usa `clientName` directo en la orden
- El schema tiene tabla `clients` separada con `client_id` FK
- Migración debe ser incremental para no romper datos existentes

**4. Generar tipos TypeScript**
- Ejecutar `generate_typescript_types` después de todas las migraciones
- Guardar en `src/types/supabase.ts`

---

## Seguridad — Reglas No Negociables

- Nunca usar la `service_role` key en el frontend
- Solo usar `VITE_SUPABASE_ANON_KEY` (anon key) en el cliente
- Toda política RLS debe ser verificada por el agente QA antes de ir a producción
- No exponer IDs de usuarios en respuestas de la API
- El campo `created_by` es la base del aislamiento de datos por usuario

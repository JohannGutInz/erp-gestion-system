# CLAUDE.md — Agente Frontend (src/components/)

> Este agente es responsable de toda la interfaz visual del sistema.
> Lee siempre el CLAUDE.md raíz antes de operar.
> NO tiene acceso directo a Supabase — consume datos solo a través de hooks.

---

## Rol y Responsabilidades

Este agente maneja exclusivamente:
- Componentes React en `src/components/`
- Navegación y estados de UI en `src/App.jsx`
- Estilos, animaciones y estructura visual
- Formularios y validaciones del lado cliente
- Exportación de PDF y Excel

**NO modifica:**
- Hooks en `src/hooks/` — si necesita datos nuevos, solicita al agente Backend
- Schema de Supabase ni migraciones
- Archivos en `src/lib/`

---

## Sistema de Diseño

### Estética global
- Fondo oscuro siempre — nunca fondos blancos en pantallas principales
- Efecto glass en cards y paneles: clase `glass-effect`
- Sombras de color: clase `shadow-glow`
- Patrón de grilla en fondos: clase `bg-grid-pattern`

### Colores por módulo — NO cambiar sin consenso
| Módulo | Color | Clase Tailwind referencia |
|---|---|---|
| Colados | Azul | `text-blue-400`, `border-blue-500` |
| Impermeabilización | Verde | `text-green-400`, `border-green-500` |
| Obras | Naranja | `text-orange-400`, `border-orange-500` |
| Presupuestos | Rosa | `text-pink-400`, `border-pink-500` |
| Vendedores | Índigo | `text-indigo-400`, `border-indigo-500` |
| Contabilidad | Esmeralda | `text-emerald-400`, `border-emerald-500` |

### Componentes UI base
Viven en `src/components/ui/` — son tipo shadcn/ui pero implementación propia.
Usar siempre estos antes de crear componentes nuevos:
`Button`, `Card`, `Input`, `Label`, `Select`, `Calendar`, `Popover`,
`AlertDialog`, `Badge`, `Separator`, `Tabs`, `Tooltip`

---

## Convenciones de Componentes

### Estructura base de un módulo
```jsx
// src/components/NuevoModulo/NuevoModulo.jsx
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NuevoModulo = ({ onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header sticky */}
      <div className="flex justify-between items-center mb-6 bg-gray-900/50 p-4
                      rounded-xl border border-gray-800 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-800">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-[COLOR]-500/20 p-2 rounded-lg">
              {/* Icono del módulo */}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Nombre del Módulo
              </h1>
              <p className="text-xs text-gray-500 font-mono">SUBTÍTULO</p>
            </div>
          </div>
        </div>
        {/* Acciones del header */}
      </div>

      {/* Contenido */}
    </div>
  );
};
```

### Reglas de nomenclatura
- Archivos: PascalCase (`WorksModule.jsx`, `OrderCard.jsx`)
- Exportaciones: siempre nombradas, nunca default en componentes
- Props: camelCase, siempre desestructuradas en la firma
- Handlers: prefijo `handle` (`handleAdd`, `handleEdit`, `handleDelete`)

### Feedback al usuario
Siempre usar toasts para confirmar acciones — nunca alerts nativos:
```jsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

// Éxito
toast({ title: "¡Guardado!", description: "Los datos han sido guardados." });

// Error
toast({ title: "Error", description: "Mensaje del error.", variant: "destructive" });
```

### Confirmaciones de borrado
Siempre usar `AlertDialog` — nunca `window.confirm()`:
```jsx
<AlertDialog open={!!deleteId}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Navegación — Estado Actual y Reglas

La navegación usa `currentView` en `App.jsx`. **Mientras no se migre a React Router,
seguir este patrón al agregar módulos nuevos:**

**1. Agregar case en `renderContent()` en `App.jsx`:**
```jsx
case 'nuevoModulo':
  return <NuevoModulo onBack={() => setCurrentView('dashboard')} />;
```

**2. Agregar AgendaCard en el dashboard:**
```jsx
<AgendaCard
  icon={<IconoElegido className="w-12 h-12 text-[color]-400" />}
  title="Nombre Módulo"
  description="Descripción breve."
  onClick={() => setCurrentView('nuevoModulo')}
  className="hover:border-[color]-500"
/>
```

**3. Importar el componente** en la sección de imports de `App.jsx`

---

## Animaciones

Usar `framer-motion` consistentemente:

```jsx
// Entrada de módulo
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

// Entrada desde abajo (para listas y tablas)
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

// Para items de lista con delay escalonado
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>
```

---

## Manejo de Estados de Carga

Todo componente que consuma un hook debe manejar el estado `loading`:

```jsx
const { data, loading } = useHook(toast);

if (loading) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  );
}

if (data.length === 0) {
  return (
    <div className="text-center py-20 text-gray-500">
      <IconoVacio className="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p>No hay registros todavía.</p>
    </div>
  );
}
```

---

## Idioma y Textos

- Toda la UI en **español (México)**
- Fechas: formato `dd/MM/yyyy` usando `date-fns` con locale `es`
- Moneda: formato MXN usando `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
- Mensajes de error: claros y accionables, sin tecnicismos para el usuario final

---

## Próximas Tareas (Fase 1)

**1. Crear componente `WorksModule` conectado al hook `useWorks`**
- Reemplazar el `localStorage` directo actual por el hook
- Mantener la misma UI — solo cambiar la fuente de datos

**2. Crear `LoginScreen` con Supabase Auth**
- Reemplazar el formulario de contraseña simple
- Agregar campos: email + contraseña
- Manejar estados: loading, error, sesión activa

**3. Migrar navegación a React Router v6**
- Crear `src/router/index.jsx`
- Rutas protegidas con `PrivateRoute` que verifique sesión Supabase
- Mantener las mismas vistas, solo cambiar el mecanismo de navegación

**4. Descomponer `App.jsx`**
- Extraer `AuthProvider` → `src/contexts/AuthContext.jsx`
- Extraer `AppLayout` → `src/components/Layout/AppLayout.jsx`
- App.jsx debe quedar en menos de 50 líneas

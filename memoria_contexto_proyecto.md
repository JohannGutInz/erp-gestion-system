# Memoria del Proyecto — SGO (Sistema de Gestión Operativa)

> Fuente principal de contexto. Actualizar ante cada cambio relevante.
> Última actualización: 2026-03-13

---

## Objetivo del Proyecto

Sistema interno de gestión empresarial para empresa de **construcción y materiales** en Sonora, México.
Meta a mediano plazo: plataforma **SaaS multiempresa** configurable por rubro.

---

## Contexto General

| Item | Detalle |
|---|---|
| Generado con | Hostinger Horizons (builder con IA) |
| Deploy | Vercel — deploy automático desde `main` |
| Repo | `https://github.com/JohannGutInz/erp-gestion-system` |
| BD | Supabase — proyecto `zldkenrvsckmrqazjsqc` |
| Auth | Supabase Auth (implementado — reemplazó contraseña `1234`) |
| MCP Supabase | Activo en VS Code (endpoint: `https://mcp.supabase.com/mcp`) |
| MCP Vercel | Activo en VS Code (endpoint: `https://mcp.vercel.com`) |

---

## Stack

| Área | Tecnología |
|---|---|
| UI | React + Vite |
| Estilos | Tailwind CSS + clases custom (`glass-effect`, `shadow-glow`, `bg-grid-pattern`) |
| Componentes | shadcn/ui (implementación propia en `src/components/ui/`) |
| Backend | Supabase (Auth + DB + Realtime) |
| PDF | jsPDF + jspdf-autotable |
| Routing | ❌ Sin React Router — navegación por `useState` en App.jsx |
| Animaciones | framer-motion |
| Fechas | date-fns (locale `es`) |

---

## Arquitectura

```
LoginScreen (Supabase Auth — email + password)
    ↓ AuthContext / useAuth
AppContent (App.jsx)
    ↓ currentView (useState)
Dashboard → Módulos
```

### Módulos y estado

| `currentView` | Componente | Hook | Tabla Supabase |
|---|---|---|---|
| `colados` | AgendaView | useOrders | `orders` |
| `impermeabilizacion` | AgendaView | useOrders | `orders` |
| `works` | WorksModule | useWorks | `works` |
| `budgetpro` | BudgetPro | useQuotations | `quotations` |
| `sellers` | SellersDashboard | useSellers | `sellers` |
| `accounting` | AccountingDashboard | useAccounting | `transactions` |

### Patrón Dual (NUNCA romper)

```
isSupabaseConfigured?
  SÍ → Supabase + suscripción realtime + actualización optimista de estado
  NO → Fallback localStorage (modo offline)
```

### localStorage keys

| Hook | Key |
|---|---|
| useOrders | `construction-orders` |
| useSellers | `construction-sellers` |
| useAccounting | `construction-accounting` |
| useQuotations | `construction-quotations` |
| useWorks | `works_data` |

---

## Decisiones Tomadas

1. **Supabase Auth** — reemplazó contraseña `1234` hardcodeada. `AuthContext.jsx` + `useAuth()`.
2. **RLS con `auth.uid() = created_by`** — toda tabla nueva requiere este campo y política.
3. **Optimistic UI** — después de cada operación exitosa, actualizar estado React sin esperar realtime.
4. **Canales únicos** — `supabase.channel('realtime-X-' + Date.now())` para evitar conflictos.
5. **`customSupabaseClient.js` eliminado** — era legacy con credenciales hardcodeadas.
6. **Mapeo camelCase↔snake_case** — se hace en WorksModule (`mapToUI` / `mapToHook`), no en el hook.
7. **Credenciales via env vars** — `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local`.

---

## Información Técnica

### Archivos clave

| Archivo | Rol |
|---|---|
| `src/lib/supabase.js` | Cliente Supabase + `isSupabaseConfigured` |
| `src/contexts/AuthContext.jsx` | Auth global (`session`, `login`, `logout`) |
| `src/App.jsx` | God component — navegación, hooks, render |
| `src/hooks/useWorks.js` | CRUD obras |
| `src/hooks/useOrders.js` | CRUD órdenes |
| `src/hooks/useSellers.js` | CRUD vendedores |
| `src/hooks/useAccounting.js` | CRUD transacciones |
| `src/hooks/useQuotations.js` | CRUD cotizaciones |
| `src/components/Works/WorksModule.jsx` | UI obras — conectado a useWorks |
| `src/types/supabase.ts` | Tipos TypeScript generados por MCP |

### Tablas en Supabase

| Tabla | Hook | Estado |
|---|---|---|
| `orders` | useOrders | ✅ Con RLS |
| `sellers` | useSellers | ✅ Con RLS |
| `transactions` | useAccounting | ✅ Con RLS |
| `quotations` | useQuotations | ✅ Con RLS |
| `works` | useWorks | ✅ Con RLS |
| `clients` | — | ❌ Sin hook ni UI |
| `products` | — | ❌ Sin hook ni UI |
| `order_items` | — | ❌ Sin hook ni UI |

### Variables de entorno requeridas (`.env.local`)

```
VITE_SUPABASE_URL=https://zldkenrvsckmrqazjsqc.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

### Colores por módulo

| Módulo | Color |
|---|---|
| Colados | Azul (`blue`) |
| Impermeabilización | Verde (`green`) |
| Obras | Naranja (`orange`) |
| Presupuestos | Rosa (`pink`) |
| Vendedores | Índigo (`indigo`) |
| Contabilidad | Esmeralda (`emerald`) |

---

## Problemas Conocidos / Deuda Técnica

| # | Severidad | Problema |
|---|---|---|
| 1 | 🔴 | `useOrders` usa campos planos (`clientName`) — Supabase tiene tabla `clients` separada con FK |
| 2 | 🔴 | Sin multiempresa — no existe `company_id` en ninguna tabla |
| 3 | 🟡 | `App.jsx` es God Component — orquesta auth, hooks, PDF, navegación |
| 4 | 🟡 | Sin React Router — navegación en `switch` dentro de `renderContent()` |
| 5 | 🟢 | Logo hardcodeado desde CDN de Hostinger |
| 6 | 🟢 | `DEFAULT_SELLERS` tiene datos ficticios |
| 7 | 🟢 | `BudgetPreview.jsx` tiene footer "BudgetPro" hardcodeado |

---

## Tareas Pendientes

### Fase 1 — Estabilización

- [ ] Adaptar `useOrders` al schema relacional (`client_id` FK en lugar de `clientName` embebido)
- [ ] Migrar navegación a React Router v6
- [ ] Descomponer App.jsx → `AppRouter` + `Layout` (AuthProvider ya está hecho)
- [ ] Crear usuario de prueba en Supabase Auth (`Authentication → Users → Invite user`)
- [ ] Migrar logo a Supabase Storage o assets locales

### Fase 2 — Multiempresa / SaaS

- [ ] Agregar `company_id` a todas las tablas
- [ ] RLS por `company_id`
- [ ] Tabla `companies` + roles (`admin`, `operator`, `viewer`)

---

## Cambios Recientes

| Fecha | Commit | Descripción |
|---|---|---|
| 2026-03-13 | `6656bfa3` | fix: optimistic UI updates + unique realtime channels (5 hooks) |
| 2026-03-13 | anterior | fix: connect WorksModule to useWorks, delete customSupabaseClient.js |
| 2026-03-13 | anterior | feat: Supabase Auth — AuthContext, LoginScreen, App.jsx |
| 2026-03-13 | anterior | feat: create works table + useWorks hook + RLS policies |
| 2026-03-13 | `23fe2b4b` | fix: use env vars in supabase.js, add .gitignore |

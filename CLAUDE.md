# CLAUDE.md — Sistema de Gestión Empresarial (SGO)

> Contexto global del proyecto. El schema de la BD está disponible via MCP de Supabase
> en tiempo real — este archivo documenta decisiones, convenciones y problemas que
> ninguna herramienta puede inferir sola. Mantenerlo actualizado conforme evolucione.

---

## 1. ¿Qué es este proyecto?

Sistema interno de gestión empresarial para el sector **construcción y materiales**
en **Sonora, México**. Originalmente generado con Hostinger Horizons (builder con IA).

Objetivo a mediano plazo: convertirse en una plataforma **SaaS multiempresa**
configurable para distintos rubros (renta de vestidos, maquinaria, clínicas, etc.).

**Acceso actual:**
- Producción: Vercel (deploy automático desde `main`)
- BD: Supabase (MCP conectado en VS Code — 28 tools)
- Vercel MCP: conectado en VS Code — 18 tools
- Login: Supabase Auth activo (email + contraseña)

---

## 2. Stack

| Área | Tecnología | Notas |
|---|---|---|
| UI | React + Vite | |
| Estilos | Tailwind CSS | Clases custom: `glass-effect`, `shadow-glow`, `bg-grid-pattern` |
| Componentes | shadcn/ui | Estilo propio, NO instalado como paquete oficial |
| Iconos | lucide-react | |
| Animaciones | framer-motion | |
| Fechas | date-fns | Locale `es` en todos los formatos |
| Backend | Supabase | Auth activo. MCP activo |
| Deploy | Vercel | MCP activo |
| PDF | jsPDF + jspdf-autotable | |
| Routing | ❌ Sin React Router | Navegación por `useState` en App.jsx |

---

## 3. Arquitectura y Navegación

La navegación **no usa React Router**. Todo vive en `App.jsx` con `currentView`:

```
LoginScreen (Supabase Auth — email + contraseña)
    ↓
Dashboard (grid de AgendaCards)
    ↓ setCurrentView(...)
Módulos individuales
```

| `currentView` | Componente | Estado Supabase |
|---|---|---|
| `colados` | AgendaView | ✅ useOrders |
| `impermeabilizacion` | AgendaView | ✅ useOrders |
| `works` | WorksModule | ✅ useWorks (migrado a Supabase) |
| `budgetpro` | BudgetPro | ✅ useQuotations |
| `sellers` | SellersDashboard | ✅ useSellers |
| `accounting` | AccountingDashboard | ✅ useAccounting |

---

## 4. Patrón de Persistencia (Dual)

Todos los hooks siguen el mismo patrón — **NO romperlo al modificar**:

```
isSupabaseConfigured?
  SÍ → Operaciones Supabase + suscripción realtime
  NO → Fallback localStorage (modo offline)
```

**Hooks existentes y sus tablas Supabase:**

| Hook | Tabla Supabase | localStorage key |
|---|---|---|
| `useOrders` | `orders` | `construction-orders` |
| `useSellers` | `sellers` | `construction-sellers` |
| `useAccounting` | `transactions` | `construction-accounting` |
| `useQuotations` | `quotations` | `construction-quotations` |
| `useWorks` | `works` | `works_data` |

**Tablas en Supabase SIN hook ni UI todavía:** `clients`, `products`, `order_items`

> El schema completo y actualizado se consulta via MCP de Supabase (`list_tables`,
> `execute_sql`). No se duplica aquí para evitar desincronización.

---

## 5. Problemas Conocidos y Deuda Técnica

### 🔴 Críticos

1. ~~**Auth falsa**~~ ✅ **Resuelto** — Supabase Auth implementado (email + contraseña). `AuthContext.jsx` maneja sesión.

2. **`customSupabaseClient.js`** — Archivo legacy con credenciales hardcodeadas.
   No usar en código nuevo. Eliminar cuando se confirme que nada lo importa.

3. ~~**WorksModule desconectado**~~ ✅ **Resuelto** — Tabla `works` creada, `useWorks.js` implementado con patrón dual.

4. **Desincronización useOrders vs schema** — El hook guarda `clientName`,
   `clientPhone`, `address` directo en la orden (diseño plano), pero Supabase
   tiene tabla `clients` separada con `client_id` como FK. Adaptar antes de
   usar en producción real.

### 🟡 Importantes

5. **Sin multiempresa** — No existe `company_id` ni `tenant` en ninguna tabla.
   El campo `created_by` (FK a `auth.users`) existe pero Auth no está activo aún.

6. **App.jsx es God Component** — Orquesta auth, hooks, PDF, navegación y render.
   Descomponer en: `AuthProvider`, `AppRouter`, `Layout`.

7. **Sin React Router** — Toda la navegación en un `switch` dentro de
   `renderContent()`. No escala. Migrar a React Router v6.

8. **Logo hardcodeado** — URL apunta a `hostinger-horizons-assets-prod`.
   Migrar a Supabase Storage o assets locales.

### 🟢 Menores

9. `BudgetPreview.jsx` tiene footer con texto "BudgetPro" hardcodeado. Parametrizar.
10. `DEFAULT_SELLERS` en `useSellers.js` tiene datos ficticios. Limpiar antes de prod.

---

## 6. Convenciones de Código

- **Componentes**: PascalCase, exportaciones nombradas (`export const MyComponent`)
- **Hooks**: camelCase con prefijo `use`, exportaciones nombradas
- **Alias**: `@/` → `src/` (configurado en Vite)
- **Idioma**: código en inglés, UI/textos visibles en español (México)
- **Toasts**: siempre via `useToast` de `@/components/ui/use-toast`
- **Errores async**: `try/catch` + `console.error` + toast con `variant: "destructive"`
- **Credenciales**: nunca hardcodear, siempre `import.meta.env.VITE_*`
- **Estética**: fondo oscuro, glass-effect, colores por módulo:
  - azul → colados | verde → impermeabilización | naranja → obras
  - rosa → presupuestos | índigo → vendedores | esmeralda → contabilidad

---

## 7. Roadmap

### Fase 1 — Estabilización
- [x] Supabase Auth (reemplazar contraseña hardcodeada) — `AuthContext.jsx`, `LoginScreen` con email+pass
- [x] Crear tabla `works` y migrar WorksModule — `useWorks.js`, tabla con RLS
- [ ] Adaptar `useOrders` al schema relacional (usar `client_id`)
- [ ] Eliminar `customSupabaseClient.js`
- [ ] Migrar navegación a React Router v6
- [ ] Descomponer App.jsx (AuthProvider ✅ hecho, AppRouter, Layout)

### Fase 2 — Multiempresa / SaaS
- [ ] Agregar `company_id` a todas las tablas
- [ ] RLS por `company_id` en Supabase
- [ ] Tabla `companies` (nombre, logo, módulos activos)
- [ ] Roles: `admin`, `operator`, `viewer`

### Fase 3 — Nuevos Rubros
Configuración por tenant sin cambios de código:
renta de vestidos · mobiliario · sonido · maquinaria · autos · paneles solares · clínicas

---

## 8. Estructura de Agentes

Este proyecto usa tres agentes especializados. Cada uno tiene su propio `CLAUDE.md`
con instrucciones específicas, y todos leen este archivo global como base.

| Agente | CLAUDE.md | Responsabilidad |
|---|---|---|
| **Backend** | `src/hooks/CLAUDE.md` | Hooks, Supabase, migraciones, RLS, tipos |
| **Frontend** | `src/components/CLAUDE.md` | Componentes, UI, navegación, estados |
| **QA/Seguridad** | `tests/CLAUDE.md` | Tests, validaciones, auditoría de seguridad |

**Reglas entre agentes:**
- El agente Backend tiene acceso completo al MCP de Supabase
- El agente Frontend NO modifica la BD directamente — solo consume hooks
- El agente QA/Seg audita cambios de los otros dos antes de hacer push a `main`
- Ningún agente hardcodea credenciales bajo ninguna circunstancia

---

## 9. Comandos Útiles

```bash
npm run dev        # Desarrollo local (localhost:3000)
npm run build      # Build producción
npm run preview    # Preview del build local
```

**Variables de entorno requeridas (`.env.local`):**
```
VITE_SUPABASE_URL=https://zldkenrvsckmrqazjsqc.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

> Sin las variables, el sistema corre en modo offline con localStorage. Este
> fallback debe mantenerse funcional durante toda la Fase 1.

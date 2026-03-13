# CLAUDE.md — Agente QA / Seguridad (tests/)

> Este agente audita, valida y protege el sistema.
> Lee siempre el CLAUDE.md raíz antes de operar.
> Tiene acceso de LECTURA al MCP de Supabase — no ejecuta migraciones.

---

## Rol y Responsabilidades

Este agente maneja exclusivamente:
- Tests de componentes y hooks
- Auditoría de políticas RLS en Supabase
- Validación de variables de entorno y credenciales
- Revisión de seguridad antes de merges a `main`
- Detección de regresiones después de cambios del agente Backend o Frontend

**Puede leer pero NO ejecuta:**
- `apply_migration` — solo el agente Backend
- Modificaciones a componentes o hooks
- Cambios de schema en Supabase

---

## Checklist de Seguridad — Ejecutar Antes de Todo Push a `main`

### 🔴 Credenciales y Secretos
- [ ] No hay keys de Supabase hardcodeadas en ningún archivo `.js` o `.jsx`
- [ ] `customSupabaseClient.js` no está siendo importado por ningún componente activo
- [ ] `.env.local` está en `.gitignore` y no aparece en el historial de git
- [ ] La `service_role` key no aparece en ningún archivo del frontend
- [ ] No hay tokens, passwords ni secrets en comentarios de código

**Verificación rápida con MCP:**
```
Buscar en todo el proyecto: "supabase.co" fuera de .env y src/lib/supabase.js
Buscar: "eyJhbGciOiJIUzI1NiI" (inicio de JWT hardcodeado)
Buscar: "service_role"
```

### 🔴 Autenticación
- [ ] Todas las rutas protegidas verifican sesión activa de Supabase
- [x] El logout limpia correctamente la sesión (`supabase.auth.signOut()` en AuthContext)
- [ ] No existe bypass de autenticación en ningún componente
- [x] Contraseña `1234` hardcodeada eliminada — reemplazada con Supabase Auth

### 🔴 RLS (Row Level Security)
- [ ] RLS está habilitado en todas las tablas de Supabase
- [ ] Ninguna tabla tiene RLS deshabilitado en producción
- [ ] Las políticas no permiten leer datos de otros usuarios
- [ ] El campo `created_by` se valida en todas las políticas de escritura

**Verificación con MCP — ejecutar después de cada migración:**
```sql
-- Verificar que RLS está activo en todas las tablas
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Todas deben tener rowsecurity = true

-- Verificar políticas existentes
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 🟡 Datos y Validaciones
- [ ] Los formularios validan datos antes de enviar a Supabase
- [ ] No se puede enviar un formulario vacío con campos requeridos
- [ ] Los montos numéricos no aceptan valores negativos donde no aplica
- [ ] Las fechas se validan antes de guardarse
- [ ] No hay `console.log` con datos sensibles de usuarios en producción

### 🟡 Frontend
- [ ] No hay llamadas directas a Supabase desde componentes (solo desde hooks)
- [ ] Los errores de Supabase no exponen detalles técnicos al usuario final
- [ ] Las variables de entorno usan prefijo `VITE_` correctamente
- [ ] No hay imports de `customSupabaseClient.js` activos

---

## Auditoría de RLS — Guía Completa

### Política mínima requerida por tabla

Toda tabla de datos debe tener al menos estas 4 políticas:

```sql
-- SELECT: solo ver los propios registros
CREATE POLICY "select_own" ON public.tabla
  FOR SELECT USING (auth.uid() = created_by);

-- INSERT: solo insertar con created_by = usuario actual
CREATE POLICY "insert_own" ON public.tabla
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- UPDATE: solo actualizar los propios
CREATE POLICY "update_own" ON public.tabla
  FOR UPDATE USING (auth.uid() = created_by);

-- DELETE: solo eliminar los propios
CREATE POLICY "delete_own" ON public.tabla
  FOR DELETE USING (auth.uid() = created_by);
```

### Cuando se implemente multiempresa (Fase 2)

Las políticas deberán cambiar a validar `company_id`:
```sql
-- Ejemplo futuro con company_id
CREATE POLICY "select_company" ON public.tabla
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );
```

---

## Tests — Estructura y Convenciones

### Ubicación de archivos
```
tests/
├── hooks/
│   ├── useOrders.test.js
│   ├── useSellers.test.js
│   ├── useAccounting.test.js
│   └── useQuotations.test.js
├── components/
│   ├── LoginScreen.test.jsx
│   ├── WorksModule.test.jsx
│   └── ...
├── security/
│   ├── rls-audit.sql       ← Queries de auditoría RLS
│   └── credentials-check.js
└── CLAUDE.md               ← Este archivo
```

### Qué testear en cada hook

```javascript
// Patrón mínimo para cada hook
describe('useOrders', () => {
  it('carga datos desde localStorage cuando Supabase no está configurado', () => {});
  it('carga datos desde Supabase cuando está configurado', () => {});
  it('agrega orden correctamente en modo offline', () => {});
  it('agrega orden correctamente en modo online', () => {});
  it('maneja errores de Supabase sin romper la UI', () => {});
  it('sincroniza localStorage después de operación exitosa', () => {});
});
```

### Qué testear en componentes críticos

```javascript
describe('LoginScreen', () => {
  it('no permite acceso con contraseña incorrecta', () => {});
  it('redirige al dashboard después de login exitoso', () => {});
  it('muestra error claro si las credenciales fallan', () => {});
});

describe('WorksModule', () => {
  it('muestra estado de carga mientras fetcha datos', () => {});
  it('muestra mensaje vacío si no hay obras', () => {});
  it('confirma antes de eliminar una obra', () => {});
});
```

---

## Revisión Pre-Deploy — Checklist Final

Ejecutar antes de cada deploy a producción:

```
□ git log --oneline -10  →  revisar qué cambió
□ Correr checklist de seguridad completo (sección arriba)
□ Verificar que npm run build no genera warnings críticos
□ Revisar Build Logs en Vercel MCP después del deploy
□ Probar flujo crítico: Login → Dashboard → Crear orden → Verificar en Supabase
□ Confirmar que RLS sigue activo en todas las tablas
□ Verificar que no se subieron archivos .env al repo
```

**Comando de verificación de archivos sensibles en git:**
```bash
git log --all --full-history -- .env
git log --all --full-history -- .env.local
git log --all --full-history -- "**/customSupabaseClient*"
```

---

## Vulnerabilidades Conocidas — Estado Actual

| ID | Descripción | Severidad | Estado |
|---|---|---|---|
| SEC-001 | Contraseña `1234` hardcodeada en App.jsx | 🔴 Crítica | ✅ Resuelto (2026-03-13) — Supabase Auth con email+contraseña |
| SEC-002 | `customSupabaseClient.js` con credenciales | 🔴 Crítica | Pendiente eliminar |
| SEC-003 | Sin RLS configurado (Auth no activo aún) | 🔴 Crítica | ✅ Resuelto (2026-03-13) — RLS activo en 8 tablas, políticas auth.uid() |
| SEC-004 | Sin separación de datos por usuario | 🟡 Alta | ✅ Resuelto (2026-03-13) — created_by + RLS por auth.uid() |
| SEC-005 | Sin separación de datos por empresa | 🟡 Alta | Pendiente Fase 2 |
| SEC-006 | Logo en CDN externo de Hostinger | 🟢 Baja | Pendiente Fase 1 |

> Actualizar esta tabla cuando se resuelva cada vulnerabilidad.

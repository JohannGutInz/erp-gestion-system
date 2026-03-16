-- ============================================================
-- FASE 2 — Multiempresa / SaaS
-- Aplicado primero en DEV (dgmwhyzgtdzjqzbfffor)
-- Aplicar también en PROD (zldkenrvsckmrqazjsqc)
-- Idempotente: seguro de ejecutar en un proyecto limpio
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA: companies
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL,
  logo_url   text,
  modules    jsonb       DEFAULT '[]'::jsonb,
  settings   jsonb       DEFAULT '{}'::jsonb,
  active     boolean     DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_slug_key UNIQUE (slug)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- NOTA: política de companies se crea DESPUÉS de company_users (ver sección 3)

-- ------------------------------------------------------------
-- 2. TABLA: company_users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_users (
  id         uuid  NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid  REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid  REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text  DEFAULT 'operator'
                   CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT company_users_pkey            PRIMARY KEY (id),
  CONSTRAINT company_users_company_id_user_id_key UNIQUE (company_id, user_id)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own memberships" ON public.company_users;
CREATE POLICY "users can read own memberships"
  ON public.company_users FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users can insert own memberships" ON public.company_users;
CREATE POLICY "users can insert own memberships"
  ON public.company_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política companies (ahora sí puede referenciar company_users)
DROP POLICY IF EXISTS "company members can read own company" ON public.companies;
CREATE POLICY "company members can read own company"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 3. COLUMNA company_id en 8 tablas de datos
-- ------------------------------------------------------------
ALTER TABLE public.orders      ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.sellers     ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.quotations  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.works       ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.clients     ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.products    ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- ------------------------------------------------------------
-- 4. POLÍTICAS RLS — doble condición por tabla
--    Condición A: company_id coincide con empresa del usuario
--    Condición B: fallback legacy (company_id IS NULL AND created_by = auth.uid())
--    order_items no tiene created_by → usa EXISTS en orders
-- ------------------------------------------------------------

-- ---- orders ----
DROP POLICY IF EXISTS "orders_select"     ON public.orders;
DROP POLICY IF EXISTS "orders_insert"     ON public.orders;
DROP POLICY IF EXISTS "orders_update"     ON public.orders;
DROP POLICY IF EXISTS "orders_delete"     ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_own" ON public.orders;

CREATE POLICY "orders_select" ON public.orders FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "orders_update" ON public.orders FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "orders_delete" ON public.orders FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "orders_update_own" ON public.orders FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "orders_delete_own" ON public.orders FOR DELETE USING (auth.uid() = created_by);

-- ---- sellers ----
DROP POLICY IF EXISTS "sellers_select"     ON public.sellers;
DROP POLICY IF EXISTS "sellers_insert"     ON public.sellers;
DROP POLICY IF EXISTS "sellers_update"     ON public.sellers;
DROP POLICY IF EXISTS "sellers_delete"     ON public.sellers;
DROP POLICY IF EXISTS "sellers_select_own" ON public.sellers;
DROP POLICY IF EXISTS "sellers_insert_own" ON public.sellers;
DROP POLICY IF EXISTS "sellers_update_own" ON public.sellers;
DROP POLICY IF EXISTS "sellers_delete_own" ON public.sellers;

CREATE POLICY "sellers_select" ON public.sellers FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "sellers_insert" ON public.sellers FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "sellers_update" ON public.sellers FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "sellers_delete" ON public.sellers FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "sellers_select_own" ON public.sellers FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "sellers_insert_own" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "sellers_update_own" ON public.sellers FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "sellers_delete_own" ON public.sellers FOR DELETE USING (auth.uid() = created_by);

-- ---- transactions ----
DROP POLICY IF EXISTS "transactions_select"     ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert"     ON public.transactions;
DROP POLICY IF EXISTS "transactions_update"     ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete"     ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "transactions_delete_own" ON public.transactions FOR DELETE USING (auth.uid() = created_by);

-- ---- quotations ----
DROP POLICY IF EXISTS "quotations_select"     ON public.quotations;
DROP POLICY IF EXISTS "quotations_insert"     ON public.quotations;
DROP POLICY IF EXISTS "quotations_update"     ON public.quotations;
DROP POLICY IF EXISTS "quotations_delete"     ON public.quotations;
DROP POLICY IF EXISTS "quotations_select_own" ON public.quotations;
DROP POLICY IF EXISTS "quotations_insert_own" ON public.quotations;
DROP POLICY IF EXISTS "quotations_update_own" ON public.quotations;
DROP POLICY IF EXISTS "quotations_delete_own" ON public.quotations;

CREATE POLICY "quotations_select" ON public.quotations FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "quotations_delete" ON public.quotations FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "quotations_select_own" ON public.quotations FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "quotations_insert_own" ON public.quotations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "quotations_update_own" ON public.quotations FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "quotations_delete_own" ON public.quotations FOR DELETE USING (auth.uid() = created_by);

-- ---- works ----
DROP POLICY IF EXISTS "works_select"              ON public.works;
DROP POLICY IF EXISTS "works_insert"              ON public.works;
DROP POLICY IF EXISTS "works_update"              ON public.works;
DROP POLICY IF EXISTS "works_delete"              ON public.works;
DROP POLICY IF EXISTS "Users can manage own works" ON public.works;

CREATE POLICY "works_select" ON public.works FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "works_insert" ON public.works FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "works_update" ON public.works FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "works_delete" ON public.works FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));

-- ---- clients ----
DROP POLICY IF EXISTS "clients_select"     ON public.clients;
DROP POLICY IF EXISTS "clients_insert"     ON public.clients;
DROP POLICY IF EXISTS "clients_update"     ON public.clients;
DROP POLICY IF EXISTS "clients_delete"     ON public.clients;
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_own" ON public.clients;
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_own" ON public.clients;

CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "clients_delete" ON public.clients FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "clients_select_own" ON public.clients FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "clients_insert_own" ON public.clients FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clients_update_own" ON public.clients FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clients_delete_own" ON public.clients FOR DELETE USING (auth.uid() = created_by);

-- ---- products ----
DROP POLICY IF EXISTS "products_select"     ON public.products;
DROP POLICY IF EXISTS "products_insert"     ON public.products;
DROP POLICY IF EXISTS "products_update"     ON public.products;
DROP POLICY IF EXISTS "products_delete"     ON public.products;
DROP POLICY IF EXISTS "products_select_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

CREATE POLICY "products_select" ON public.products FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "products_insert" ON public.products FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "products_update" ON public.products FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "products_delete" ON public.products FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR (company_id IS NULL AND created_by = auth.uid()));
CREATE POLICY "products_select_own" ON public.products FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (auth.uid() = created_by);

-- ---- order_items (sin created_by — usa EXISTS en orders) ----
DROP POLICY IF EXISTS "order_items_select"     ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert"     ON public.order_items;
DROP POLICY IF EXISTS "order_items_update"     ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete"     ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_own" ON public.order_items;

CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR company_id IS NULL);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  WITH CHECK ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
           OR company_id IS NULL);
CREATE POLICY "order_items_update" ON public.order_items FOR UPDATE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR company_id IS NULL);
CREATE POLICY "order_items_delete" ON public.order_items FOR DELETE
  USING ((company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid()))
      OR company_id IS NULL);
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));
CREATE POLICY "order_items_update_own" ON public.order_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));
CREATE POLICY "order_items_delete_own" ON public.order_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid()));

-- ------------------------------------------------------------
-- 5. FUNCIÓN + TRIGGER: auto_assign_company
--    Asigna automáticamente la empresa 'sgo-construccion'
--    a cada nuevo usuario registrado (rol: admin).
--    SECURITY DEFINER para poder escribir en company_users
--    sin que el usuario nuevo tenga permisos todavía.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_assign_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE slug = 'sgo-construccion'
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    INSERT INTO public.company_users (company_id, user_id, role)
    VALUES (v_company_id, NEW.id, 'admin')
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_company();

-- ------------------------------------------------------------
-- 6. SEED: empresa inicial SGO Construcción
--    Idempotente — ON CONFLICT DO NOTHING
--    NOTA: DEFAULT_SELLERS se insertan automáticamente desde
--    useSellers.js cuando la tabla sellers está vacía,
--    con el company_id correcto del usuario autenticado.
-- ------------------------------------------------------------
INSERT INTO public.companies (name, slug, active)
VALUES ('SGO Construcción', 'sgo-construccion', true)
ON CONFLICT (slug) DO NOTHING;

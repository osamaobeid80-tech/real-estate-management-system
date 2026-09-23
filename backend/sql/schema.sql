-- ============================================
-- مخطط قاعدة البيانات الكامل - نظام إدارة العقارات
-- PostgreSQL 14+
-- تشغيل: psql -U postgres -d real_estate_db -f sql/schema.sql
--
-- النموذج العلائقي: properties (عقارات/مبانٍ) → units (وحدات، FK لعقار)
--                    → contracts (عقود إيجار، FK لوحدة) → payments (دفعات، FK لعقد ووحدة)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- لتوليد UUID عبر gen_random_uuid()

-- ===== جدول المستخدمين =====
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('مسؤول النظام','موظف إدخال بيانات','مستخدم عرض فقط')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== جدول العقارات (المباني/الأصول) =====
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name TEXT NOT NULL,
  property_type TEXT CHECK (property_type IN ('سكني','تجاري','مختلط','أرض')) DEFAULT 'سكني',
  address TEXT,
  city TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties (property_name, owner_name, city);

-- ===== جدول الوحدات (تابعة لعقار) =====
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_number TEXT NOT NULL,
  unit_type TEXT,
  floor TEXT,
  area_sqm NUMERIC,
  unit_status TEXT CHECK (unit_status IN ('مؤجرة','شاغرة','تحت الصيانة','محجوزة')) DEFAULT 'شاغرة',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_units_search ON units (unit_number);
CREATE INDEX IF NOT EXISTS idx_units_status ON units (unit_status);
CREATE INDEX IF NOT EXISTS idx_units_property ON units (property_id);

-- ===== جدول العقود (عقد إيجار مرتبط بوحدة واحدة) =====
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  contract_number TEXT,
  tenant_name TEXT,
  tenant_phone TEXT,
  tenant_id_number TEXT,
  rent_value NUMERIC,
  payment_installment NUMERIC,
  payment_frequency TEXT,
  due_date DATE,
  payments_count INT DEFAULT 0,
  payments_paid INT DEFAULT 0,
  contract_start_date DATE,
  contract_end_date DATE,
  contract_status TEXT CHECK (contract_status IN ('نشط','منتهي','ملغى')) DEFAULT 'نشط',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contracts_unit ON contracts (unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_search ON contracts (contract_number, tenant_name, tenant_phone);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (contract_status);

-- ===== جدول الدفعات (مرتبطة بعقد ووحدة) =====
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  contract_number TEXT,
  tenant_name TEXT,
  payment_number INT,
  amount NUMERIC,
  due_date DATE,
  paid_date DATE,
  status TEXT CHECK (status IN ('مدفوعة','مستحقة','متأخرة','ملغاة')) DEFAULT 'مستحقة',
  payment_method TEXT CHECK (payment_method IN ('نقدي','تحويل بنكي','شيك','بطاقة') OR payment_method IS NULL),
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_unit ON payments (unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments (contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_due ON payments (status, due_date);

-- ===== جدول الملاحظات =====
CREATE TABLE IF NOT EXISTS unit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  note_text TEXT,
  note_type TEXT CHECK (note_type IN ('عام','صيانة','شكوى','تنبيه استحقاق','تجديد عقد')),
  created_by TEXT,
  note_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_unit ON unit_notes (unit_id);

-- ===== سجل تدقيق مبسّط (اختياري - موصى به للامتثال) =====
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id),
  action TEXT NOT NULL,           -- create / update / delete
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ملاحظة ترحيل (Migration) لمن كان يستخدم النسخة القديمة (units بها حقول عقد/مستأجر مباشرة):
--   1) أنشئ جدول properties وأدخل عقارًا افتراضيًا واحدًا على الأقل.
--   2) أضف عمود property_id إلى units وحدّثه ليشير لذلك العقار الافتراضي:
--        ALTER TABLE units ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
--   3) انسخ بيانات العقد/المستأجر من كل صف units إلى صف جديد في contracts (unit_id = units.id).
--   4) احذف أعمدة العقد/المستأجر القديمة من units بعد التأكد من نجاح النسخ:
--        ALTER TABLE units DROP COLUMN contract_number, DROP COLUMN tenant_name, ...
--   5) أضف عمود contract_id إلى payments وحدّثه بمطابقة unit_id + contract_number.
-- ============================================

# Backend حقيقي — نظام إدارة العقارات (Node.js + Express + PostgreSQL + JWT)

> ⚠️ **مهم جدًا:** هذا الكود **لن يعمل تلقائيًا** ضمن هذا المشروع (وهو موقع Static Website مُستضاف بدون بيئة تشغيل Node.js). يجب نسخ هذا المجلد بالكامل ونشره على استضافة تدعم Node.js مثل: VPS خاص، Render، Railway، Fly.io، أو أي خادم يدعم Node.js 18+ و PostgreSQL.

هذا الخادم ينفّذ **مصادقة وصلاحيات حقيقية على مستوى الخادم** (وليس محاكاة في المتصفح كما في نسخة الواجهة الحالية الثابتة)، ويطابق تمامًا نموذج البيانات ومصفوفة الصلاحيات الموضّحة في `spec.html` بجذر المشروع.

## 🧱 المتطلبات
- Node.js 18 أو أحدث
- PostgreSQL 14 أو أحدث (محليًا أو سحابيًا: Neon / Supabase / Render / RDS...)

## 🚀 خطوات التشغيل

```bash
cd backend
npm install

# 1) أنشئ قاعدة بيانات PostgreSQL جديدة، ثم:
psql -U postgres -d real_estate_db -f sql/schema.sql
psql -U postgres -d real_estate_db -f sql/seed.sql   # بيانات تجريبية (اختياري) — يملأ properties + units + contracts معًا

# 2) انسخ ملف البيئة وعدّل القيم (رابط قاعدة البيانات + سر JWT)
cp .env.example .env

# 3) أنشئ أول مستخدم "مسؤول النظام" بكلمة مرور حقيقية مُجزّأة
npm run create-admin -- "عبدالله الحربي" "admin@example.com" "StrongPass123!" "مسؤول النظام"

# 4) شغّل الخادم
npm run dev      # للتطوير (إعادة تشغيل تلقائي)
# أو
npm start        # للإنتاج
```

الخادم يعمل افتراضيًا على: `http://localhost:4000`
فحص الصحة: `GET http://localhost:4000/health`

## 🔑 تسجيل الدخول والحصول على رمز JWT

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongPass123!"}'
```

الاستجابة تحوي `token` يجب إرساله في كل طلب لاحق:
```
Authorization: Bearer <token>
```

## 📡 نقاط النهاية المتاحة

| المسار | Method | الصلاحية المطلوبة |
|---|---|---|
| `/api/auth/login` | POST | عام |
| `/api/auth/me` | GET | مسجّل الدخول |
| `/api/properties` | GET | مسجّل الدخول (كل الأدوار) |
| `/api/properties` | POST/PATCH | مسؤول النظام، موظف إدخال بيانات |
| `/api/properties/:id` | DELETE | مسؤول النظام فقط (يفصل الوحدات المرتبطة بدل حذفها) |
| `/api/units` | GET | مسجّل الدخول (كل الأدوار) — يدعم `?property_id=` |
| `/api/units` | POST/PATCH | مسؤول النظام، موظف إدخال بيانات |
| `/api/units/:id` | DELETE | مسؤول النظام فقط (يُرفض إن وُجد عقد نشط على الوحدة) |
| `/api/contracts` | GET | مسجّل الدخول (كل الأدوار) — يدعم `?unit_id=` و`?status=` |
| `/api/contracts` | POST | مسؤول النظام، موظف إدخال بيانات (يُحدّث حالة الوحدة تلقائيًا إلى "مؤجرة") |
| `/api/contracts` | PATCH | مسؤول النظام، موظف إدخال بيانات |
| `/api/contracts/:id` | DELETE | مسؤول النظام فقط |
| `/api/payments` | GET | مسجّل الدخول (كل الأدوار) — يدعم `?unit_id=` و`?contract_id=` |
| `/api/payments` | POST/PATCH | مسؤول النظام، موظف إدخال بيانات |
| `/api/payments/:id` | DELETE | مسؤول النظام فقط |
| `/api/unit-notes` | GET/POST | مسجّل الدخول / محرر |
| `/api/unit-notes/:id` | DELETE | مسؤول النظام فقط |
| `/api/users` | كل العمليات | مسؤول النظام فقط |
| `/api/reports/occupancy`, `/unit-types`, `/payment-status`, `/avg-rent` | GET | مسجّل الدخول — تجميعات SQL على الخادم |
| `/api/reports/revenue`, `/upcoming-dues`, `/overdue` | GET | مسجّل الدخول — تقارير SQL على الخادم |
| `/api/reports/export?format=pdf` | GET | مسجّل الدخول — إنشاء PDF على الخادم |

جميع القيود أعلاه **مفروضة داخل middleware الخادم** (`src/middleware/auth.js`) عبر فحص توقيع JWT والدور المخزَّن فيه — وهي حماية فعلية حقيقية، بخلاف محاكاة الأدوار في نسخة الواجهة الثابتة الحالية. شاشة تقارير React تستخدم هذه التجميعات الخادمية، ولا تحمل جداول الوحدات والمدفوعات كاملة إلى المتصفح.

تصدير PDF يُنفَّذ داخل الخادم عبر `pdfkit` بعد قراءة التجميعات من PostgreSQL. أما SMS/Email التلقائي فيحتاج ربط مزود خارجي (مثل SMTP/Twilio) ومهمة مجدولة، لذلك لا تُحفظ أي مفاتيح مزود داخل الواجهة. النسخ الاحتياطي المجدول مسؤولية قاعدة البيانات المستضافة أو خدمة التشغيل؛ الإعداد الموصى به موثق في `spec.html#security`.

## 🔗 ربط هذا الـ Backend بالواجهة الأمامية الحالية (اختياري)

الواجهة الحالية في هذا المشروع (`js/data.js`) تتحدث مع RESTful Table API المدمج في المنصة عبر مسارات مثل `tables/units`. لربطها بهذا الـ Backend الجديد بدلاً من ذلك:
1. غيّر عنوان القاعدة في `js/data.js` من `tables/` إلى `https://your-backend-domain.com/api/`.
2. أضف تسجيل دخول فعلي (شاشة Login) يخزّن JWT في `localStorage` ويرفقه في كل طلب `fetch` عبر ترويسة `Authorization`.
3. عدّل مسارات الجداول: `units` → `units`، `payments` → `payments`، `unit_notes` → `unit-notes` (لاحظ الشَّرطة).

## 🛡️ توصيات تعزيز أمني قبل الإنتاج (Production Hardening)
- فعّل HTTPS إلزاميًا (عبر Nginx/Caddy أمام Node، أو مباشرة على مزود الاستضافة).
- أضف Rate Limiting (مثل `express-rate-limit`) على `/api/auth/login` لمنع هجمات التخمين.
- أضف Refresh Tokens بدل الاعتماد على توكن واحد طويل الصلاحية.
- فعّل نسخ احتياطي تلقائي يومي لقاعدة PostgreSQL (`pg_dump` مجدول أو خدمة النسخ الاحتياطي لدى المزود).
- سجّل كل عمليات الإضافة/التعديل/الحذف في جدول `audit_log` (الجدول جاهز في `sql/schema.sql`).
- راجع القسم الكامل "الأمن والامتثال" في `../spec.html#security` من جذر المشروع.

## 📁 هيكل المجلد
```
backend/
├─ package.json
├─ .env.example
├─ README.md                 (هذا الملف)
├─ sql/
│  ├─ schema.sql              مخطط قاعدة البيانات الكامل
│  └─ seed.sql                بيانات تجريبية (بدون مستخدمين)
├─ scripts/
│  └─ create-admin.js         إنشاء أول مستخدم مسؤول بأمان
└─ src/
   ├─ index.js                نقطة انطلاق الخادم
   ├─ db.js                   اتصال PostgreSQL
   ├─ middleware/
   │  └─ auth.js              JWT + RBAC حقيقي
   └─ routes/
      ├─ auth.routes.js
      ├─ properties.routes.js  (جديد)
      ├─ units.routes.js
      ├─ contracts.routes.js   (جديد)
      ├─ payments.routes.js
      ├─ notes.routes.js
      ├─ users.routes.js
      └─ reports.routes.js
```

## 🔀 نموذج البيانات العلائقي (Properties → Units → Contracts → Payments)

```
properties (عقار/مبنى)
   └─ units (وحدة، property_id FK)
         └─ contracts (عقد إيجار، unit_id FK — عقد واحد نشط لكل وحدة عادة)
               └─ payments (دفعة، unit_id + contract_id FK)
```

هذا يطابق تمامًا فصل الشاشات في الواجهة الثابتة (`properties.html`, `units.html`, `contracts.html`) والواجهة React (`Properties.jsx`, `Units.jsx`, `Contracts.jsx`).

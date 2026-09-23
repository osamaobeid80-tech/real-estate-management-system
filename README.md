# نظام إدارة العقارات — مكتب عقاري صغير

تطبيق ويب متجاوب (Responsive PWA) لإدارة عقود ووحدات مكتب عقاري صغير: تتبّع المستأجرين، قيمة الإيجارات، الدفعات الدورية، تواريخ الاستحقاق، الملاحظات التشغيلية، والتقارير — مع **وثيقة مواصفات تنفيذية كاملة** قابلة للتنفيذ بأي فريق تقني.

## 🎯 هدف المشروع
تمكين مكتب عقاري صغير من إدارة وحداته وعقوده ومدفوعاته من واجهة واحدة سهلة، تعمل على كل الأجهزة (Windows, macOS, Android, iPhone/iPad) وكل المتصفحات الحديثة (Chrome, Edge, Safari, Firefox)، دون الحاجة لتطبيقات منفصلة لكل نظام تشغيل.

---

## 🗺️ خريطة الصفحات (Sitemap)

| الصفحة | المسار | الوصف |
|---|---|---|
| لوحة التحكم | `index.html` | إحصائيات، تنبيهات استحقاق، رسوم بيانية للإيرادات وحالة الوحدات |
| **العقارات** | `properties.html` | قائمة العقارات/المباني، بحث، فلترة بالنوع، إضافة/تعديل/حذف، عرض عدد الوحدات لكل عقار |
| الوحدات | `units.html` أو `units.html?property={id}` | قائمة الوحدات (تابعة لعقار)، بحث، فلترة بالعقار/الحالة/النوع، إضافة/تعديل/حذف |
| **العقود** | `contracts.html` | قائمة عقود الإيجار (كل عقد مرتبط بوحدة واحدة)، بحث، فلترة بالحالة، إضافة/تعديل/حذف |
| تفاصيل الوحدة | `unit-detail.html?id={id}` | بيانات الوحدة + العقد المرتبط بها، جدول الدفعات، تسجيل سداد، الملاحظات |
| إدارة المدفوعات | `payments.html` | كل الدفعات عبر جميع الوحدات، فلترة بالحالة، تسجيل سداد سريع |
| التقارير | `reports.html` | رسوم بيانية (إشغال، أنواع الوحدات، إيرادات شهرية، دفعات متأخرة)، تصدير CSV |
| الإعدادات والمستخدمون | `settings.html` | إدارة المستخدمين، تبديل دور المعاينة، مصفوفة الصلاحيات، تنبيه أمني |
| **وثيقة المواصفات التنفيذية** | `spec.html` | ERD، تصميم API، مقارنة تقنيات، أمان، اختبار، نشر — للمطوّر/العميل |
| **طريقة التثبيت على الجوال** | `install-guide.html` | خطوات تثبيت PWA على Android/iOS/Windows/macOS + زر تثبيت مباشر |

> جميع الصفحات تشترك بنفس الهيكل (Sidebar + Topbar + Bottom Nav على الجوال) عبر `js/app.js` و `css/app.css`.

---

## ✅ الميزات المكتملة

- **PWA كامل**: `manifest.json` + `service-worker.js` — قابل للتثبيت على سطح المكتب والجوال (Add to Home Screen).
- **تصميم Responsive بالكامل**: من 360px (هاتف) حتى شاشات سطح المكتب الكبيرة، مع تبديل تلقائي بين جدول (Desktop) وبطاقات (Mobile) في شاشة الوحدات.
- **واجهة عربية RTL كاملة** بخط Cairo، مع تباين ألوان مقروء.
- **نموذج بيانات علائقي مفصول**: `properties` (عقارات/مبانٍ) ← `units` (وحدات) ← `contracts` (عقود إيجار) ← `payments` (دفعات)، بدلاً من دمج كل شيء في جدول وحدات واحد.
- **إدارة العقارات (CRUD كامل)**: إضافة، تعديل، حذف عقار (مع تحذير عند وجود وحدات مرتبطة)، عرض عدد الوحدات وربط مباشر لقائمة وحدات كل عقار.
- **إدارة الوحدات (CRUD كامل)**: إضافة، تعديل، حذف (مع منع حذف وحدة لها عقد نشط)، بحث فوري، فلترة بالعقار/الحالة/النوع.
- **إدارة العقود (CRUD كامل)**: إضافة عقد لوحدة شاغرة (تُحدَّث حالة الوحدة تلقائيًا إلى "مؤجرة")، تعديل، حذف، فلترة بالحالة.
- **تفاصيل الوحدة**: عرض بيانات الوحدة والعقار التابعة له والعقد المرتبط بها، نسبة السداد كشريط تقدّم، جدول الدفعات الكامل، تسجيل سداد دفعة بضغطة، إضافة/عرض الملاحظات.
- **إدارة المدفوعات المركزية**: عرض كل الدفعات عبر كل الوحدات مع تمييز "متأخرة" تلقائيًا حسب التاريخ.
- **تقارير تفاعلية (Chart.js)**: نسبة الإشغال، توزيع أنواع الوحدات، الإيرادات الشهرية، حالة الدفعات، مع جلب التجميعات من PostgreSQL في نسخة React/Backend.
- **محاكاة أدوار وصلاحيات** (عرض فقط للتجربة) مع تعطيل واضح لأزرار الإضافة/الحذف حسب الدور المختار.
- **وثيقة مواصفات تنفيذية شاملة (`spec.html`)** تغطي: نطاق النظام والمنصات، ERD، تصميم API كامل (Endpoints, صيغ الإدخال/الإخراج, المصادقة)، 3 مجموعات تقنية بديلة مع مقارنة، الأمن والامتثال (PDPL)، بيانات اختبار مفصّلة (11 سجلًا)، خطة اختبار جودة، وخطة نشر/صيانة.
- **6 جداول بيانات فعلية** مع بيانات تجريبية حقيقية: `properties` (5 عقارات)، `units` (11 وحدة)، `contracts` (9 عقود)، `payments` (20 دفعة)، `unit_notes` (5 ملاحظات)، `app_users` (3 مستخدمين).

## ⚠️ ميزات غير مُنفَّذة حاليًا (ولماذا)

هذا تطبيق **Static Website** (بدون خادم Backend حقيقي)، وبالتالي لا يمكن تنفيذ:
- **مصادقة حقيقية (Login/Password) وصلاحيات مفروضة من خادم**: خيار "تبديل الدور" في الإعدادات هو محاكاة عرض فقط لأغراض تجربة الواجهات، ومُصرَّح بذلك بوضوح داخل شاشة الإعدادات ووثيقة المواصفات (قسم الأمن).
- **تقارير مجمّعة على الخادم (Server-side Aggregation)** لبيانات ضخمة — التقارير الحالية تُحسب في المتصفح مباشرة، وهو كافٍ تمامًا لحجم بيانات مكتب صغير.
- **تصدير PDF أو إرسال تنبيهات SMS/Email تلقائية** — تتطلب معالجة/تكامل من طرف خادم.
- **نسخ احتياطي تلقائي مجدول** — تُدار تلقائيًا من طبقة قاعدة البيانات المستضافة عند النشر، وتفاصيلها موضّحة في `spec.html`.

## 🚀 خطوات التطوير الموصى بها (Next Steps)
1. إذا نمت أعمال المكتب لأكثر من مكتب/فرع واحد، أو احتجت لصلاحيات ومصادقة حقيقية → استخدم Backend الحقيقي الجاهز في مجلد `/backend` (Node.js + PostgreSQL + JWT) بعد نشره على استضافة تدعم Node.js.
2. أضف رقم هوية/جوال مُقنَّع (Masking) في الواجهة العامة تطبيقًا لمبدأ تقليل البيانات في PDPL.
3. عند التوسع، استخدم نقاط التقارير التجميعية الجاهزة في `backend/src/routes/reports.routes.js` بدلاً من الحساب في المتصفح.
4. أضف اختبارات آلية (Playwright/Cypress) لتدفقات المستخدم الأساسية قبل كل نشر.

## 📱 طريقة التثبيت على الجوال (Mobile Installation)
تفاصيل الخطوات الكاملة مع لقطات توضيحية داخل التطبيق نفسه في صفحة **`install-guide.html`** (متاحة من القائمة الجانبية "تثبيت التطبيق على الجوال"). ملخص سريع:
- **Android**: افتح الرابط في Chrome ← قائمة ⋮ ← "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".
- **iPhone/iPad**: افتح الرابط في **Safari** (إلزامي) ← زر المشاركة (Share) ← "إضافة إلى الشاشة الرئيسية".
- **Windows/macOS**: افتح الرابط في Chrome/Edge ← أيقونة التثبيت ⊕ في شريط العنوان ← "تثبيت".

## 🖥️ Backend حقيقي كامل (`/backend`)
تم إضافة كود Backend فعلي وكامل — **Node.js + Express + PostgreSQL + JWT** — في مجلد `backend/` بجذر هذا المشروع، يطابق تمامًا نموذج البيانات ومصفوفة الصلاحيات الموضّحة في `spec.html`. يتضمن:
- مخطط SQL كامل (`backend/sql/schema.sql`) وبيانات تجريبية (`backend/sql/seed.sql`)
- مصادقة حقيقية بـ JWT + تجزيء كلمات مرور bcrypt (`backend/src/routes/auth.routes.js`)
- فرض صلاحيات (RBAC) حقيقي على مستوى الخادم لكل نقطة API (`backend/src/middleware/auth.js`)
- نقاط نهاية CRUD كاملة للوحدات، المدفوعات، الملاحظات، المستخدمين، وتقارير مجمّعة على قاعدة البيانات
- توثيق تشغيل خطوة بخطوة في `backend/README.md`

> ⚠️ **تنبيه ضروري**: هذا المشروع (الواجهة الحالية) هو **Static Website** مُستضاف على بنية لا تُشغّل Node.js. كود `/backend` **لن يعمل تلقائيًا هنا** — يجب نسخه ونشره على استضافة مستقلة تدعم Node.js وPostgreSQL (مثل VPS خاص، Render، Railway، أو Fly.io) قبل ربطه بالواجهة.

## ⚛️ واجهة React كاملة (`/frontend-react`) — تكملة مجموعة Node.js + Express + PostgreSQL + React

بالإضافة إلى الـ Backend، تم بناء **واجهة أمامية React + Vite حقيقية وكاملة** في مجلد `frontend-react/` تتصل مباشرة بـ `backend/` عبر REST API حقيقي (وليست نسخة الموقع الثابت التي تستخدم RESTful Table API). بهذا تكتمل مجموعة التقنية الأولى المذكورة في `spec.html`: **Node.js + Express + PostgreSQL + React**. تتضمن:

- مصادقة حقيقية عبر JWT (تسجيل دخول فعلي `/login` يتصل بـ `backend/src/routes/auth.routes.js`، وليس محاكاة دور كما في الموقع الثابت)
- React Router v6 لكل الصفحات: لوحة تحكم، وحدات (CRUD كامل)، تفاصيل وحدة، مدفوعات، تقارير (Chart.js)، إعدادات ومستخدمين (لمسؤول النظام فقط)
- طبقة اتصال Axios مع حقن تلقائي لرمز JWT ومعالجة انتهاء الجلسة (401)
- نفس هوية التصميم (الألوان، الخطوط، مكوّنات الجدول/البطاقات/الشارات) الموجودة في `css/app.css` للموقع الثابت، منسوخة إلى `frontend-react/src/styles/index.css`
- توثيق تشغيل كامل في `frontend-react/README.md`

> ⚠️ **تنبيه**: تمامًا مثل `/backend`، هذا كود React حقيقي وكامل لكن **لم يُشغَّل أو يُبنَ فعليًا داخل هذه البيئة** (بيئة مواقع ثابتة لا تُنفّذ `npm install`/`vite`). انسخ المجلد وشغّله على جهازك أو استضافة تدعم Node.js حسب خطوات `frontend-react/README.md`.

---

## 🐳 تشغيل الحزمة الكاملة معًا عبر Docker Compose

تمت إضافة `docker-compose.yml` في جذر المشروع لتشغيل **PostgreSQL + Backend (Node.js/Express) + Frontend (React مبني وخلف Nginx)** معًا بأمر واحد على أي جهاز يدعم Docker (⚠️ ليس داخل بيئة هذا المحرر — انسخ المشروع إلى جهازك/خادمك أولًا).

### الملفات المضافة
- `docker-compose.yml` (جذر المشروع) — يعرّف 3 خدمات: `db`، `backend`، `frontend`.
- `backend/Dockerfile` + `backend/.dockerignore` — يبني صورة Node.js 18 لخادم الـ API.
- `frontend-react/Dockerfile` + `frontend-react/nginx.conf` + `frontend-react/.dockerignore` — يبني الواجهة (`npm run build`) ثم يقدّمها عبر Nginx، ويمرّر `/api/*` داخليًا لحاوية `backend`.
- `.env.docker.example` — نموذج متغيرات البيئة (كلمة مرور قاعدة البيانات، سرّ JWT، المنافذ).

### خطوات التشغيل (على جهازك/خادمك بعد تثبيت Docker + Docker Compose)
```bash
# 1) انسخ ملف بيئة Docker وعدّل القيم (إلزامي: كلمة مرور DB وسر JWT)
cp .env.docker.example .env.docker

# 2) ابنِ الصور وشغّل كل الخدمات في الخلفية
docker compose --env-file .env.docker up -d --build

# 3) أنشئ أول مستخدم "مسؤول النظام" (مرة واحدة فقط)
docker compose exec backend npm run create-admin -- "الاسم الكامل" "admin@example.com" "StrongPass123!" "مسؤول النظام"

# 4) افتح المتصفح
# الواجهة (React): http://localhost:8080
# الـ API مباشرة (اختياري للاختبار): http://localhost:4000/health
```

قاعدة البيانات تُهيَّأ تلقائيًا عند أول تشغيل عبر `backend/sql/schema.sql` ثم `backend/sql/seed.sql` (تُنفَّذ من طرف صورة PostgreSQL الرسمية تلقائيًا لأنها فارغة في أول مرة). لإيقاف كل شيء: `docker compose down` (أضف `-v` لحذف بيانات القاعدة أيضًا).

> ⚠️ هذا الإعداد **منفصل تمامًا** عن الموقع الثابت في جذر المشروع (الذي يستخدم RESTful Table API) — هو فقط لتشغيل مجموعة **Node.js + Express + PostgreSQL + React** الحقيقية المذكورة أعلاه بشكل متكامل ومحلي/على خادمك الخاص.

---

## 🗄️ نموذج البيانات (الجداول الفعلية في هذا المشروع)

النموذج علائقي مفصول: **عقار ← وحدات ← عقود ← دفعات** (كل سهم يمثّل علاقة "واحد لعدة" عبر مفتاح أجنبي `*_id`).

### `properties` — العقارات (المباني/الأصول)
`id, property_name, property_type, address, city, owner_name, owner_phone, notes`

### `units` — الوحدات (تابعة لعقار)
`id, property_id (FK → properties), unit_number, unit_type, floor, area_sqm, unit_status, notes`

> ملاحظة: لا تحتوي `units` بعد الآن على بيانات المستأجر/الإيجار/العقد — تلك انتقلت إلى `contracts`. الحقول القديمة (`contract_number`, `tenant_name`, `rent_value`, ...) ما زالت موجودة في تعريف الجدول لأغراض التوافق فقط ولا تُملأ ببيانات جديدة.

### `contracts` — عقود الإيجار (عقد واحد لكل وحدة)
`id, unit_id (FK → units), contract_number, tenant_name, tenant_phone, tenant_id_number, rent_value, payment_installment, payment_frequency, due_date, payments_count, payments_paid, contract_start_date, contract_end_date, contract_status, notes`

### `payments` — الدفعات
`id, unit_id (FK), contract_id (FK → contracts), contract_number, tenant_name, payment_number, amount, due_date, paid_date, status, payment_method, receipt_number, notes`

### `unit_notes` — الملاحظات
`id, unit_id (FK), note_text, note_type, created_by, note_date`

### `app_users` — المستخدمون
`id, full_name, email, phone, role, active`

> الوصول لهذه الجداول عبر RESTful Table API القياسي: `GET/POST/PUT/PATCH/DELETE /tables/{table_name}`. التفاصيل الكاملة (بما فيها تصميم Backend مستقل مستقبلي) موجودة في `spec.html#api`.

---

## 🌐 الروابط العامة
- بعد النشر عبر تبويب **Publish**: `https://<project>.gensparkspace.com`
- وثيقة المواصفات التنفيذية: `/spec.html`
- لوحة التحكم (الصفحة الرئيسية): `/index.html`

## 🛠️ التقنيات المستخدمة في هذا التسليم
- HTML5 + CSS3 مخصص (بدون إطار CSS خارجي ضخم لأداء أسرع) + Font Awesome 6 + خط Cairo (Google Fonts)
- Vanilla JavaScript (ES6) — بدون إطار عمل، لأداء وحمولة تحميل أقل
- Chart.js لكل الرسوم البيانية
- RESTful Table API (مدمج في المنصة) لتخزين واسترجاع البيانات
- PWA: Web App Manifest + Service Worker (استراتيجية Cache-first للملفات الثابتة، Network-first لبيانات الجداول)

## 📁 هيكل الملفات
```
index.html            لوحة التحكم
properties.html       قائمة العقارات (CRUD)
units.html            قائمة الوحدات (CRUD) — يدعم ?property={id}
contracts.html        قائمة العقود (CRUD)
unit-detail.html      تفاصيل الوحدة + العقد + الدفعات + الملاحظات
payments.html         إدارة المدفوعات المركزية
reports.html          التقارير والرسوم البيانية
settings.html         الإعدادات والمستخدمون
spec.html             وثيقة المواصفات التنفيذية الكاملة
manifest.json         PWA manifest
service-worker.js     Service Worker
css/
  ├─ app.css          تنسيقات التطبيق المشتركة
  └─ spec.css         تنسيقات وثيقة المواصفات
js/
  ├─ app.js           هيكل الصفحة، التنقل، الأدوار، Toast/Modal
  └─ data.js          طبقة الاتصال بـ RESTful Table API
images/
  └─ icon-192.png / icon-512.png   أيقونات PWA
install-guide.html     دليل التثبيت التفاعلي على الجوال
backend/               Backend حقيقي كامل (Node.js + Express + PostgreSQL + JWT) — يتطلب استضافة Node.js مستقلة
  ├─ README.md         توثيق تشغيل الخادم خطوة بخطوة
  ├─ Dockerfile         صورة Docker لخادم Node.js
  ├─ sql/              مخطط قاعدة البيانات (properties/units/contracts/payments) والبيانات التجريبية
  └─ src/               كود الخادم (auth, properties, units, contracts, payments, notes, users, reports)
frontend-react/        واجهة React + Vite حقيقية (تتصل بـ backend/) — يتطلب استضافة Node.js مستقلة
  ├─ Dockerfile         بناء متعدد المراحل (Vite build → Nginx)
  └─ nginx.conf          إعداد تقديم الملفات + تمرير /api لحاوية backend
docker-compose.yml      تشغيل db + backend + frontend-react معًا بأمر واحد (Docker)
.env.docker.example     نموذج متغيرات بيئة Docker Compose
```

---
**آخر تحديث:** تسليم أولي كامل يغطي جميع المتطلبات المذكورة في طلب المواصفات التنفيذية.
## Project URL

https://github.com/osamaobeid80-tech/real-estate-management-system

# الواجهة الأمامية React — نظام إدارة العقارات

> ⚠️ **مهم:** هذا مشروع **React + Vite** حقيقي وكامل يجب تشغيله وبناؤه خارج هذه البيئة (Static Website Sandbox لا تُنفّذ Node.js/`npm install`/`vite build`). انسخ هذا المجلد كاملًا إلى جهازك أو استضافة تدعم Node.js (Vercel, Netlify, Render Static Site, VPS...) لتشغيله فعليًا.

يُكمل هذا المجلد مجموعة التقنيات **Node.js + Express + PostgreSQL + React** المذكورة في `spec.html` كأحد البدائل التقنية — فهو الواجهة الأمامية (Frontend) الحقيقية التي تتصل مباشرة بالـ Backend الموجود في `backend/` عبر REST API حقيقي (وليس عبر RESTful Table API الخاص بالموقع الثابت).

---

## 🧱 المتطلبات

- Node.js 18 أو أحدث + npm
- تشغيل مسبق لمجلد `backend/` (راجع `backend/README.md`) على `http://localhost:4000` أو أي رابط آخر

## 🚀 خطوات التشغيل

```bash
cd frontend-react
npm install

# انسخ ملف البيئة وعدّل الرابط إذا لزم (اتركه فارغًا لاستخدام Vite Proxy تلقائيًا في وضع التطوير)
cp .env.example .env

npm run dev       # وضع التطوير: http://localhost:5173 (يحوّل /api تلقائيًا إلى http://localhost:4000)
```

### البناء للإنتاج

```bash
npm run build      # ينتج مجلد dist/ جاهز للنشر على أي استضافة ملفات ثابتة
npm run preview    # معاينة الإنتاج محليًا
```

عند النشر على استضافة منفصلة عن الـ Backend، اضبط في `.env`:
```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```
وتأكد من ضبط `CORS_ORIGIN` في `backend/.env` ليطابق رابط استضافة الواجهة.

---

## 🔑 تسجيل الدخول

استخدم بيانات المستخدم الذي أنشأته عبر `backend/scripts/create-admin.js`:

```bash
# داخل مجلد backend
npm run create-admin -- "الاسم" "email@example.com" "كلمة المرور" "مسؤول النظام"
```

ثم سجّل الدخول من شاشة `/login` بنفس البريد وكلمة المرور. عند نجاح الدخول يُخزَّن رمز JWT في `localStorage` (`reams_token`) ويُرفَق تلقائيًا في كل الطلبات اللاحقة عبر Axios Interceptor، ويُحذف تلقائيًا مع إعادة التوجيه لصفحة الدخول عند استجابة 401.

---

## 🗂️ هيكل المشروع

```
frontend-react/
├── index.html
├── package.json
├── vite.config.js          # منفذ 5173 + Proxy لـ /api → localhost:4000
├── .env.example
└── src/
    ├── main.jsx             # نقطة الدخول: Router + ToastProvider + AuthProvider
    ├── App.jsx              # كل المسارات (Routes)
    ├── api/
    │   ├── client.js        # axios instance + حقن JWT + معالجة 401
    │   └── services.js      # AuthAPI, UnitsAPI, PaymentsAPI, NotesAPI, UsersAPI, ReportsAPI
    ├── context/
    │   ├── AuthContext.jsx  # حالة تسجيل الدخول + isAdmin/canEdit/canDelete
    │   └── ToastContext.jsx # تنبيهات نجاح/خطأ
    ├── components/
    │   ├── Layout.jsx           # Sidebar + Topbar + Bottom Nav (نفس هوية الموقع الثابت)
    │   ├── Modal.jsx
    │   ├── StatusBadge.jsx
    │   ├── EmptyState.jsx
    │   └── ProtectedRoute.jsx   # حماية مسارات على مستوى الواجهة فقط (تجربة مستخدم)
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx     # إحصائيات + Chart.js (Doughnut/Bar)
    │   ├── Units.jsx         # CRUD كامل للوحدات
    │   ├── UnitDetail.jsx    # تفاصيل وحدة + دفعات + ملاحظات
    │   ├── Payments.jsx      # إدارة مدفوعات مركزية
    │   ├── Reports.jsx       # تقارير Chart.js + تصدير CSV
    │   ├── Settings.jsx      # إدارة مستخدمين (مسؤول النظام فقط)
    │   └── NotFound.jsx
    ├── utils/helpers.js      # تنسيق عملة/تاريخ، استخراج رسائل الأخطاء
    └── styles/index.css      # نفس متغيرات ولغة تصميم css/app.css بالموقع الثابت + إضافات React
```

---

## 🔗 الربط بالـ Backend

جدول تطابق الخدمات مع نقاط الـ API الحقيقية (`backend/src/index.js`):

| ملف الخدمة | القاعدة | يطابق |
|---|---|---|
| `AuthAPI` | `/api/auth` | `backend/src/routes/auth.routes.js` |
| `UnitsAPI` | `/api/units` | `backend/src/routes/units.routes.js` |
| `PaymentsAPI` | `/api/payments` | `backend/src/routes/payments.routes.js` |
| `NotesAPI` | `/api/unit-notes` (ملاحظة: بشرطة، ليس شرطة سفلية) | `backend/src/routes/notes.routes.js` |
| `UsersAPI` | `/api/users` | `backend/src/routes/users.routes.js` |
| `ReportsAPI` | `/api/reports` | `backend/src/routes/reports.routes.js` |

## 🔐 ملاحظة أمنية مهمة

- كل صلاحيات الأدوار (إضافة/تعديل/حذف) **مفروضة فعليًا من الخادم** عبر `requireAuth` و`requireRole` في `backend/src/middleware/auth.js` — وليست مجرد إخفاء أزرار في الواجهة.
- `ProtectedRoute.jsx` في الواجهة يُخفي المسارات لتحسين تجربة الاستخدام فقط؛ أي محاولة وصول مباشر لنقطة API بدون رمز JWT صالح أو بدور غير مسموح به تُرفض بكود 401/403 من الخادم نفسه.
- لا تُخزَّن كلمة المرور أبدًا في الواجهة؛ فقط رمز JWT المُوقَّع (صالح لفترة محدودة حسب `JWT_EXPIRES_IN`).

## ⚠️ حدود بيئة التطوير الحالية (Sandbox)

هذه الواجهة **لم يتم تشغيلها أو بناؤها فعليًا** داخل بيئة العمل الحالية لأنها بيئة مواقع ثابتة فقط (لا تدعم Node.js/npm/Vite). كل الأكواد المُسلَّمة هنا كود React حقيقي وكامل وقابل للتشغيل، لكنه يحتاج نقله إلى جهاز أو استضافة تدعم Node.js لتثبيت الحزم (`npm install`) وتشغيله (`npm run dev` / `npm run build`) والتحقق البصري منه.

## 📌 الخطوات التالية المقترحة

1. انشر `backend/` على استضافة Node.js (Render/Railway/Fly.io/VPS) واحصل على رابط API عام.
2. انشر `frontend-react/` (بعد `npm run build`) كموقع ثابت (Vercel/Netlify/Cloudflare Pages) مع ضبط `VITE_API_BASE_URL` على رابط الـ Backend.
3. فعّل HTTPS في كلا الطرفين وقيّد `CORS_ORIGIN` في الخادم على رابط الواجهة فقط.
4. أضف اختبارات آلية (Vitest + React Testing Library) للمكونات الحرجة قبل أي نشر إنتاجي.

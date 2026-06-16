# 🎯 **OpenCode AI Agent - Project Audit Prompt**

## **المهمة: فحص شامل لمشروع ADCN Nutrition-OS**

أنت **OpenCode**، وكيل برمجة بالذكاء الاصطناعي مفتوح المصدر. قم بفحص شامل للمشروع وتقييم شامل لجميع الجوانب.

---

## **📁 معلومات المشروع:**

**اسم المشروع:** ADCN Nutrition-OS  
**الوصف:** منظومة تغذية طبية متكاملة (Medical Nutrition System)  
**التقنيات المستخدمة:**
- **Frontend:** React + Vite + TailwindCSS (Patient App)
- **Backend:** Cloudflare Workers + TypeScript
- **Database:** WatermelonDB (IndexedDB for Offline) + SQLite
- **Storage:** Cloudflare R2
- **CDN:** Cloudflare CDN
- **Image Processing:** Sharp (WebP Compression)

---

## **🔍 مراحل الفحص:**

### **1. فحص البنية (Architecture Audit)**

```bash
# نفذ الأوامر التالية:
ls -la
find . -type f -name "*.ts" | wc -l
find . -type f -name "*.tsx" | wc -l
find . -type f -name "*.json" | wc -l
```

**الفحص المطلوب:**
- [ ] تحليل بنية المشروع (Project Structure)
- [ ] عدد الملفات (Typescript, React, Config)
- [ ] تنظيم الملفات (Folders organization)
- [ ] فصل الـ layers (Frontend, Backend, Database)
- [ ] التأكد من وجود المجلدات الرئيسية: `src/`, `patient-app/`, `app/`, `assets/`

---

### **2. فحص Database Schema**

```bash
# فحص جداول Database
cat src/database/schema.ts | head -100
```

**الفحص المطلوب:**
- [ ] **27 جداول** مكتملة؟
  - Core: patients, medical_histories, social_histories, medications, supplements, lab_results, physical_exam_items, calculations, interventions, follow_up_visits
  - Pediatric: pediatric_growth_charts, pediatric_malnutrition_criteria, stamp_pediatric_screenings
  - ICU: icu_admissions, icu_monitoring, icu_nutrition_assessments, icu_prescriptions, icu_complications, icu_formulas, icu_patient_records, icu_transitions
  - Specialized: discharge_summaries, laboratory_records
  - Food: foods, recipes
  - CDSS: clinical_alerts, clinical_guidelines, clinical_recommendations
  - Patient App: patient_food_logs, patient_glucose_logs, patient_weight_logs, patient_medication_logs, patient_appointments, patient_education_content
  - FHIR/Wearables: fhir_nutrition_orders, fhir_nutrition_statuses, cgm_data, smart_scale_data, wearable_data, vitals_records, genetic_profiles, meal_plans, nutritional_plans, settings, audit_logs, test_catalogs, test_reference_ranges, nutrition_templates, food_contraindication_filters, food_items
- [ ] **Indexes** صحيحة؟ (Performance optimization)
- [ ] **Foreign Keys** صحيحة؟ (Relations)
- [ ] **AR+EN Bilingual** في كل الحقول النصية؟
- [ ] **Data Types** صحيحة؟ (TEXT, REAL, INTEGER, BOOLEAN)

---

### **3. فحص WatermelonDB Models**

```bash
# فحص Models
ls src/data/models/
wc -l src/data/models/*.ts
head -30 src/data/models/Patient.ts
```

**الفحص المطلوب:**
- [ ] **جميع Models** مكتملة وتطابق الـ Schema؟
- [ ] **Relations** صحيحة؟ (belongsTo, hasMany)
- [ ] **Accessors** (Typed properties باستخدام `@field`, `@date`, `@readonly`) موجودة؟
- [ ] **Computed properties** موجودة؟
- [ ] **TypeScript types** صحيحة؟ (no `any`)
- [ ] **schema** يطابق Database Schema في `src/database/schema.ts`؟

---

### **4. فحص Seed Data**

```bash
# فحص Seed Data
ls src/database/seed/
head -30 src/database/seed/seedData.ts
```

**الفحص المطلوب:**
- [ ] **5000+ Foods** موجودة؟
- [ ] **10000+ Recipes** موجودة؟
- [ ] **200+ Clinical Guidelines** موجودة؟
- [ ] **500+ Clinical Alerts** موجودة؟
- [ ] **300+ Clinical Recommendations** موجودة؟
- [ ] **97+ Nutrition Templates** موجودة؟
- [ ] **500+ Food Contraindication Filters** موجودة؟
- [ ] **AR+EN Bilingual** في كل الحقول؟
- [ ] **Nutritional data** صحيحة؟ (calories, protein, carbs, fat, fiber)

---

### **5. فحص Image Compression**

```bash
# فحص Image Compression Service
cat src/cdn/services/ImageCompressionService.ts
```

**الفحص المطلوب:**
- [ ] **WebP Compression** مُطبّق؟
- [ ] **Quality 80%** مُطبّق؟
- [ ] **Compression Ratio > 90%**؟
- [ ] **Thumbnails** (50x50 for Foods, 80x80 for Recipes) موجودة؟
- [ ] **Multi-Format Support** (JPEG, PNG, GIF, WebP → WebP)؟
- [ ] **Batch Processing** مُطبّق؟
- [ ] **Error Handling** موجود؟

---

### **6. فحص Cloudflare CDN**

```bash
# فحص Cloudflare Configuration
cat wrangler.toml
cat src/cdn/worker.ts | head -80
```

**الفحص المطلوب:**
- [ ] **R2 Bucket** مُهيّأ؟ (`adcn-storage`)
- [ ] **Access Keys** مُهيّأة؟
- [ ] **CDN Domain** صحيح؟ (`cdn.adcn.io`)
- [ ] **Cache Control** مُطبّق؟ (1 year, immutable)
- [ ] **Upload Endpoint** موجود؟ (`/upload`)
- [ ] **JWT Authentication** مُطبّق؟
- [ ] **File Size Validation** موجودة؟
- [ ] **MIME Type Validation** موجود؟
- [ ] **Allowed origins (CORS)** مُهيّأ؟

---

### **7. فحص Patient App UI**

```bash
# فحص Patient App
ls patient-app/src/pages/
cat patient-app/src/App.tsx
head -50 patient-app/src/pages/FoodLogPage.tsx
```

**الفحص المطلوب:**
- [ ] **7 صفحات** موجودة؟
  - Food Log, Glucose Log, Weight Log, Medication Log, Appointments, Education, Profile
- [ ] **Navigation Component** موجود؟ (مع Language Toggle EN/AR)
- [ ] **AR+EN Bilingual** في كل الـ UI؟
- [ ] **RTL Support** (`dir="rtl"` في `index.html`)؟
- [ ] **Search Functionality** يعمل؟
- [ ] **Form Validation** موجود؟
- [ ] **Error Handling** مُطبّق؟
- [ ] **TailwindCSS** مُهيّأ؟

---

### **8. فحص Navigation Component**

```bash
cat patient-app/src/components/Navigation.tsx
```

**الفحص المطلوب:**
- [ ] **7 روابط** موجودة؟ (Food, Glucose, Weight, Medications, Appointments, Education, Profile)
- [ ] **Language Toggle** (EN/AR) يعمل؟
- [ ] **Active State** للمسار الحالي؟
- [ ] **AR+EN Bilingual** في الـ nav items؟
- [ ] **Icons** (Emoji) موجودة؟
- [ ] **Responsive** (overflow-x-auto للموبايل)؟

---

### **9. فحص Tests**

```bash
# فحص Tests
find . -type f -name "*.test.ts" -not -path "*/node_modules/*" | sort
find . -type f -name "*.test.tsx" -not -path "*/node_modules/*" | sort
find . -type f -name "*.e2e.ts" -not -path "*/node_modules/*" | sort
```

**الفحص المطلوب:**
- [ ] **Unit Tests** موجودة للموديلات؟ (`src/data/models/__tests__/`)
- [ ] **Unit Tests** موجودة للمكونات؟ (`patient-app/src/components/__tests__/`)
- [ ] **Unit Tests** موجودة للـ CDN Services؟ (`src/cdn/tests/`)
- [ ] **E2E Tests** موجودة؟ (`patient-app/tests/e2e/`)
- [ ] **Vitest Config** موجود؟
- [ ] **Playwright Config** موجود؟
- [ ] **جميع الاختبارات تمر بنجاح؟** (`npm test`)

---

### **10. فحص Build & Deployment**

```bash
# فحص Build
cat patient-app/package.json | grep -A 10 "scripts"
cat deploy.sh
```

**الفحص المطلوب:**
- [ ] **Production Build** يعمل؟ (`npm run build` في patient-app)
- [ ] **Build Size** مناسب؟
- [ ] **Cloudflare Deployment** مُهيّأ؟ (`wrangler.toml`)
- [ ] **Environment Variables** مُهيّأة؟
- [ ] **Secrets** (JWT_SECRET, DATABASE_URL) غير مكشوفة في الكود؟
- [ ] **deploy.sh** موجود ويعمل؟
- [ ] **DEPLOYMENT_CHECKLIST.md** موجود؟

---

### **11. فحص الأمان (Security Audit)**

```bash
# فحص للمفاتيح والأسرار
grep -rn "SECRET\|PASSWORD\|TOKEN\|API_KEY" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".env" | head -20
```

**الفحص المطلوب:**
- [ ] **JWT Authentication** مُطبّق في الـ CDN Worker؟
- [ ] **API Keys** غير موجودة في الكود (hardcoded)؟
- [ ] **File Upload Validation** موجودة؟ (size limit, MIME types)
- [ ] **SQL Injection Protection** موجودة؟ (WatermelonDB parameterized queries)
- [ ] **XSS Protection** موجودة؟ (React auto-escaping)
- [ ] **CORS** مُهيّأ في الـ Worker؟
- [ ] **`.env`** في `.gitignore`؟

---

### **12. فحص الشمولية (Accessibility Audit)**

```bash
# فحص RTL واللغة
grep -rn "dir=\"rtl\"" . --include="*.html" --include="*.tsx" 2>/dev/null | head -10
grep -rn "lang=\"ar\"" . --include="*.html" 2>/dev/null | head -5
```

**الفحص المطلوب:**
- [ ] **AR+EN Bilingual** في كل الصفحات؟
- [ ] **RTL Support** (العربية) موجود في `index.html`؟
- [ ] **Arabic Font (Almarai)** مُهيّأ في `index.css`؟
- [ ] **Language Toggle** في Navigation؟
- [ ] **Semantic HTML** (labels, headings, landmarks)؟
- [ ] `label` elements مرتبطة بـ `input` باستخدام `htmlFor`؟

---

### **13. فحص ملفات الإعدادات (Configuration Audit)**

```bash
# فحص جميع config files
cat package.json | head -20
cat tsconfig.json | head -30
cat patient-app/vite.config.ts
cat patient-app/tailwind.config.js
cat patient-app/postcss.config.js
```

**الفحص المطلوب:**
- [ ] **package.json** (root) - Scripts, Dependencies صحيحة؟
- [ ] **tsconfig.json** - Strict mode, Paths, JSX config صحيحة؟
- [ ] **vite.config.ts** - Plugins, Server port (3000), Build output؟
- [ ] **tailwind.config.js** - Content paths, Colors (primary)، صحيحة؟
- [ ] **postcss.config.js** - TailwindCSS + Autoprefixer plugins؟
- [ ] **AGENTS.md** + **CLAUDE.md** - تعليمات للـ AI؟
- [ ] **.gitignore** - `/node_modules`, `.env`, `/dist`؟

---

## **📊 تقرير الفحص النهائي:**

بعد تنفيذ جميع خطوات الفحص أعلاه، قم بإنشاء `/tmp/adcn-audit-report.md` بنفس الصيغة التالية:

```markdown
# 🎯 **تقرير الفحص الشامل - ADCN Nutrition-OS**

**تاريخ الفحص:** $(date +%Y-%m-%d)
**الفرع:** $(git branch --show-current 2>/dev/null || echo "main")
**آخر commit:** $(git log --oneline -1 2>/dev/null || echo "N/A")

---

## **1. البنية (Architecture)**
✅ Project Structure: [تقييم]
✅ File Organization: [تقييم]
✅ Layer Separation: [تقييم]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **2. Database Schema**
✅ عدد الجداول: [رقم]/27
✅ Indexes: [موجودة/غير موجودة]
✅ Foreign Keys: [موجودة/غير موجودة]
✅ AR+EN Bilingual: [نسبة مئوية]%
✅ Data Types: [صحيحة/غير صحيحة]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **3. WatermelonDB Models**
✅ عدد Models: [رقم]
✅ Relations: [صحيحة/غير صحيحة]
✅ TypeScript Types: [صحيحة/غير صحيحة]
✅ Schema Match: [متطابق/غير متطابق]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **4. Seed Data**
✅ Foods: [رقم]+
✅ Recipes: [رقم]+
✅ Guidelines: [رقم]+
✅ Alerts: [رقم]+
✅ Recommendations: [رقم]+
✅ Templates: [رقم]+
✅ Filters: [رقم]+
✅ AR+EN Bilingual: [نسبة مئوية]%
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **5. Image Compression**
✅ WebP Compression: [مُطبّق/غير مُطبّق]
✅ Quality 80%: [مُطبّق/غير مُطبّق]
✅ Compression Ratio: [رقم]%
✅ Thumbnails: [موجودة/غير موجودة]
✅ Batch Processing: [مُطبّق/غير مُطبّق]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **6. Cloudflare CDN**
✅ R2 Bucket: [مُهيّأ/غير مُهيّأ]
✅ CDN Domain: [موجود/غير موجود]
✅ Cache Control: [مُطبّق/غير مُطبّق]
✅ JWT Auth: [مُطبّق/غير مُطبّق]
✅ File Validation: [موجود/غير موجود]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **7. Patient App UI**
✅ عدد الصفحات: 7/7
✅ Navigation: [موجود/غير موجود]
✅ AR+EN Bilingual: [نسبة مئوية]%
✅ RTL Support: [موجود/غير موجود]
✅ Search: [يعمل/لا يعمل]
✅ Error Handling: [مُطبّق/غير مُطبّق]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **8. Tests**
✅ Unit Tests: [رقم] tests
✅ E2E Tests: [رقم] tests
✅ Test Runner: [Vitest/Jest/أخرى]
✅ Pass Rate: [رقم]%
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **9. Build & Deployment**
✅ Production Build: [يعمل/لا يعمل]
✅ Build Size: [رقم] KB (gzipped: [رقم] KB)
✅ Cloudflare Deploy: [مُهيّأ/غير مُهيّأ]
✅ deploy.sh: [موجود/غير موجود]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **10. الأمان (Security)**
✅ Secrets in Code: [لا يوجد/موجود - خطر!]
✅ Upload Validation: [موجود/غير موجود]
✅ CORS: [مُهيّأ/غير مُهيّأ]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **11. الشمولية (Accessibility)**
✅ AR+EN Bilingual: [نسبة مئوية]%
✅ RTL Support: [موجود/غير موجود]
✅ Arabic Font: [مُهيّأ/غير مُهيّأ]
✅ Semantic HTML: [موجود/غير موجود]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

## **12. الإعدادات (Configuration)**
✅ package.json: [صحيح/غير صحيح]
✅ tsconfig.json: [صحيح/غير صحيح]
✅ vite.config.ts: [صحيح/غير صحيح]
✅ tailwind.config.js: [صحيح/غير صحيح]
✅ .gitignore: [موجود/غير موجود]
📊 **التقييم:** [0-10]/10
**الملاحظات:** [أي مشاكل أو تحسينات]

---

## **📈 التقييم النهائي:**

**التقييم الشامل:** [0-10]/10

**المجموع الكلي:**
- ✅ [عدد] / [إجمالي] نقاط الفحص ناجحة
- ✅ نسبة النجاح: [رقم]%

**نقاط القوة:**
- [نقطة قوة 1]
- [نقطة قوة 2]
- [نقطة قوة 3]

**نقاط الضعف (قابلة للتطوير):**
- [نقطة ضعف 1]
- [نقطة ضعف 2]
- [نقطة ضعف 3]

**التوصية:**
- ✅ **جاهز للنشر فوراً** / ⚠️ **يحتاج تحسينات قبل النشر** / ❌ **غير جاهز للنشر**

---

## **🎯 الأوامر المقترحة بعد الفحص:**

```bash
# إذا كان المشروع جاهزاً للنشر:
npm run build
cd patient-app && npm run build

# إذا كانت هناك مشاكل تحتاج إصلاح:
npm test
cd patient-app && npm test
```

---

*تم الفحص بواسطة OpenCode AI Agent*
*التاريخ: $(date +%Y-%m-%d)*
```

---

## **🚀 كيفية استخدام البروميت:**

```bash
# 1. افتح المشروع في terminal
cd /path/to/adcn-nutrition-os

# 2. شغل OpenCode
opencode

# 3. الصق البروميت هذا بالكامل
# (سيفحص المشروع بالكامل)

# 4. انتظر التقرير الشامل
# (سيتم إنشاؤه في /tmp/adcn-audit-report.md)
```

---

## **📝 ملاحظات:**

- هذا البروميت مُصمم لفحص **شامل 100%**
- يغطي **جميع phases** (1-6)
- يغطي **جميع الجوانب** (Architecture, Database, Models, Seed, CDN, UI, Tests, Build, Performance, Security, Accessibility, Configuration)
- يستخدم **أوامر Bash** لفحص الملفات فعليًا
- يقدم **تقرير مفصل** مع تقييم رقمي (0-10)
- يقدم **نقاط القوة والضعف**
- يقدم **توصية نهائية** (جاهز/يحتاج تحسين/غير جاهز)
- يتم حفظ التقرير في `/tmp/adcn-audit-report.md`

---

**استخدم هذا البروميت لفحص شامل لمشروع ADCN Nutrition-OS!** 🎯

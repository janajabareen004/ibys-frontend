/**
 * Dynamic phrase translation for mock/data-layer strings.
 *
 * The static UI is translated through the locale dictionaries. For data
 * fields returned by the mock services (project names, task titles, agendas,
 * comments, notifications, activity feed messages, etc.) we look up each
 * English phrase in the map below and substitute the localized version at
 * the hook boundary.
 *
 * Any phrase that is not in the map falls through unchanged, so partially
 * translated dictionaries degrade gracefully.
 */

import type { LangCode } from "./I18nProvider";

type Locale = LangCode;

type Row = { ar: string; he: string };

// -- Skip patterns for strings that must NEVER be translated -------------
const SKIP = [
  /^https?:\/\//i,          // URLs
  /^[\w.+-]+@[\w.-]+$/,      // Emails
  /^\+?\d[\d\s\-().]*$/,     // Phone numbers
  /^\d{4}-\d{2}-\d{2}/,      // ISO dates
  /^[A-Z_]+$/,               // SCREAMING_ENUM values
  /^\d+(\.\d+)?\s*(KB|MB|GB|m²|%)$/i, // File sizes / units
  /^v\d+(\.\d+)*$/i,         // Version tags
  /^#[A-Za-z0-9-]+$/,        // Hash refs
];

const shouldSkip = (s: string) =>
  !s || s.length < 2 || SKIP.some((r) => r.test(s));

// -----------------------------------------------------------------------
// Phrase map (English → { ar, he }). Add/extend as needed.
// -----------------------------------------------------------------------
const PHRASES: Record<string, Row> = {
  // ---- People (transliterated) ------------------------------------
  "Omar Haddad":            { ar: "عمر حداد",         he: "עומר חדאד" },
  "Sara Tenant":            { ar: "سارة تننت",        he: "שרה טננט" },
  "David Ben-Ami":          { ar: "دافيد بن-عمي",     he: "דוד בן-עמי" },
  "Mira Sasson":            { ar: "ميرا ساسون",       he: "מירה ששון" },
  "Ella Katz":              { ar: "إيلا كاتس",        he: "אלה כץ" },
  "Northline Holdings":     { ar: "نورث لاين القابضة", he: "נורת'ליין החזקות" },
  "Municipality of Jaffa":  { ar: "بلدية يافا",       he: "עיריית יפו" },
  "Lena Cohen":             { ar: "لينا كوهين",       he: "לנה כהן" },
  "Karim Nasser":           { ar: "كريم ناصر",        he: "כרים נאסר" },
  "Rachel Levi":            { ar: "راشيل ليفي",       he: "רחל לוי" },
  "Tariq Amin":             { ar: "طارق أمين",        he: "טאריק אמין" },
  "Noa Bar":                { ar: "نوعا بار",         he: "נעה בר" },
  "Yusuf Amir":             { ar: "يوسف عامر",        he: "יוסף אמיר" },
  "Hana Kaplan":            { ar: "هناء كابلان",      he: "חנה קפלן" },
  "Farid Odeh":             { ar: "فريد عودة",        he: "פריד עודה" },
  "Danielle Peled":         { ar: "دانيال بيليد",     he: "דניאל פלד" },
  "Ibrahim Nasrallah":      { ar: "إبراهيم نصر الله", he: "איברהים נסראללה" },
  "Roni Bar-Levi":          { ar: "روني بار-ليفي",    he: "רוני בר-לוי" },
  "Site Foreman":           { ar: "مشرف الموقع",      he: "מנהל אתר" },

  // ---- Companies --------------------------------------------------
  "Horizon Developments Ltd.": { ar: "هورايزون للتطوير المحدودة", he: "הורייזון פיתוח בע\"מ" },
  "Delta Structural Group":    { ar: "مجموعة دلتا الإنشائية",   he: "קבוצת דלתא הנדסה" },
  "Delta Structural":          { ar: "دلتا الإنشائية",           he: "דלתא הנדסה" },
  "Vector MEP Services":       { ar: "خدمات فيكتور الميكانيكية", he: "וקטור שירותי MEP" },
  "Vector MEP":                { ar: "فيكتور MEP",              he: "וקטור MEP" },
  "Marble & Line Interiors":   { ar: "ماربل آند لاين للتشطيبات", he: "מרבל אנד ליין עיצוב פנים" },
  "Marble & Line":             { ar: "ماربل آند لاين",           he: "מרבל אנד ליין" },
  "Clearview Facade Co.":      { ar: "شركة كلير فيو للواجهات",   he: "קליר-וויו חזיתות" },
  "Clearview Facade":          { ar: "كلير فيو للواجهات",         he: "קליר-וויו חזיתות" },
  "Atelier Finishing Studio":  { ar: "أتيليه للتشطيبات",         he: "אטלייה גימור" },
  "Atelier Finishing":         { ar: "أتيليه للتشطيبات",         he: "אטלייה גימור" },
  "Horizon Dev":               { ar: "هورايزون للتطوير",         he: "הורייזון פיתוח" },
  "Horizon Handover":          { ar: "هورايزون للتسليم",         he: "הורייזון מסירה" },

  // ---- Project names ---------------------------------------------
  "Marina Heights, Block B":  { ar: "مارينا هايتس، بلوك B",     he: "מרינה הייטס, בלוק B" },
  "Palm Residences":          { ar: "بالم ريزيدنس",             he: "פאלם רזידנס" },
  "Cedar Grove Villas":       { ar: "فلل سيدار غروف",           he: "וילות סידר גרוב" },
  "Skyline Offices":          { ar: "مكاتب سكاي لاين",           he: "משרדי סקייליין" },
  "Old Town Refurbishment":   { ar: "تجديد البلدة القديمة",     he: "שיפוץ העיר העתיקה" },
  "Harbor View Lofts":        { ar: "لوفتات هاربور فيو",         he: "לופטים הרבור וויו" },

  // ---- Addresses --------------------------------------------------
  "45 Coastline Avenue, Marina District": { ar: "45 شارع كوستلاين، حي المارينا", he: "שדרות קוסטליין 45, רובע המרינה" },
  "45 Coastline Ave, Marina District":    { ar: "45 كوستلاين، حي المارينا",     he: "קוסטליין 45, רובע המרינה" },
  "12 Palm Boulevard, Hadera":            { ar: "12 شارع بالم، الخضيرة",         he: "שדרות פאלם 12, חדרה" },
  "8 Cedar Grove, Ramat Gan":             { ar: "8 سيدار غروف، رمات غان",       he: "סידר גרוב 8, רמת גן" },
  "1 Skyline Plaza, Tel Aviv":            { ar: "1 ساحة سكاي لاين، تل أبيب",     he: "כיכר סקייליין 1, תל אביב" },
  "Old Town Square, Jaffa":               { ar: "ساحة البلدة القديمة، يافا",     he: "כיכר העיר העתיקה, יפו" },
  "3 Harbor Rd, Ashdod":                  { ar: "3 طريق الميناء، أشدود",         he: "רחוב הנמל 3, אשדוד" },

  // ---- Roles ------------------------------------------------------
  "Senior Project Manager":  { ar: "مدير مشاريع أول",       he: "מנהל פרויקטים בכיר" },
  "Site Coordinator":        { ar: "منسق موقع",              he: "רכז אתר" },
  "MEP Supervisor":          { ar: "مشرف الأنظمة الميكانيكية", he: "מפקח MEP" },
  "Quality Inspector":       { ar: "مفتش جودة",              he: "מפקח איכות" },
  "Finishing Lead":          { ar: "قائد التشطيبات",         he: "אחראי גימור" },
  "Document Controller":     { ar: "مسؤول التوثيق",          he: "אחראי מסמכים" },
  "Site Engineer":           { ar: "مهندس موقع",             he: "מהנדס אתר" },
  "Structural Lead":         { ar: "قائد الأعمال الإنشائية", he: "אחראי קונסטרוקציה" },
  "MEP Foreman":             { ar: "رئيس عمال ميكانيكا",     he: "מנהל עבודה MEP" },
  "Finishing Supervisor":    { ar: "مشرف التشطيبات",         he: "מפקח גימור" },
  "Safety Officer":          { ar: "مسؤول السلامة",          he: "קצין בטיחות" },
  "Project Manager":         { ar: "مدير المشروع",           he: "מנהל פרויקט" },

  // ---- Project descriptions --------------------------------------
  "A boutique residential tower featuring 12 stories of premium apartments with a marina-facing lobby, rooftop terrace, and underground parking.":
    { ar: "برج سكني بوتيكي مكوّن من 12 طابقاً من الشقق الفاخرة مع لوبي مطل على المارينا وتراس على السطح ومواقف تحت الأرض.",
      he: "מגדל מגורים בוטיק בן 12 קומות עם דירות יוקרה, לובי הפונה למרינה, מרפסת גג וחניון תת-קרקעי." },
  "12-story boutique residential tower with marina-facing lobby, rooftop terrace and underground parking.":
    { ar: "برج سكني بوتيكي من 12 طابقاً مع لوبي مطل على المارينا وتراس علوي ومواقف تحت الأرض.",
      he: "מגדל מגורים בן 12 קומות עם לובי הפונה למרינה, מרפסת גג וחניון תת-קרקעי." },
  "12-story boutique residential tower with rooftop terrace and underground parking.":
    { ar: "برج سكني بوتيكي من 12 طابقاً مع تراس علوي ومواقف تحت الأرض.",
      he: "מגדל מגורים בן 12 קומות עם מרפסת גג וחניון תת-קרקעי." },
  "Two mid-rise residential blocks with shared garden podium and retail ground floor.":
    { ar: "مبنيان سكنيان متوسطا الارتفاع مع حديقة مشتركة وطابق أرضي تجاري.",
      he: "שני בנייני מגורים בגובה בינוני עם גינה משותפת וקומת מסחר." },
  "Two mid-rise residential blocks with shared garden podium.":
    { ar: "مبنيان سكنيان متوسطا الارتفاع مع حديقة مشتركة.",
      he: "שני בנייני מגורים בגובה בינוני עם גינה משותפת." },
  "Cluster of eight luxury villas with private pools and shared clubhouse.":
    { ar: "مجمّع من ثماني فلل فاخرة بمسابح خاصة ونادٍ مشترك.",
      he: "מקבץ של שמונה וילות יוקרה עם בריכות פרטיות ומועדון משותף." },
  "22-story LEED-gold office tower with double-height lobby and rooftop restaurant.":
    { ar: "برج مكاتب من 22 طابقاً بمعيار LEED الذهبي مع لوبي مزدوج الارتفاع ومطعم على السطح.",
      he: "מגדל משרדים בן 22 קומות בתקן LEED זהב עם לובי כפול ומסעדת גג." },
  "Heritage restoration of six façades and a public plaza with new lighting.":
    { ar: "ترميم تراثي لست واجهات وساحة عامة مع إضاءة جديدة.",
      he: "שימור מורשת של שש חזיתות וכיכר ציבורית עם תאורה חדשה." },
  "Heritage restoration of six façades and a public plaza.":
    { ar: "ترميم تراثي لست واجهات وساحة عامة.",
      he: "שימור מורשת של שש חזיתות וכיכר ציבורית." },
  "Loft-style residential development pending permit approval.":
    { ar: "مشروع سكني بأسلوب اللوفت بانتظار الموافقة على التصريح.",
      he: "פרויקט מגורים בסגנון לופט בהמתנה לאישור היתר." },

  // ---- Stage / project notes -------------------------------------
  "Foundations, columns, slabs and structural frame across all floors.":
    { ar: "الأساسات والأعمدة والبلاطات والهيكل الإنشائي عبر جميع الطوابق.",
      he: "יסודות, עמודים, תקרות ושלד קונסטרוקטיבי בכל הקומות." },
  "Full MEP rough-in: electrical conduits, plumbing risers and HVAC ducting.":
    { ar: "أعمال الأنظمة الميكانيكية الأولية: مواسير كهرباء وسباكة وتكييف.",
      he: "התקנה ראשונית של מערכות MEP: חשמל, אינסטלציה ומיזוג." },
  "Interior plastering, screed leveling and ceramic flooring installation.":
    { ar: "تلبيس داخلي، وتسوية أرضيات، وتركيب سيراميك.",
      he: "טיח פנים, מדות חלקה והתקנת ריצוף קרמי." },
  "Aluminium window frames, glazing and internal doors on every unit.":
    { ar: "إطارات نوافذ ألمنيوم وزجاج وأبواب داخلية في كل وحدة.",
      he: "מסגרות אלומיניום, זיגוג ודלתות פנים בכל יחידה." },
  "Kitchen, bathroom, painting, trims and final finishes per unit.":
    { ar: "المطبخ والحمام والدهانات والتشطيبات النهائية لكل وحدة.",
      he: "מטבח, אמבטיה, צבע וגימור סופי בכל יחידה." },
  "Final inspection, snag list, key handover and warranty documentation.":
    { ar: "الفحص النهائي وقائمة الملاحظات وتسليم المفاتيح ووثائق الضمان.",
      he: "בדיקה סופית, רשימת ליקויים, מסירת מפתחות ותיעוד אחריות." },
  "All structural inspections passed with zero deficiencies.":
    { ar: "اجتازت جميع الفحوصات الإنشائية دون ملاحظات.",
      he: "כל בדיקות הקונסטרוקציה עברו ללא ליקויים." },
  "Final pressure test on plumbing risers completed successfully.":
    { ar: "اكتمل اختبار الضغط النهائي على أنابيب السباكة بنجاح.",
      he: "בדיקת הלחץ הסופית של קווי האינסטלציה הושלמה בהצלחה." },
  "Floors 5–8 completed. Team currently working on floors 9–10.":
    { ar: "اكتملت الطوابق 5–8. الفريق يعمل حالياً على الطابقين 9–10.",
      he: "קומות 5–8 הושלמו. הצוות עובד כעת בקומות 9–10." },
  "Material samples approved. Awaiting stage kickoff.":
    { ar: "تمت الموافقة على عيّنات المواد. بانتظار بدء المرحلة.",
      he: "דגמי חומרים אושרו. ממתין לתחילת השלב." },
  "Revised schedule under review with the developer.":
    { ar: "الجدول الزمني المعدّل قيد المراجعة مع المطوّر.",
      he: "לוח הזמנים המעודכן בבדיקה מול היזם." },
  "Handover checklist template shared with tenant.":
    { ar: "تمت مشاركة قائمة تسليم مفاتيح مع المستأجر.",
      he: "רשימת המסירה שותפה עם הדייר." },
  "Kitchen supplier lead time extended by 3 weeks.":
    { ar: "زمن توريد المطبخ تمدّد بمقدار 3 أسابيع.",
      he: "זמן האספקה של המטבחים התארך ב-3 שבועות." },
  "Supplier delivery delayed; recovery plan in progress.":
    { ar: "تأخر توريد المورّد؛ خطة التعافي قيد التنفيذ.",
      he: "אספקת הספק התעכבה; תוכנית התאוששות בביצוע." },
  "Team currently working on this stage.":
    { ar: "الفريق يعمل حالياً على هذه المرحلة.",
      he: "הצוות עובד כעת בשלב זה." },
  "Stage completed and signed off.":
    { ar: "اكتملت المرحلة وتم التوقيع عليها.",
      he: "השלב הושלם ואושר." },
  "Awaiting kickoff.":
    { ar: "بانتظار البدء.",
      he: "ממתין לתחילה." },

  // ---- Building info ---------------------------------------------
  "3 bedroom, sea view": { ar: "3 غرف نوم، إطلالة بحرية", he: "3 חדרים, נוף לים" },

  // ---- Doc names -------------------------------------------------
  "Purchase Agreement – Unit B-702.pdf": { ar: "اتفاقية الشراء – الوحدة B-702.pdf", he: "הסכם רכישה – יחידה B-702.pdf" },
  "Building Permit – Marina B.pdf":       { ar: "تصريح البناء – مارينا B.pdf",       he: "היתר בנייה – מרינה B.pdf" },
  "Architectural Plans – Floor 7.pdf":    { ar: "المخططات المعمارية – الطابق 7.pdf", he: "תוכניות אדריכליות – קומה 7.pdf" },
  "MEP Coordination Report.pdf":          { ar: "تقرير تنسيق الأنظمة الميكانيكية.pdf", he: "דוח תיאום MEP.pdf" },
  "Progress Report – Q1 2026.pdf":        { ar: "تقرير التقدم – الربع الأول 2026.pdf", he: "דוח התקדמות – רבעון 1 2026.pdf" },
  "Invoice #INV-0042.pdf":                { ar: "فاتورة #INV-0042.pdf",              he: "חשבונית #INV-0042.pdf" },
  "Finishes Selection Guide.pdf":         { ar: "دليل اختيار التشطيبات.pdf",         he: "מדריך בחירת גימורים.pdf" },
  "Structural drawings v3.pdf":           { ar: "مخططات إنشائية v3.pdf",             he: "תוכניות קונסטרוקציה v3.pdf" },
  "Building permit A-2025.pdf":           { ar: "تصريح البناء A-2025.pdf",           he: "היתר בנייה A-2025.pdf" },
  "MEP inspection report.pdf":            { ar: "تقرير فحص MEP.pdf",                 he: "דוח בדיקת MEP.pdf" },
  "Contract addendum #4.pdf":             { ar: "ملحق العقد رقم 4.pdf",             he: "נספח חוזה #4.pdf" },
  "Weekly progress report.pdf":           { ar: "تقرير التقدم الأسبوعي.pdf",         he: "דוח התקדמות שבועי.pdf" },
  "Invoice #1024.pdf":                    { ar: "فاتورة #1024.pdf",                 he: "חשבונית #1024.pdf" },
  "Façade drawings v2.pdf":               { ar: "مخططات الواجهة v2.pdf",             he: "תוכניות חזית v2.pdf" },
  "Handover checklist.pdf":               { ar: "قائمة التسليم.pdf",                he: "רשימת מסירה.pdf" },
  "Occupancy permit.pdf":                 { ar: "تصريح إشغال.pdf",                  he: "היתר אכלוס.pdf" },
  "Material invoice batch 12.pdf":        { ar: "فاتورة مواد الدفعة 12.pdf",         he: "חשבונית חומרים אצווה 12.pdf" },

  // ---- Comments --------------------------------------------------
  "Great progress this week. Floors 5–8 plaster works are visually excellent.":
    { ar: "تقدّم رائع هذا الأسبوع. أعمال التلبيس في الطوابق 5–8 ممتازة بصريّاً.",
      he: "התקדמות מצוינת השבוע. עבודות הטיח בקומות 5–8 נראות מצוין." },
  "Thank you! Team is proud of the finish quality.":
    { ar: "شكراً! الفريق فخور بجودة التشطيب.",
      he: "תודה! הצוות גאה באיכות הגימור." },
  "Could we please have more photos of the master bathroom area?":
    { ar: "هل يمكننا الحصول على المزيد من الصور لمنطقة الحمام الرئيسي؟",
      he: "אפשר בבקשה עוד תמונות של אזור חדר האמבטיה הראשי?" },
  "We've locked in the revised kitchen delivery for July 12.":
    { ar: "تم تثبيت موعد توريد المطبخ المعدّل في 12 يوليو.",
      he: "נקבע מחדש מועד אספקת המטבחים ל-12 ביולי." },
  "Please confirm plaster completion date for floors 9–12.":
    { ar: "يرجى تأكيد موعد إنهاء التلبيس للطوابق 9–12.",
      he: "אנא אשרו את מועד סיום הטיח לקומות 9–12." },
  "On track. Aiming to complete by end of next week.":
    { ar: "نسير حسب الخطة. نهدف إلى الإنهاء بحلول نهاية الأسبوع القادم.",
      he: "בקצב. שואפים לסיים בסוף השבוע הבא." },
  "Delivery delayed by supplier — recovery plan attached.":
    { ar: "تأخر التوريد من قِبل المورّد — خطة التعافي مرفقة.",
      he: "האספקה התעכבה מצד הספק — תוכנית התאוששות מצורפת." },

  // ---- Meetings --------------------------------------------------
  "Monthly progress review":               { ar: "مراجعة التقدم الشهرية",     he: "סקירת התקדמות חודשית" },
  "Finishes selection walkthrough":        { ar: "جولة اختيار التشطيبات",     he: "סיור בחירת גימורים" },
  "Structural stage sign-off":             { ar: "توقيع اعتماد المرحلة الإنشائية", he: "אישור שלב הקונסטרוקציה" },
  "MEP kickoff":                           { ar: "انطلاق أعمال MEP",         he: "פתיחת שלב MEP" },
  "Weekly project sync — Marina B":        { ar: "اجتماع أسبوعي — مارينا B",  he: "סנכרון שבועי — מרינה B" },
  "MEP coordination — Palm Residences":    { ar: "تنسيق MEP — بالم ريزيدنس",  he: "תיאום MEP — פאלם רזידנס" },
  "Finishes walkthrough — Cedar Grove":    { ar: "جولة تشطيبات — سيدار غروف", he: "סיור גימורים — סידר גרוב" },
  "Skyline structural review":             { ar: "مراجعة إنشائية سكاي لاين",  he: "סקירת קונסטרוקציה סקייליין" },
  "Old Town handover prep":                { ar: "تحضير تسليم البلدة القديمة", he: "הכנת מסירה בעיר העתיקה" },
  "Harbor View kickoff":                   { ar: "انطلاق هاربور فيو",         he: "פתיחת הרבור וויו" },
  "Marina B safety briefing":              { ar: "جلسة سلامة مارينا B",       he: "תדרוך בטיחות מרינה B" },
  "Weekly site sync — Marina B":           { ar: "اجتماع الموقع الأسبوعي — مارينا B", he: "סנכרון אתר שבועי — מרינה B" },

  "Video call":                            { ar: "مكالمة فيديو",              he: "שיחת וידאו" },
  "Site office, Marina B":                 { ar: "مكتب الموقع، مارينا B",     he: "משרד האתר, מרינה B" },
  "Site office":                           { ar: "مكتب الموقع",               he: "משרד האתר" },
  "On-site":                               { ar: "في الموقع",                 he: "באתר" },
  "HQ boardroom":                          { ar: "قاعة اجتماعات المقر",       he: "חדר ישיבות מטה" },

  // Meeting agendas / notes
  "All structural drawings approved and archived.":
    { ar: "تمت الموافقة على جميع المخططات الإنشائية وأرشفتها.",
      he: "כל תוכניות הקונסטרוקציה אושרו ותוייקו." },
  "Progress review, risks, blockers.":     { ar: "مراجعة التقدم والمخاطر والعوائق.", he: "סקירת התקדמות, סיכונים, חסמים." },
  "Rough-in coordination and sign-off checklist.": { ar: "تنسيق الأعمال الأولية وقائمة الاعتماد.", he: "תיאום התקנה ראשונית ורשימת אישור." },
  "Client selection walkthrough.":         { ar: "جولة اختيارات العميل.",     he: "סיור בחירות עם הלקוח." },
  "Recovery plan for delayed pours.":      { ar: "خطة التعافي لعمليات الصبّ المتأخرة.", he: "תוכנית התאוששות ליציקות שהתעכבו." },
  "Handover checklist and snag list.":     { ar: "قائمة التسليم وقائمة الملاحظات.", he: "רשימת מסירה ורשימת ליקויים." },
  "Kickoff meeting.":                      { ar: "اجتماع الانطلاق.",          he: "פגישת פתיחה." },
  "Monthly safety briefing.":              { ar: "جلسة السلامة الشهرية.",     he: "תדרוך בטיחות חודשי." },
  "Site progress, upcoming pours, risks.": { ar: "تقدّم الموقع، عمليات الصبّ القادمة، المخاطر.", he: "התקדמות אתר, יציקות קרובות, סיכונים." },
  "Client finishes selection.":            { ar: "اختيار تشطيبات العميل.",    he: "בחירת גימורים על ידי הלקוח." },
  "Project kickoff.":                      { ar: "انطلاق المشروع.",           he: "פתיחת הפרויקט." },
  "Agreed on revised pour schedule; sub-contractor to send updated plan by Friday.":
    { ar: "تم الاتفاق على جدول صبّ معدّل؛ سيرسل المقاول الفرعي الخطة المحدّثة قبل الجمعة.",
      he: "הוסכם על לו״ז יציקות מעודכן; קבלן המשנה ישלח תוכנית עד יום שישי." },
  "Snag list agreed; final walkthrough scheduled next week.":
    { ar: "تم الاتفاق على قائمة الملاحظات؛ الجولة النهائية مجدولة الأسبوع القادم.",
      he: "רשימת הליקויים אושרה; הסיור הסופי נקבע לשבוע הבא." },

  // ---- Notifications --------------------------------------------
  "Plaster stage reached 58%":             { ar: "بلغت مرحلة التلبيس 58٪",   he: "שלב הטיח הגיע ל-58%" },
  "Floors 5–8 completed.":                 { ar: "اكتملت الطوابق 5–8.",       he: "קומות 5–8 הושלמו." },
  "Floors 5–8 completed on Marina B.":     { ar: "اكتملت الطوابق 5–8ish في مارينا B.", he: "קומות 5–8 הושלמו במרינה B." },
  "Meeting scheduled":                     { ar: "تم جدولة اجتماع",           he: "פגישה נקבעה" },
  "Monthly progress review on Thursday, 10:00.":
    { ar: "مراجعة التقدم الشهرية يوم الخميس، 10:00.", he: "סקירת התקדמות חודשית ביום חמישי, 10:00." },
  "MEP coordination scheduled for tomorrow.":
    { ar: "تنسيق MEP مجدول للغد.", he: "תיאום MEP נקבע למחר." },
  "New document shared":                   { ar: "تمت مشاركة وثيقة جديدة",   he: "מסמך חדש שותף" },
  "Progress Report – Q1 2026 was uploaded.":
    { ar: "تم رفع تقرير التقدم – الربع الأول 2026.", he: "דוח התקדמות – רבעון 1 2026 הועלה." },
  "Delay flagged":                         { ar: "تنبيه تأخير",              he: "התראה על עיכוב" },
  "Finishing stage is currently delayed by ~3 weeks.":
    { ar: "مرحلة التشطيب متأخرة حالياً بحوالي 3 أسابيع.", he: "שלב הגימור מתעכב כעת ב-3 שבועות בערך." },
  "Welcome to IBYS":                       { ar: "أهلاً بك في IBYS",         he: "ברוכים הבאים ל-IBYS" },
  "Your tenant workspace is ready.":       { ar: "مساحة عمل المستأجر جاهزة.", he: "סביבת העבודה שלך מוכנה." },
  "New tenant request":                    { ar: "طلب جديد من المستأجر",     he: "בקשה חדשה מדייר" },
  "Sara Tenant requested master bathroom photos.":
    { ar: "طلبت سارة تننت صور الحمام الرئيسي.", he: "שרה טננט ביקשה תמונות של חדר האמבטיה הראשי." },
  "Task overdue":                          { ar: "مهمة متأخرة",              he: "משימה באיחור" },
  "Order kitchen cabinet units is 2 days overdue.":
    { ar: "طلب وحدات خزائن المطبخ متأخر بيومين.", he: "הזמנת ארונות המטבח באיחור של יומיים." },
  "Project flagged at risk":               { ar: "تم وضع المشروع في خانة المخاطر", he: "הפרויקט סומן בסיכון" },
  "Palm Residences has been flagged at risk.":
    { ar: "تم وضع بالم ريزيدنس في خانة المخاطر.", he: "פאלם רזידנס סומן בסיכון." },
  "Weekly report ready":                   { ar: "التقرير الأسبوعي جاهز",    he: "הדוח השבועי מוכן" },
  "Portfolio report for last week is ready for review.":
    { ar: "تقرير المحفظة للأسبوع الماضي جاهز للمراجعة.", he: "דוח התיק לשבוע שעבר מוכן לסקירה." },
  "Meeting rescheduled":                   { ar: "تم إعادة جدولة الاجتماع",  he: "הפגישה נדחתה למועד אחר" },
  "Marina B safety briefing moved to next Friday.":
    { ar: "تم نقل جلسة سلامة مارينا B إلى الجمعة القادمة.", he: "תדרוך הבטיחות במרינה B נדחה ליום שישי הבא." },
  "Upload failed":                         { ar: "فشل الرفع",                he: "העלאה נכשלה" },
  "roof_wp_video.mov could not be uploaded.":
    { ar: "تعذّر رفع الملف roof_wp_video.mov.", he: "לא ניתן להעלות את roof_wp_video.mov." },
  "Palm Residences flagged delayed":       { ar: "بالم ريزيدنس معلَّم كمتأخر", he: "פאלם רזידנס סומן כמעוכב" },
  "MEP rough-in is 9 days behind schedule.":
    { ar: "أعمال MEP الأولية متأخرة 9 أيام عن الجدول.", he: "התקנת MEP ראשונית באיחור של 9 ימים." },
  "Weekly summary ready":                  { ar: "الملخّص الأسبوعي جاهز",    he: "הסיכום השבועי מוכן" },
  "Weekly stage report is ready for review.":
    { ar: "التقرير الأسبوعي للمراحل جاهز للمراجعة.", he: "הדוח השבועי של השלבים מוכן לסקירה." },

  // ---- Tasks -----------------------------------------------------
  "Coordinate MEP inspection":       { ar: "تنسيق فحص MEP",             he: "תיאום בדיקת MEP" },
  "Review structural drawings v3":   { ar: "مراجعة المخططات الإنشائية v3", he: "סקירת תוכניות קונסטרוקציה v3" },
  "Approve plaster finish samples":  { ar: "اعتماد عيّنات التلبيس",      he: "אישור דגמי טיח" },
  "Order kitchen cabinet units":     { ar: "طلب وحدات خزائن المطبخ",     he: "הזמנת ארונות מטבח" },
  "Site safety audit walkthrough":   { ar: "جولة تدقيق سلامة الموقع",    he: "סיור ביקורת בטיחות באתר" },
  "Prepare monthly tenant update":   { ar: "إعداد التحديث الشهري للمستأجر", he: "הכנת עדכון חודשי לדייר" },
  "Schedule crane delivery":         { ar: "جدولة توريد الرافعة",        he: "תזמון אספקת עגורן" },
  "Reply to tenant photo request":   { ar: "الرد على طلب صور المستأجر",  he: "מענה לבקשת תמונות של דייר" },
  "Sign off electrical rough-in":    { ar: "اعتماد أعمال الكهرباء الأولية", he: "אישור התקנת חשמל ראשונית" },
  "Update project risk register":    { ar: "تحديث سجل مخاطر المشروع",    he: "עדכון מרשם סיכוני הפרויקט" },
  "Confirm window glazing spec":     { ar: "تأكيد مواصفات زجاج النوافذ", he: "אישור מפרט זיגוג חלונות" },
  "Verify concrete pour test report":{ ar: "التحقق من تقرير اختبار الصبّ", he: "אימות דוח בדיקת יציקת בטון" },

  // Subtasks / activity
  "Prepare checklist":               { ar: "تحضير قائمة تحقّق",         he: "הכנת רשימת בדיקה" },
  "Coordinate with contractor":      { ar: "التنسيق مع المقاول",         he: "תיאום עם הקבלן" },
  "Final sign-off":                  { ar: "الاعتماد النهائي",           he: "אישור סופי" },
  "Task created":                    { ar: "تم إنشاء المهمة",            he: "המשימה נוצרה" },
  "Please prioritise this before Friday.":
    { ar: "يرجى إعطاء الأولوية لهذا قبل الجمعة.", he: "אנא תעדפו זאת לפני יום שישי." },
  "Working on it, will update tomorrow.":
    { ar: "جارٍ العمل، سأقوم بالتحديث غداً.", he: "עובד על זה, אעדכן מחר." },

  // ---- Requests --------------------------------------------------
  "Master bathroom close-ups.":      { ar: "لقطات قريبة للحمام الرئيسي.", he: "תקריבים של חדר האמבטיה הראשי." },
  "Panel board and wiring diagrams.":{ ar: "لوحة الكهرباء ومخططات التوصيل.", he: "לוח חשמל ותרשימי חיווט." },
  "Please share updated photos of the master bathroom finish.":
    { ar: "يرجى مشاركة صور محدّثة لتشطيب الحمام الرئيسي.", he: "אנא שתפו תמונות מעודכנות של גימור חדר האמבטיה הראשי." },
  "Requesting a walkthrough next week to review MEP.":
    { ar: "طلب جولة الأسبوع القادم لمراجعة أعمال MEP.", he: "בקשה לסיור בשבוע הבא לסקירת MEP." },
  "Which paint finish will be used in the living room?":
    { ar: "ما نوع طلاء الجدران الذي سيُستخدم في غرفة المعيشة؟", he: "איזה גימור צבע יבוצע בסלון?" },
  "Requesting the latest structural inspection report.":
    { ar: "طلب أحدث تقرير فحص إنشائي.", he: "בקשה לדוח בדיקת קונסטרוקציה עדכני." },
  "Requested meeting time conflicts with structural pour.":
    { ar: "موعد الاجتماع المطلوب يتعارض مع الصبّ الإنشائي.", he: "מועד הפגישה מתנגש עם יציקת קונסטרוקציה." },
  "Landscape progress photos requested.":
    { ar: "طُلبت صور تقدم أعمال تنسيق الحدائق.", he: "התבקשו תמונות התקדמות של גינון." },
  "Requesting an on-site walkthrough for MEP rough-in.":
    { ar: "طلب جولة في الموقع لأعمال MEP الأولية.", he: "בקשה לסיור באתר עבור התקנת MEP ראשונית." },
  "Need the latest structural inspection report.":
    { ar: "نحتاج أحدث تقرير فحص إنشائي.", he: "נדרש דוח בדיקת קונסטרוקציה עדכני." },
  "Confirm the paint finish for the living room.":
    { ar: "تأكيد تشطيب دهان غرفة المعيشة.", he: "אישור גימור הצבע לסלון." },
  "Requested photos of restricted safety zone.":
    { ar: "طلب صور لمنطقة سلامة محظورة.", he: "התבקשו תמונות של אזור בטיחות מוגבל." },
  "Coordinating handover walkthrough date.":
    { ar: "تنسيق موعد جولة التسليم.", he: "תיאום מועד סיור מסירה." },

  // ---- Photos ---------------------------------------------------
  "East façade progress":            { ar: "تقدّم الواجهة الشرقية",     he: "התקדמות חזית מזרחית" },
  "Concrete pour — Floor 6":         { ar: "صبّ الخرسانة — الطابق 6",    he: "יציקת בטון — קומה 6" },
  "MEP rough-in":                    { ar: "أعمال MEP الأولية",         he: "התקנת MEP ראשונית" },
  "Kitchen finish sample":           { ar: "عيّنة تشطيب المطبخ",         he: "דגם גימור מטבח" },
  "Lobby marble layout":             { ar: "تركيب رخام اللوبي",         he: "פריסת שיש בלובי" },
  "Rooftop waterproofing":           { ar: "عزل السطح",                 he: "איטום גג" },
  "Window frame install":            { ar: "تركيب إطارات النوافذ",       he: "התקנת מסגרות חלונות" },
  "Handover snag list":              { ar: "قائمة ملاحظات التسليم",      he: "רשימת ליקויים למסירה" },
  "Balcony rail install":            { ar: "تركيب درابزين الشرفة",       he: "התקנת מעקה מרפסת" },
  "Elevator shaft check":            { ar: "فحص عمود المصعد",           he: "בדיקת פיר מעלית" },

  // ---- Activity feed (verb + text messages) ---------------------
  "completed Site safety audit walkthrough":
    { ar: "أكمل جولة تدقيق سلامة الموقع", he: "השלים סיור ביקורת בטיחות באתר" },
  "scheduled MEP coordination meeting":
    { ar: "جدولة اجتماع تنسيق MEP", he: "תיזמן פגישת תיאום MEP" },
  "updated plaster stage progress to 58%":
    { ar: "حدَّث تقدم مرحلة التلبيس إلى 58٪", he: "עדכן את התקדמות שלב הטיח ל-58%" },
  "uploaded 6 new site photos":
    { ar: "رفع 6 صور جديدة للموقع", he: "העלה 6 תמונות אתר חדשות" },
  "added MEP coordination report v2":
    { ar: "أضاف تقرير تنسيق MEP النسخة 2", he: "הוסיף דוח תיאום MEP גרסה 2" },
  "requested master bathroom photos":
    { ar: "طلب صور الحمام الرئيسي", he: "ביקש תמונות של חדר האמבטיה הראשי" },
  "created Update project risk register":
    { ar: "أنشأ مهمة تحديث سجل مخاطر المشروع", he: "יצר משימה לעדכון מרשם סיכונים" },
  "flagged structural stage as delayed":
    { ar: "علَّم المرحلة الإنشائية كمتأخرة", he: "סימן את שלב הקונסטרוקציה כמעוכב" },
  "uploaded 6 photos to the plaster stage":
    { ar: "رفع 6 صور إلى مرحلة التلبيس", he: "העלה 6 תמונות לשלב הטיח" },
  "approved MEP coordination meeting":
    { ar: "اعتمد اجتماع تنسيق MEP", he: "אישר את פגישת תיאום MEP" },
  "added Structural drawings v3.pdf":
    { ar: "أضاف مخططات إنشائية v3.pdf", he: "הוסיף תוכניות קונסטרוקציה v3.pdf" },
  "completed a tenant photo request":
    { ar: "أنجز طلب صور من المستأجر", he: "השלים בקשת תמונות של דייר" },
  "rejected a tenant meeting request":
    { ar: "رفض طلب اجتماع من المستأجر", he: "דחה בקשת פגישה של דייר" },
  "flagged electrical stage as delayed":
    { ar: "علَّم مرحلة الكهرباء كمتأخرة", he: "סימן את שלב החשמל כמעוכב" },

  // ---- Task description (shared) ---------------------------------
  "Ensure documentation is up to date and stakeholders are notified.":
    { ar: "تأكد من تحديث الوثائق وإخطار أصحاب الشأن.",
      he: "ודא שהמסמכים מעודכנים ושכל בעלי העניין קיבלו הודעה." },

  // ---- Task tags -------------------------------------------------
  "safety":      { ar: "سلامة",     he: "בטיחות" },
  "structural":  { ar: "إنشائي",    he: "קונסטרוקציה" },
  "finishing":   { ar: "تشطيب",     he: "גימור" },
  "procurement": { ar: "توريد",     he: "רכש" },
  "quality":     { ar: "جودة",      he: "איכות" },
  "client":      { ar: "عميل",      he: "לקוח" },

  // ---- Task activity --------------------------------------------
  "Task assigned":  { ar: "تم إسناد المهمة",  he: "המשימה הוקצתה" },
  "Status updated": { ar: "تم تحديث الحالة",  he: "הסטטוס עודכן" },
};

// -----------------------------------------------------------------------

export function translatePhrase(s: string, locale: Locale): string {
  if (locale === "en") return s;
  if (shouldSkip(s)) return s;
  const row = PHRASES[s];
  if (!row) return s;
  return locale === "ar" ? row.ar : row.he;
}

/**
 * Recursively walk any value and translate string leaves via the phrase map.
 * Objects and arrays are cloned; other primitives are passed through.
 */
export function translateData<T>(data: T, locale: Locale): T {
  if (locale === "en" || data == null) return data;
  return walk(data, locale) as T;
}

const SKIP_KEYS = new Set([
  "id", "key", "stageKey", "stageId", "projectId", "assignedTo", "uploadedById",
  "status", "priority", "role", "category", "type", "kind",
  "url", "href", "src", "icon", "iconName", "nameKey", "titleKey", "labelKey",
]);

function walk(node: unknown, locale: Locale): unknown {
  if (typeof node === "string") return translatePhrase(node, locale);
  if (Array.isArray(node)) return node.map((x) => walk(x, locale));
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = SKIP_KEYS.has(k) ? v : walk(v, locale);
    }
    return out;
  }
  return node;
}

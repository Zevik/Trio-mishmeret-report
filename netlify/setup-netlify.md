# הגדרות פריסה בנטליפיי

## מטרת הקובץ
מסמך זה מפרט את השינויים שבוצעו כדי לפתור בעיות פריסה בנטליפיי.

## הבעיה המקורית
האתר בנטליפיי החזיר שגיאת 404 (דף לא נמצא) למרות שהפרויקט הועלה בהצלחה.

## הפתרון
1. **תהליך בנייה מותאם**: יצרנו תסריט בנייה מותאם (`netlify/build.sh`) שבונה את הקבצים ישירות לתיקיית `dist/public`.
2. **עדכון הגדרות נטליפיי**: עדכנו את הקובץ `netlify.toml` להשתמש בתסריט המותאם ולשים לב שתיקיית הפרסום היא `dist/public`.
3. **תיקון הניתובים**: וידאנו שכל הבקשות שאינן API מועברות ל-`index.html`.

## הוראות פריסה
1. העלה את כל השינויים לגיטהאב.
2. באתר נטליפיי, ודא שההגדרות תואמות את ה-`netlify.toml`.
3. הפעל בנייה מחדש (trigger deploy) באתר נטליפיי.

## הערות חשובות
- אל תשנה את מבנה התיקיות או את תהליך הבנייה ללא התייעצות.
- שים לב שהסקריפט `build.sh` הוא עם הרשאות הרצה (executable).
- האתר אמור לפעול עם ניתוב נכון גם לדפים וגם ל-API.
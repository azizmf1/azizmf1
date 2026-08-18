// محلّل رسائل الـ BRS (§9) — يقرأ الكتالوج الموحّد ويعيد النص حسب اللغة.
// المصدر الوحيد: shared/messages.json (تُعيد الواجهة النص من المعرّف).
import catalogue from "../../shared/messages.json";

export type BrsMessageId = keyof typeof catalogue.messages;
export type Lang = "ar" | "en";

/**
 * يعيد نص رسالة BRS بالمعرّف. MSG07 يستوعب {status}.
 * الافتراضي عربي (الواجهة RTL).
 */
export function brsMsg(
  id: BrsMessageId,
  vars?: Record<string, string>,
  lang: Lang = "ar",
): string {
  const entry = catalogue.messages[id] as { ar: string; en: string } | undefined;
  if (!entry) return id;
  let text = entry[lang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(`{${k}}`).join(v);
    }
  }
  return text;
}

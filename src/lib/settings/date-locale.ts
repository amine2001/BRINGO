import { ar, enUS, fr, ptBR } from "date-fns/locale";

import type { AppLanguage } from "@/lib/settings/preferences";

export function getDateFnsLocale(language: AppLanguage) {
  switch (language) {
    case "fr":
      return fr;
    case "ar":
      return ar;
    case "pt":
      return ptBR;
    default:
      return enUS;
  }
}

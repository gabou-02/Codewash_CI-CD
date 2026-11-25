/**
 * The i18n context and its hook, kept apart from I18nProvider.jsx so that file
 * exports a component and nothing else (react-refresh/only-export-components).
 */
import { createContext, useContext } from "react";

export const I18nContext = createContext(null);

/**
 * Returns { t, language, setLanguage, languages }.
 * Throws when used outside the provider: that is a wiring mistake, and a loud
 * failure in development beats half-translated screens in production.
 */
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used inside an I18nProvider");
  }
  return context;
};

import React, { useCallback, useMemo, useState } from 'react';
import { CATALOGS } from './catalogs';
import { I18nContext } from './context';
import { browserStorage, LANGUAGE_STORAGE_KEY } from './storage';
import { listLanguages, pickInitialLanguage, translate } from './translator';

/**
 * Provides the active language and the t() helper to the tree.
 *
 * `catalogs`, `storage` and `systemLanguage` are injected (defaults cover the
 * real app) so tests drive this component without a DOM or a browser global,
 * per the seams policy in docs/DEBT.md (D06).
 */
export const I18nProvider = ({
    children,
    catalogs = CATALOGS,
    storage = browserStorage,
    systemLanguage = navigator.language,
}) => {
    const [language, setLanguageState] = useState(() =>
        pickInitialLanguage(catalogs, storage.getItem(LANGUAGE_STORAGE_KEY), systemLanguage),
    );

    const setLanguage = useCallback(
        (next) => {
            if (!Object.prototype.hasOwnProperty.call(catalogs, next)) return;
            setLanguageState(next);
            storage.setItem(LANGUAGE_STORAGE_KEY, next);
        },
        [catalogs, storage],
    );

    const value = useMemo(
        () => ({
            language,
            setLanguage,
            languages: listLanguages(catalogs),
            t: (key, vars) => translate(catalogs, language, key, vars),
        }),
        [catalogs, language, setLanguage],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

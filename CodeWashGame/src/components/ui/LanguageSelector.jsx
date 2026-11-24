import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from '../../i18n/context';

/**
 * Main-menu language button: opens the list of languages found in
 * src/i18n/locales and switches the game to the one the player picks.
 *
 * The list is never hardcoded here, it comes from the loaded catalogs, so a
 * new locale file shows up on its own (see docs/adr/0001-i18n.md).
 *
 * `playSound` is injected rather than imported so tests mount this component
 * without the audio layer (docs/DEBT.md, D06).
 */
const LanguageSelector = ({ style, playSound = () => {} }) => {
    const { t, language, setLanguage, languages } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => {
        playSound();
        setIsOpen((open) => !open);
    };

    const choose = (code) => {
        playSound();
        setLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="absolute z-40" style={style}>
            <button
                onClick={toggle}
                className="bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                aria-label={t('language.button')}
                title={t('language.button')}
                aria-expanded={isOpen}
            >
                <Languages size={48} className="text-blue-300" />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label={t('language.title')}
                    className="absolute left-0 mt-2 min-w-[14rem] bg-stone-900/95 backdrop-blur-md border-2 border-stone-600 rounded-lg shadow-2xl overflow-hidden"
                >
                    <p className="px-4 py-2 text-stone-400 text-sm font-bold uppercase tracking-wider border-b-2 border-stone-700">
                        {t('language.title')}
                    </p>
                    {languages.map(({ code, name }) => (
                        <button
                            key={code}
                            role="option"
                            aria-selected={code === language}
                            onClick={() => choose(code)}
                            className={`w-full text-left px-4 py-3 text-xl font-bold transition-colors ${
                                code === language
                                    ? 'bg-stone-700 text-yellow-400'
                                    : 'text-stone-200 hover:bg-stone-800'
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;

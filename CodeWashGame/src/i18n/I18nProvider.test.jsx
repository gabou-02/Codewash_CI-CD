// @vitest-environment jsdom
// Tests for the React binding of the i18n layer. New code, so the storage
// fallbacks and the guard clauses are exercised too, not just the happy path.
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { I18nProvider } from './I18nProvider';
import { useTranslation } from './context';
import { LANGUAGE_STORAGE_KEY } from './storage';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
});

const CATALOGS = {
    en: { $meta: { code: 'en', name: 'English' }, hello: 'Hello {{who}}' },
    fr: { $meta: { code: 'fr', name: 'Français' }, hello: 'Bonjour {{who}}' },
};

const memoryStorage = (initial) => {
    const store = new Map(initial ? Object.entries(initial) : []);
    return {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, value),
        read: (key) => store.get(key),
    };
};

/** Minimal consumer exposing everything the hook hands out. */
const Probe = () => {
    const { t, language, setLanguage, languages } = useTranslation();
    return (
        <div>
            <span data-testid="text">{t('hello', { who: 'Eliott' })}</span>
            <span data-testid="language">{language}</span>
            <span data-testid="count">{languages.length}</span>
            <button onClick={() => setLanguage('fr')}>to-fr</button>
            <button onClick={() => setLanguage('de')}>to-de</button>
        </div>
    );
};

const renderProbe = (props) =>
    render(
        <I18nProvider catalogs={CATALOGS} {...props}>
            <Probe />
        </I18nProvider>,
    );

describe('I18nProvider', () => {
    it('translates through the active language and exposes the language list', () => {
        renderProbe({ storage: memoryStorage(), systemLanguage: 'en-GB' });
        expect(screen.getByTestId('text').textContent).toBe('Hello Eliott');
        expect(screen.getByTestId('count').textContent).toBe('2');
    });

    it('starts on the stored language', () => {
        renderProbe({
            storage: memoryStorage({ [LANGUAGE_STORAGE_KEY]: 'fr' }),
            systemLanguage: 'en-GB',
        });
        expect(screen.getByTestId('text').textContent).toBe('Bonjour Eliott');
    });

    it('starts on the host language when nothing is stored', () => {
        renderProbe({ storage: memoryStorage(), systemLanguage: 'fr-FR' });
        expect(screen.getByTestId('language').textContent).toBe('fr');
    });

    it('switches language and persists the choice', () => {
        const storage = memoryStorage();
        renderProbe({ storage, systemLanguage: 'en-GB' });

        act(() => screen.getByText('to-fr').click());

        expect(screen.getByTestId('text').textContent).toBe('Bonjour Eliott');
        expect(storage.read(LANGUAGE_STORAGE_KEY)).toBe('fr');
    });

    it('ignores a language with no catalog instead of blanking the UI', () => {
        const storage = memoryStorage();
        renderProbe({ storage, systemLanguage: 'en-GB' });

        act(() => screen.getByText('to-de').click());

        expect(screen.getByTestId('language').textContent).toBe('en');
        expect(storage.read(LANGUAGE_STORAGE_KEY)).toBeUndefined();
    });

    it('uses localStorage when no storage is injected', () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
        renderProbe({ systemLanguage: 'en-GB' });
        expect(screen.getByTestId('language').textContent).toBe('fr');
    });

    it('reads the host language from navigator when none is injected', () => {
        renderProbe({ storage: memoryStorage() });
        expect(screen.getByTestId('language').textContent).toBeTruthy();
    });

    it('fails loudly outside a provider, since that is a wiring mistake', () => {
        const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Probe />)).toThrow(/inside an I18nProvider/);
        silence.mockRestore();
    });
});

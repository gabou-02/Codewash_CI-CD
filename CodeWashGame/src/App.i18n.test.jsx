// @vitest-environment jsdom
// Covers the i18n wiring inside App: the main-menu buttons must carry a
// translated accessible name, and the language selector must actually switch
// the running game. Everything else about App is untested legacy (docs/DEBT.md
// D05/D06); this file deliberately stays on the language seam.
import React from 'react';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import App from './App';
import { I18nProvider } from './i18n/I18nProvider';
import { LANGUAGE_STORAGE_KEY } from './i18n/storage';

beforeAll(() => {
    // The game builds Audio objects on mount; jsdom has no media stack.
    window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});

const renderApp = (language) => {
    const store = new Map([[LANGUAGE_STORAGE_KEY, language]]);
    return render(
        <I18nProvider
            storage={{
                getItem: (key) => (store.has(key) ? store.get(key) : null),
                setItem: (key, value) => store.set(key, value),
            }}
            systemLanguage="en-GB"
        >
            <App />
        </I18nProvider>,
    );
};

describe('App main menu labels', () => {
    it('names every main-menu button in English', () => {
        renderApp('en');

        for (const name of ['Settings', 'Cosmetics', 'Achievements', 'Report a bug', 'Language']) {
            expect(screen.getByRole('button', { name }), name).toBeDefined();
        }
    });

    it('names every main-menu button in French', () => {
        renderApp('fr');

        for (const name of ['Paramètres', 'Cosmétiques', 'Succès', 'Signaler un bug', 'Langue']) {
            expect(screen.getByRole('button', { name }), name).toBeDefined();
        }
    });
});

describe('App language selector', () => {
    it('switches the whole menu to the picked language', () => {
        renderApp('en');

        act(() => screen.getByRole('button', { name: 'Language' }).click());
        act(() => screen.getByRole('option', { name: 'Français' }).click());

        expect(screen.getByRole('button', { name: 'Paramètres' })).toBeDefined();
        expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
    });
});

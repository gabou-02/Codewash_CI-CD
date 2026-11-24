// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import LanguageSelector from './LanguageSelector';
import { I18nProvider } from '../../i18n/I18nProvider';

afterEach(cleanup);

const CATALOGS = {
    en: {
        $meta: { code: 'en', name: 'English' },
        language: { button: 'Language', title: 'Choose a language' },
    },
    fr: {
        $meta: { code: 'fr', name: 'Français' },
        language: { button: 'Langue', title: 'Choisir une langue' },
    },
};

const memoryStorage = () => {
    const store = new Map();
    return {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, value),
    };
};

const renderSelector = (playSound) =>
    render(
        <I18nProvider catalogs={CATALOGS} storage={memoryStorage()} systemLanguage="en-GB">
            <LanguageSelector playSound={playSound} />
        </I18nProvider>,
    );

describe('LanguageSelector', () => {
    it('shows a labelled button and keeps the list closed at first', () => {
        renderSelector();
        expect(screen.getByRole('button', { name: 'Language' })).toBeDefined();
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('lists every available language on open, marking the active one', () => {
        renderSelector();

        act(() => screen.getByRole('button', { name: 'Language' }).click());

        const options = screen.getAllByRole('option');
        expect(options.map((option) => option.textContent)).toEqual(['English', 'Français']);
        expect(options[0].getAttribute('aria-selected')).toBe('true');
        expect(options[1].getAttribute('aria-selected')).toBe('false');
    });

    it('switches the game language and closes the list on pick', () => {
        renderSelector();

        act(() => screen.getByRole('button', { name: 'Language' }).click());
        act(() => screen.getByRole('option', { name: 'Français' }).click());

        expect(screen.queryByRole('listbox')).toBeNull();
        expect(screen.getByRole('button', { name: 'Langue' })).toBeDefined();
    });

    it('closes the list when the button is pressed again', () => {
        renderSelector();
        const button = screen.getByRole('button', { name: 'Language' });

        act(() => button.click());
        act(() => button.click());

        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('plays the shared click sound on open and on pick', () => {
        const playSound = vi.fn();
        renderSelector(playSound);

        act(() => screen.getByRole('button', { name: 'Language' }).click());
        act(() => screen.getByRole('option', { name: 'Français' }).click());

        expect(playSound).toHaveBeenCalledTimes(2);
    });

    it('mounts without a sound callback', () => {
        renderSelector(undefined);
        act(() => screen.getByRole('button', { name: 'Language' }).click());
        expect(screen.getByRole('listbox')).toBeDefined();
    });
});

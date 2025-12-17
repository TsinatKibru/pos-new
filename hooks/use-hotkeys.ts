import { useEffect } from 'react';

type KeyCombo = {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
};

type HotkeyHandler = (event: KeyboardEvent) => void;

function isMatch(event: KeyboardEvent, combo: KeyCombo): boolean {
    if (event.key.toLowerCase() !== combo.key.toLowerCase()) return false;
    if (!!combo.ctrl !== event.ctrlKey) return false;
    if (!!combo.alt !== event.altKey) return false;
    if (!!combo.shift !== event.shiftKey) return false;
    if (!!combo.meta !== event.metaKey) return false;
    return true;
}

export function useHotkeys(
    check: string | KeyCombo,
    handler: HotkeyHandler,
    deps: any[] = []
) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const combo: KeyCombo = typeof check === 'string' ? { key: check } : check;

            if (isMatch(event, combo)) {
                event.preventDefault();
                handler(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [check, handler, ...deps]);
}

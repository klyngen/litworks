import { filter, fromEvent, map, Observable } from 'rxjs';

export type EventListenerObject<E> = {
    handleEvent(evt: E): void;
};

interface EventListenerElement<E> {
    addEventListener(
        type: string,
        listener: ((evt: E) => null) | EventListenerObject<E> | null,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
        type: string,
        listener: ((evt: E) => null) | EventListenerObject<E> | null,
        options?: EventListenerOptions | boolean
    ): void;
}

/**
 * Simple wrapper arround fromEvent to simplify listening to basic keystrokes on an element
 * @param element - Default to window if not specified
 * */
export function fromKeyEvent(
    characters: readonly string[],
    element: EventListenerElement<KeyboardEvent>
): Observable<KeyboardEvent>;
export function fromKeyEvent(
    characters: readonly string[]
): Observable<KeyboardEvent>;
export function fromKeyEvent(
    characters: readonly string[],
    element?: EventListenerElement<KeyboardEvent>
) {
    if (element) {
        return createKeyEventObservable(element, characters);
    }
    return createKeyEventObservable(window, characters);
}

const createKeyEventObservable = (
    element: EventListenerElement<KeyboardEvent>,
    characters: readonly string[]
) => {
    return fromEvent<KeyboardEvent>(element, 'keyup').pipe(
        map((event) => event),
        filter((event) => filterKeyEvent(event.key, characters))
    );
};

const filterKeyEvent = (character: string, characters: readonly string[]) =>
    characters.includes(character);

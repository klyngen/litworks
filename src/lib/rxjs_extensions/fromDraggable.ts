import {
    finalize,
    fromEvent,
    map,
    mergeMap,
    Observable,
    takeUntil,
} from 'rxjs';

export type Position = { readonly x: number; readonly y: number };
export type DragEvent = {
    readonly startPosition: Position;
    readonly dragPosition: Position;
};

export function createDragObservable<T extends PointerEvent>(
    up$: Observable<T>,
    down$: Observable<T>,
    move$: Observable<T>,
    onDragRelease?: () => null
): Observable<DragEvent> {
    return down$.pipe(
        mergeMap((e) => {
            const startPosition = { x: e.clientX, y: e.clientX };
            return move$.pipe(
                takeUntil(up$),
                map((e) => ({
                    startPosition,
                    dragPosition: {
                        x: e.pageX - startPosition.x,
                        y: e.pageY - startPosition.y,
                    },
                })),
                finalize(() => onDragRelease)
            );
        })
    );
}

/**
 *
 * */
export function fromDragEvent(element: HTMLElement) {
    const mouseUp$ = fromEvent<PointerEvent>(window, 'pointerup');
    const mouseDown$ = fromEvent<PointerEvent>(window, 'pointerdown');
    const mouseMove$ = fromEvent<PointerEvent>(element, 'pointermove');

    return createDragObservable(mouseUp$, mouseDown$, mouseMove$);
}

import {
    finalize,
    fromEvent,
    map,
    merge,
    mergeMap,
    Observable,
    takeUntil,
} from 'rxjs';
import { HasEventTargetAddRemove } from 'rxjs/internal/observable/fromEvent';

export type Position = { readonly x: number; readonly y: number };
export type DragEvent = {
    readonly startPosition: Position;
    readonly dragPosition: Position;
};

/**
 * @param touchEvents - should we listen to touch events and click events
 * */
export function createDragObservable(
    up$: Observable<DragPosition>,
    down$: Observable<DragPosition>,
    move$: Observable<DragPosition>,
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
 * Make drag-and drop implementations easy
 * */
export function fromDragEvent(
    element: HTMLElement,
    options?: {
        listenToTouch?: true;
        onRelease: () => void;
    }
) {
    const mouseUpObservables = [listenToPointerEvent(window, 'pointerup')];
    const mouseDownObservables = [listenToPointerEvent(element, 'pointerdown')];
    const mouseMoveObservables = [listenToPointerEvent(element, 'pointermove')];

    if (options?.listenToTouch === undefined || options.listenToTouch) {
        mouseUpObservables.push(listenToTouchEvent(window, 'touchend'));
        mouseDownObservables.push(listenToTouchEvent(element, 'touchstart'));
        mouseMoveObservables.push(listenToTouchEvent(window, 'touchmove'));
    }

    const mouseUp$ = merge(...mouseUpObservables);
    const mouseDown$ = merge(...mouseDownObservables);
    const mouseMove$ = merge(...mouseMoveObservables);

    return createDragObservable(mouseUp$, mouseDown$, mouseMove$);
}

type DragPosition = {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
};

const listenToPointerEvent = (
    element: HasEventTargetAddRemove<PointerEvent>,
    event: 'pointerup' | 'pointerdown' | 'pointermove'
): Observable<DragPosition> => {
    return fromEvent<PointerEvent>(element, event).pipe(
        map((event) => ({
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
        }))
    );
};

const listenToTouchEvent = (
    element: HasEventTargetAddRemove<TouchEvent>,
    event: 'touchstart' | 'touchmove' | 'touchend'
): Observable<DragPosition> => {
    return fromEvent<TouchEvent>(element, event).pipe(
        map((event) => event.touches[0]),
        map((event) => ({
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
        }))
    );
};

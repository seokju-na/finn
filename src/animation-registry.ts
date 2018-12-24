import { fromEvent, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';


let uniqueId = 0;


export enum AnimationType {
    SCROLL_REACT = 'animationType.scrollReact',
}


export class AnimationResource {
    element: HTMLElement;
    behaviorId: string;
    offsetFallback: 'vertical' | 'horizontal';
    threshold?: number = 50;
}


export interface IAnimationBehavior {
    readonly type: AnimationType;
    resource: AnimationResource;

    onAttached?(): void;

    onDetached?(): void;

    playAnimation(snapshot: IAnimationActStateSnapshot): void;
}


export interface IScrollReactAnimationBehavior extends IAnimationBehavior {
    playAnimation(snapshot: IScrollReactAnimationActStateSnapshot): void;
}


export interface IAnimationActStateSnapshot {
    readonly resource: AnimationResource;
    readonly viewportOffset: { width: number; height: number };
    readonly resourceOffset: { start: number; end: number };
}


export interface IScrollReactAnimationActStateSnapshot
    extends IAnimationActStateSnapshot {

    readonly scrollMatched: boolean;
    readonly scrolledDistance: number;
}


export interface IAnimationRef {
    readonly id: string;
    readonly behavior: IAnimationBehavior;
    readonly onAct: Observable<IAnimationActStateSnapshot>;
}


export interface IScrollReactAnimationRef extends IAnimationRef {
    readonly behavior: IScrollReactAnimationBehavior;
    readonly onAct: Observable<IScrollReactAnimationActStateSnapshot>;
}


export class AnimationRegistry {
    private _refs = new Map<string, IAnimationRef>();
    private _refOnActSubscriptions = new Map<string, Subscription>();

    private _behaviorConstructs = new Map<string, new () => IAnimationBehavior>();

    // 스크롤 이벤트 스트림입니다. ScrollReactAnimation에 사용됩니다.
    // 포퍼먼스에 이슈가 있으나 자연스러운 애니메이션을 위해 auditTime을 사용하지 않았습니다.
    private _scrolled = fromEvent(window.document, 'scroll')
        .pipe(
            map(() => document.documentElement.scrollTop),
            startWith(document.documentElement.scrollTop),
        );

    destroy(): void {
        this._refs.clear();

        this._refOnActSubscriptions.forEach((subscription) => {
            if (subscription && !subscription.closed) {
                subscription.unsubscribe();
            }
        });
        this._refOnActSubscriptions.clear();

        this._behaviorConstructs.clear();
    }

    setAnimationBehavior(id: string, behaviorConstructor: new () => IAnimationBehavior): this {
        this._behaviorConstructs.set(id, behaviorConstructor);
        return this;
    }

    registerAnimation(
        type: AnimationType,
        resource: AnimationResource,
    ): IAnimationRef {
        // 등록되어 있는 Behavior를 확인합니다. 만약 없거나, 유효하지 않다면 예외를 발생시킵니다.
        const behaviorConstructor = this._behaviorConstructs.get(resource.behaviorId);
        let behavior: IAnimationBehavior;

        if (behaviorConstructor === undefined) {
            throw new Error(`'${resource.behaviorId}'에 해당하는 IAnimationBehavior이 존재하지 않습니다.`);
        }

        behavior = new behaviorConstructor();
        behavior.resource = resource;

        if (behavior.type !== type) {
            throw new Error(`'${resource.behaviorId}'으로 '${type}' 종류의 애니메이션을 처리할 수 없습니다.`);
        }

        // AnimationRef를 생성합니다.
        const id = `animation-registered-${uniqueId++}`;
        let onAct: Observable<IAnimationActStateSnapshot>;

        switch (type) {
            case AnimationType.SCROLL_REACT:
                onAct = this._scrolled.pipe(
                    map(scrolled =>
                        this.getScrollReactAnimationCurrentActState(scrolled, resource)),
                ) as Observable<IScrollReactAnimationActStateSnapshot>;
                break;
        }

        if (!resource.element.id) {
            resource.element.id = id;
        }

        const ref: IAnimationRef = { id, onAct, behavior };

        if (ref.behavior.onAttached) {
            ref.behavior.onAttached();
        }

        const subscription = ref.onAct.subscribe(snapshot => behavior.playAnimation(snapshot));

        this._refs.set(id, ref);
        this._refOnActSubscriptions.set(id, subscription);

        return ref;
    }

    registerScrollReactAnimation(resource: AnimationResource): IScrollReactAnimationRef {
        return this.registerAnimation(
            AnimationType.SCROLL_REACT,
            resource,
        ) as IScrollReactAnimationRef;
    }

    unregisterAnimation(refId: string): void {
        if (this._refs.has(refId)) {
            const ref = this._refs.get(refId);

            if (ref.behavior.onDetached) {
                ref.behavior.onDetached();
            }

            this._refs.delete(refId);
        }

        if (this._refOnActSubscriptions.has(refId)) {
            const subscription = this._refOnActSubscriptions.get(refId);

            if (subscription && !subscription.closed) {
                subscription.unsubscribe();
            }

            this._refOnActSubscriptions.delete(refId);
        }
    }

    private getScrollReactAnimationCurrentActState(
        scrollTop: number,
        resource: AnimationResource,
    ): IScrollReactAnimationActStateSnapshot {
        const viewport = { width: window.innerWidth, height: innerHeight };
        const offset = this.getOffsetForResource(resource);

        const clientStart = scrollTop;
        let clientEnd: number;

        if (resource.offsetFallback === 'vertical') {
            clientEnd = viewport.height + scrollTop;
        } else if (resource.offsetFallback === 'horizontal') {
            clientEnd = viewport.width + scrollTop;
        }

        return {
            resource,
            scrollMatched: (offset.start < clientEnd && clientEnd < offset.end)
                || (clientStart < offset.start && offset.end < clientEnd)
                || (offset.start < clientStart && offset.end > clientStart),
            scrolledDistance: scrollTop,
            viewportOffset: viewport,
            resourceOffset: offset,
        };
    }

    private getOffsetForResource(resource: AnimationResource): { start: number, end: number } {
        const { element, threshold, offsetFallback } = resource;
        const offset = { start: 0, end: 0 };

        if (offsetFallback === 'vertical') {
            offset.start = element.offsetTop - threshold;
            offset.end = element.offsetTop + element.offsetHeight + threshold;
        } else if (offsetFallback === 'horizontal') {
            offset.start = element.offsetTop - threshold;
            offset.end = element.offsetTop + element.offsetWidth + threshold;
        }

        return offset;
    }
}

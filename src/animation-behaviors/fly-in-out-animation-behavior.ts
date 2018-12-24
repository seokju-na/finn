import {
    AnimationResource,
    AnimationType,
    IScrollReactAnimationActStateSnapshot,
    IScrollReactAnimationBehavior,
} from '../animation-registry';
import { addClassIfNotContains, removeClassIfContains } from '../utils/class-list';


const BASE_CLASS_NAME = 'FlyInOutAnimation';
const ANIM_ACT_CLASS_NAME = `${BASE_CLASS_NAME}--act`;


export class FlyInOutAnimationBehavior implements IScrollReactAnimationBehavior {
    readonly type = AnimationType.SCROLL_REACT;
    resource: AnimationResource;

    onAttached(): void {
        addClassIfNotContains(this.resource.element, BASE_CLASS_NAME);
    }

    onDetached(): void {
        removeClassIfContains(this.resource.element, BASE_CLASS_NAME);
    }

    playAnimation(snapshot: IScrollReactAnimationActStateSnapshot): void {
        const elem = snapshot.resource.element;

        if (snapshot.scrollMatched) {
            addClassIfNotContains(elem, ANIM_ACT_CLASS_NAME);
        } else {
            removeClassIfContains(elem, ANIM_ACT_CLASS_NAME);
        }
    }
}

export function addClassIfNotContains(elem: HTMLElement, className: string): void {
    const { classList } = elem;

    if (!classList.contains(className)) {
        classList.add(className);
    }
}


export function removeClassIfContains(elem: HTMLElement, className: string): void {
    const { classList } = elem;

    if (classList.contains(className)) {
        classList.remove(className);
    }
}

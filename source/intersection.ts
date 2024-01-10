

const connectedEvent = new CustomEvent('connected');

const disconnectedEvent = new CustomEvent('disconnected');

const intersectionElements: WeakMap<Element, { wasConnected: boolean, isIntersecting: boolean; }> = new WeakMap();

export const intersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        const intersectionElement = intersectionElements.get(entry.target);
        if (!intersectionElement) {
            intersectionElements.set(entry.target, { wasConnected: false, isIntersecting: entry.isIntersecting });
        } else if (entry.target.isConnected === true && intersectionElement.wasConnected === false) {
            intersectionElement.wasConnected = true;
            intersectionElement.isIntersecting = entry.isIntersecting;
            entry.target.dispatchEvent(connectedEvent);
        } else if (entry.target.isConnected === false && intersectionElement.wasConnected === true) {
            intersectionElement.wasConnected = false;
            intersectionElement.isIntersecting = entry.isIntersecting;
            entry.target.dispatchEvent(disconnectedEvent);
        } else {
            //
        }
    }
}, {
    threshold: 1,
    // rootMargin: '100000%',
    root: document.documentElement,
});
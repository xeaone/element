import load from './load';
import dash from './dash';

export default function define (component: any) {
    if (typeof component === 'string') {
        return load(component).then(loaded => define(loaded.default));
    } else if (component instanceof Array) {
        return Promise.all(component.map(data => define(data)));
    } else {
        customElements.define(dash(component.name), component);
    }
}

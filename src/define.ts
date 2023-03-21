import dash from './dash';

export default function define(name: string, constructor: CustomElementConstructor) {
    if (!customElements.get(name)) {
        customElements.define(name, constructor);
    }
}
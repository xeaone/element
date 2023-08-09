
export default function define (name: string, constructor: CustomElementConstructor) {
    if (customElements.get(name) !== constructor) {
        customElements.define(name, constructor);
    }
}
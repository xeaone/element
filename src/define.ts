export default function Define (name: string, constructor: CustomElementConstructor) {
    customElements.define(name, constructor);
}

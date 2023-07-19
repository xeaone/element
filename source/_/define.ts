export default function define(name: string, constructor: CustomElementConstructor) {
    customElements.define(name, constructor);
}

export default function define(name, constructor) {
    if (customElements.get(name) !== constructor) {
        customElements.define(name, constructor);
    }
}
//# sourceMappingURL=define.js.map
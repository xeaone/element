export default (instance: Node) => {
    if (customElements.upgrade) {
        customElements.upgrade(instance);
    }
}
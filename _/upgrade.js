export default (function (instance) {
    if (customElements.upgrade) {
        customElements.upgrade(instance);
    }
});

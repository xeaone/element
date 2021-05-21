
console.warn('toggleing attribute replace attr node');

export default {
    async setup (binder) {
        binder.target.addEventListener('input', async () => {
            const data = binder.data = binder.target.checked;
            binder.target.toggleAttribute('checked', data);
        });
    },
    async write (binder) {
        const data = await binder.compute();
        binder.target.checked = data;
        binder.target.toggleAttribute('checked', data);
    }
};

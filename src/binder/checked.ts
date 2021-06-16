
console.warn('toggleing attribute replace attr node');

export default {
    async setup (binder) {
        binder.target.addEventListener('input', async () => {
            const checked = binder.target.checked;
            const computed = await binder.compute({ checked });
            binder.target.toggleAttribute('checked', computed);
        });
    },
    async write (binder) {
        const checked = binder.assignee();
        const computed = await binder.compute({ checked });
        binder.target.checked = computed;
        binder.target.toggleAttribute('checked', computed);
    }
};

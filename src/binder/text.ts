
export default {
    async write (binder) {
        let data = await binder.compute();
        data = data === undefined ? '' : data;
        if (data === binder.target.textContent) return;
        binder.target.textContent = data;
    }
};

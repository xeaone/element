import { toString } from '../tool';

export default {
    async write (binder) {
        const data = toString(await binder.compute());
        if (data === binder.target.textContent) return;
        binder.target.textContent = data;
    }
};

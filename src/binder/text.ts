import { isNone, toString } from '../tool';

export default {
    async write (binder) {
        let data = await binder.compute();
        data = isNone(data) ? '' : toString(data);
        if (data === binder.target.textContent) return;
        binder.target.textContent = data;
    }
};

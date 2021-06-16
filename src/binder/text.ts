import { isNoneish, toString } from '../tool';

export default {
    async write (binder) {
        let data = toString(await binder.compute());
        data = isNoneish(data) ? '' : data;
        if (data === binder.target.textContent) return;
        binder.target.textContent = data;
    }
};

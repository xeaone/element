import { toString } from '../tool';

export default function (binder) {
    return {
        async write () {
            const data = toString(await binder.compute());
            if (data === binder.target.textContent) return;
            binder.target.textContent = data;
        }
    };
}

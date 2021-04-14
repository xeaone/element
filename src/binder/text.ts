import { toString } from '../tool';

export default function (binder) {
    let data;
    return {
        async read () {
            data = await binder.expression();
            data = toString(data);
        },
        async write () {
            if (data === binder.target.textContent) return;
            binder.target.textContent = data;
        }
    };
}

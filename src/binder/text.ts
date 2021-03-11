import { toString } from '../tool';

export default function (binder) {
    let data;
    return {
        async read() {
            data = toString(binder.data);
        },
        async write() {
            if (data === binder.target.textContent) return;
            binder.target.textContent = data;
        }
    };
}

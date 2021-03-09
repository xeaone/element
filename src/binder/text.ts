import { toString } from '../tool';

export default function (binder) {
    let data;
    return {
        read() {
            data = toString(binder.data);
        },
        write() {
            if (data === binder.target.textContent) return;
            binder.target.textContent = data;
        }
    };
}

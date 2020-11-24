import { toString } from '../tool';

export default function (binder) {
    let data;
    return {
        read () {
            data = toString(binder.data);

            if (data === binder.target.textContent) {
                this.write = false;
                return;
            }

        },
        write () {
            binder.target.textContent = data;
        }
    };
}

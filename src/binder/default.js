import { toString } from '../tool.js';

export default function (binder) {
    let data;
    return {
        read () {
            data = toString(binder.data);

            if (data === binder.target[binder.type]) {
                this.write = false;
                return;
            }

        },
        write () {
            binder.target[binder.type] = data;
            binder.target.setAttribute(binder.type, data);
        }
    };
}

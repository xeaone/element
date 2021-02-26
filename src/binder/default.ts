import { toString } from '../tool';

export default function (binder) {
    let data;
    return {
        read() {
            data = binder.data;
            data = data === null || data === undefined ? '' : data;
            data = toString(data);
            data = binder.display(data);

            // if (data === binder.target[binder.type]) {
            //     this.write = false;
            //     return;
            // }

        },
        write() {
            binder.target[binder.type] = data;
            binder.target.setAttribute(binder.type, data);
        }
    };
}

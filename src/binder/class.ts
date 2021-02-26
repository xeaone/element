import { toString } from "../tool";

export default function (binder) {
    let data, name;
    return {
        read() {

            data = binder.data;
            data = typeof data !== 'string' && data ? binder.key : data;
            data = binder.display(toString(data));

            if (data === binder.target.class) {
                this.write = false;
                return;
            }

        },
        write() {
            binder.target.class = data;
            binder.target.setAttribute('class', data);
        }
    };
}

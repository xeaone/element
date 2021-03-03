
export default function (binder) {
    let data;
    return {
        read() {

            data = binder.data;

            if (typeof data !== 'string') data = data ? binder.key : '';

            data = binder.display(data);

            if (data === binder.target.className) {
                this.write = false;
                return;
            }

        },
        write() {
            binder.target.className = data;
            binder.target.setAttribute('class', data);
        }
    };
}

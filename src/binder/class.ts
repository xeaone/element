
export default function (binder) {
    let data;
    return {
        async read() {

            data = await binder.data;

            if (typeof data !== 'string') data = data ? binder.key : '';

            // data = binder.display(data);

            if (data === binder.target.className) {
                this.write = false;
                return;
            }

        },
        async write() {
            binder.target.className = data;
            binder.target.setAttribute('class', data);
        }
    };
}

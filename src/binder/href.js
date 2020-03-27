
export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data || '';

            if (data === binder.target.href) {
                this.write = false;
                return;
            }

        },
        write () {
            binder.target.href = data;
        }
    };
}

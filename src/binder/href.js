
export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data || '';

            if (data === binder.target.href) {
                return this.write = false;
            }

        },
        write () {
            binder.target.href = data;
        }
    };
}

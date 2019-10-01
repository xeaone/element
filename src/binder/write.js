
export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data;

            if (!data === binder.target.readOnly) {
                return this.write = false;
            }

        },
        write () {
            binder.target.readOnly = !data;
        }
    };
}

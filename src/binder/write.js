
export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data;

            if (!data === binder.target.readOnly) {
                this.write = false;
                return;
            }

        },
        write () {
            binder.target.readOnly = !data;
        }
    };
}

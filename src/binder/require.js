
export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data;

            if (data === binder.target.required) {
                this.write = false;
                return;
            }

        },
        write () {
            binder.target.required = data;
        }
    };
}


export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data;

            if (data === binder.target.required) {
                return this.write = false;
            }

        },
        write () {
            binder.target.required = data;
        }
    };
}

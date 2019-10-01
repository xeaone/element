
export default function (binder) {
    let data;
    return {
        read () {
            data = !binder.data;

            if (data === binder.target.disabled) {
                return this.write = false;
            }

        },
        write () {
            binder.target.disabled = data;
        }
    };
}

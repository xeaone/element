
export default function (binder) {
    let data;
    return {
        read () {
            data = !binder.data;

            if (data === binder.target.disabled) {
                this.write = false;
                return;
            }

        },
        write () {
            binder.target.disabled = data;
            binder.target.setAttribute('disabled', data);
        }
    };
}

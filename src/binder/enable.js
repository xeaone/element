
export default function (binder) {
    return {
        read () {
            this.data = !binder.data;

            if (this.data === binder.target.disabled) {
                return this.write = false;
            }

        },
        write () {
            binder.target.disabled = this.data;
        }
    };
}

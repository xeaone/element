
export default function (binder) {
    return {
        read () {
            this.data = binder.data;

            if (this.data === binder.target.readOnly) {
                return this.write = false;
            }

        },
        write () {
            binder.target.readOnly = this.data;
        }
    };
}

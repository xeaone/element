
export default function (binder) {
    return {
        read () {
            this.data = binder.data || '';

            if (this.data === binder.target.href) {
                return this.write = false;
            }

        },
        write () {
            binder.target.href = this.data;
        }
    };
}

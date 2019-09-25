
export default function (binder) {
    return {
        read () {
            this.data = binder.data;

            if (!this.data === binder.target.hidden) {
                return this.write = false;
            }

        },
        write () {
            binder.target.hidden = !this.data;
        }
    };
}

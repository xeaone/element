
export default function (binder) {
    return {
        read () {
            this.data = binder.data;

            if (this.data === undefined || this.data === null) {
                this.data = '';
            } else if (typeof this.data === 'object') {
                this.data = JSON.stringify(this.data);
            } else if (typeof this.data !== 'string') {
                this.data = this.data.toString();
            }

            if (this.data === binder.target[binder.type]) {
                return false;
            }

        },
        write () {
            binder.target[binder.type] = this.data;
        }
    };
}

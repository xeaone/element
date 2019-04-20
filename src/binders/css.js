
export default function (binder) {
    return {
        read () {
            this.data = binder.data;

            if (binder.names.length > 1) {
                this.data = binder.names.slice(1).join('-') + ': ' +  this.data + ';';
            }

            if (this.data === binder.target.style.cssText) {
                return false;
            }

        },
        write () {
            binder.target.style.cssText = this.data;
        }
    };
}

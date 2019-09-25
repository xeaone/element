
export default function (binder) {
    return {
        read () {
            this.data = binder.data;

            if (this.data === binder.target.required) {
                return this.write = false;
            }
            
        },
        write () {
            binder.target.required = this.data;
        }
    };
}

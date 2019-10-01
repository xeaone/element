
export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data;

            if (data === binder.target.hidden) {
                return this.write = false;
            }

        },
        write () {
            binder.target.hidden = data;
        }
    };
}

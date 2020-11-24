
export default function (binder) {
    let data;
    return {
        read () {
            data = !binder.data;

            if (data === binder.target.hidden) {
                this.write = false;
                return;
            }

        },
        write () {
            binder.target.hidden = data;
            binder.target.setAttribute('hidden', data);
        }
    };
}


export default function (binder) {
    let data, name;
    return {
        read () {
            data = binder.data;

            if (binder.names.length > 1) {
                name = binder.names.slice(1).join('-');
            }

        },
        write () {

            if (data === undefined || data === null) {
                if (name) {
                    binder.target.classList.remove(name);
                } else {
                    binder.target.setAttribute('class', '');
                }
            } else {
                if (name) {
                    binder.target.classList.toggle(name, data);
                } else {
                    binder.target.setAttribute('class', data);
                }
            }

        }
    };
}

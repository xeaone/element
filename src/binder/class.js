
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

            if (name) {

                if (data === undefined || data === null) {
                    binder.target.classList.remove(name);
                } else {
                    binder.target.classList.toggle(name, data);
                }

            } else {

                if (data === undefined || data === null) {
                    binder.target.setAttribute('class', '');
                } else {
                    binder.target.setAttribute('class', data);
                }

            }

        }
    };
}


export default function (binder) {
    let data, name, names;
    return {
        read () {
            data = binder.data;

            if (binder.names.length > 1) {

                name = '';
                names = binder.names.slice(1);

                for (let i = 0, l = names.length; i < l; i++) {

                    if (i === 0) {
                        name = names[i].toLowerCase();
                    } else {
                        name += names[i].charAt(0).toUpperCase() + names[i].slice(1).toLowerCase();
                    }

                }

            }

        },
        write () {

            if (binder.names.length > 1) {

                if (data) {
                    binder.target.style[name] = data;
                } else {
                    binder.target.style[name] = '';
                }

            } else {

                if (data) {
                    binder.target.style.cssText = data;
                } else {
                    binder.target.style.cssText = '';
                }

            }

        }
    };
}

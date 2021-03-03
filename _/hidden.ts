
export default function (binder) {
    let data;
    return {
        read() {
            data = binder.data ? true : false;
        },
        write() {
            binder.target.hidden = data;
            if (data) binder.target.setAttribute('hidden', '');
            else binder.target.removeAttribute('hidden');
        }
    };
}

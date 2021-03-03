
export default function (binder) {
    let data;
    return {
        read() {
            data = binder.data ? true : false;
        },
        write() {
            binder.target.disabled = data;
            if (data) binder.target.setAttribute('disabled', '');
            else binder.target.removeAttribute('disabled');
        }
    };
}

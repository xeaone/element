
export default function (binder) {
    let data;
    return {
        read() {
            data = !binder.data;
        },
        write() {
            binder.target.disabled = data;
            binder.target.setAttribute('disabled', data);
        }
    };
}

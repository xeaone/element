
export default function (binder) {
    let data;
    return {
        read() {
            data = binder.data ? true : false;
        },
        write() {
            binder.target.readOnly = data;
            binder.target.setAttribute('readonly', data);
        }
    };
}

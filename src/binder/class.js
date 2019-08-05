
export default function (binder) {
    return {
        read () {
            this.data = binder.data;

            if (binder.names.length > 1) {
                this.name = binder.names.slice(1).join('-');
            }

        },
        write () {

            if (this.name) {

                if (this.data === undefined || this.data === null) {
                    binder.target.classList.remove(this.name);
                } else {
                    binder.target.classList.toggle(this.name, this.data);
                }

            } else {

                if (this.data === undefined || this.data === null) {
                    binder.target.setAttribute('class', '');
                } else {
                    binder.target.setAttribute('class', this.data);
                }

            }
            
        }
    };
}

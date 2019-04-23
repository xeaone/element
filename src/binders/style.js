
export default function (binder) {
    return {
        read () {
            this.data = binder.data;

            if (binder.names.length > 1) {
                this.name = '';
                this.names = binder.names.slice(1);

                for (let i = 0, l = this.names.length; i < l; i++) {
                    if (i === 0) {
                        this.name = this.names[i].toLowerCase();
                    } else {
                        this.name += this.names[i].charAt(0).toUpperCase() + this.names[i].slice(1).toLowerCase();
                    }
                }

            }

        },
        write () {
            if (binder.names.length > 1) {
                if (this.data) {
                    binder.target.style[this.name] = this.data;
                } else {
                    binder.target.style[this.name] = '';
                }
            } else {
                if (this.data) {
                    binder.target.style.cssText = this.data;
                } else {
                    binder.target.style.cssText = '';
                }
            }
        }
    };
}

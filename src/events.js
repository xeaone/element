
export default Object.freeze({

    events: {},

    on (name, method) {
        if (!(name in this.events)) this.events[name] = [];

        this.events[name].push(method);
    },

    off (name, method) {
        if (!(name in this.events)) return;

        const index = this.events[name].indexOf(method);

        if (index !== -1) this.events[name].splice(index, 1);
    },

    emit (name) {
        if (!(name in this.events)) return;

        const methods = this.events[name];
        const args = Array.prototype.slice.call(arguments, 2);

        Promise.all(methods.map(method => method.apply(this, args))).catch(console.error);
    }

});

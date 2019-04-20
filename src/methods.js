import Utility from './utility.js';

const DATA = {};

export default {

    get data () { return DATA; },

    get (path) {
        return Utility.getByPath(this.data, path);
    },

    set (path, data) {
        return Utility.setByPath(this.data, path, data);
    }

};

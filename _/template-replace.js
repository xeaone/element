
const innerHandler = function (character, index, string) {
    if (string[index-1] === '\\') return;
    if (character === '"') return '\\"';
    if (character === '\t') return '\\t';
    if (character === '\r') return '\\r';
    if (character === '\n') return '\\n';
    if (character === '\b') return '\\b';
    if (character === '\'') return '\\\'';
};

const updateString = function (value, index, string) {
    return string.slice(0, index) + value + string.slice(index+1);
};

const updateIndex = function (value, index) {
    return index + value.length-1;
};

const template = function (data) {

    const first = data.indexOf('`');
    const second = data.indexOf('`', first + 1);

    if (first === -1 || second === -1) return data;

    let value;
    let ends = 0;
    let starts = 0;
    let string = data;
    let inner = false;

    for (let index = 0; index < string.length; index++) {
        const current = string[index];
        const previous = string[index-1];

        if (current === '`' && previous !== '\\') {

            if (inner) {
                ends++;
                value = '\'';
                inner = false;
                string = this.updateString(value, index, string);
                index = this.updateIndex(value, index);
            } else {
                starts++;
                value = '\'';
                inner = true;
                string = this.updateString(value, index, string);
                index = this.updateIndex(value, index);
            }

        } else if (inner) {
            value = this.innerHandler(current, index, string);

            if (value) {
                string = this.updateString(value, index, string);
                index = this.updateIndex(value, index);
            }

        }

    }

    string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

    if (starts === ends) {
        return string;
    } else {
        throw new Error('import transformer missing backtick');
    }

};

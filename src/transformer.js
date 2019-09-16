import Path from './path.js';

export default {
    /*
		templates
	*/
    innerHandler: function (character, index, string) {
        if (string[index-1] === '\\') return;
        if (character === '\'') return '\\\'';
        if (character === '\"') return '\\"';
        if (character === '\t') return '\\t';
        if (character === '\r') return '\\r';
        if (character === '\n') return '\\n';
        if (character === '\w') return '\\w';
        if (character === '\b') return '\\b';
    },
    updateString: function (value, index, string) {
        return string.slice(0, index) + value + string.slice(index+1);
    },
    updateIndex: function (value, index) {
        return index + value.length-1;
    },
    template: function (data) {

        var first = data.indexOf('`');
        var second = data.indexOf('`', first+1);

        if (first === -1 || second === -1) return data;

        var value;
        var ends = 0;
        var starts = 0;
        var string = data;
        var isInner = false;

        for (var index = 0; index < string.length; index++) {
            var character = string[index];

            if (character === '`' && string[index-1] !== '\\') {

                if (isInner) {
                    ends++;
                    value = '\'';
                    isInner = false;
                    string = this.updateString(value, index, string);
                    index = this.updateIndex(value, index);
                } else {
                    starts++;
                    value = '\'';
                    isInner = true;
                    string = this.updateString(value, index, string);
                    index = this.updateIndex(value, index);
                }

            } else if (isInner) {

                if (value = this.innerHandler(character, index, string)) {
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

    },
    /*
		modules
	*/
    exp: /export\s+default\s*(var|let|const)?/,
    imps: /import(?:\s+(?:\*\s+as\s+)?\w+\s+from)?\s+(?:'|").*?(?:'|");?\n?/g,
    imp: /import(?:\s+(?:\*\s+as\s+)?(\w+)\s+from)?\s+(?:'|")(.*?)(?:'|");?\n?/,
    module: function (code, url) {

        var before = 'return Promise.all([\n';
        var after = ']).then(function ($MODULES) {\n';
        var parentImport = url.slice(0, url.lastIndexOf('/') + 1);

        var imps = code.match(this.imps) || [];

        for (var i = 0, l = imps.length; i < l; i++) {
            var imp = imps[i].match(this.imp);

            var rawImport = imp[0];
            var nameImport = imp[1];
            var pathImport = imp[2];

            if (pathImport.slice(0, 1) !== '/') {
                pathImport = Path.normalize(parentImport + '/' + pathImport);
            } else {
                pathImport = Path.normalize(pathImport);
            }

            before = before + '\t$LOADER.load("' + pathImport + '"),\n';
            after = after + 'var ' + nameImport + ' = $MODULES[' + i + '].default;\n';

            code = code.replace(rawImport, '');
        }

        if (this.exp.test(code)) {
            code = code.replace(this.exp, 'var $DEFAULT = ');
            code = code + '\n\nreturn { default: $DEFAULT };\n';
        }

        code = '"use strict";\n' + before + after + code + '});';
        // code = '"use strict";\n' + before + after + code + '}).catch(console.error);';
        // code = '"use strict";\n' + before + after + code + '}).catch(function (error) { return error; });';

        return code;
    }

};

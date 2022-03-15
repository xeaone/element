
const caches = new Map();
const splitPattern = /\s*{{\s*|\s*}}\s*/;

const bracketPattern = /({{)|(}})/;
const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');

const computer = function (binder) {
    let cache = caches.get(binder.value);
    if (cache) return cache.bind(null, binder.context);

    let reference = '';
    let assignment = '';
    let code = binder.value;

    const isValue = binder.node.name === 'value';
    const isChecked = binder.node.name === 'checked';
    const convert = code.split(splitPattern).filter(part => part).length > 1;

    code = code.replace(codePattern, function (match, string, assignee, assigneeLeft, r, assigneeMiddle, assigneeRight, bracketLeft, bracketRight) {
        if (string) return string;
        if (bracketLeft) return convert ? `' + (` : '(';
        if (bracketRight) return convert ? `) + '` : ')';
        if (assignee) {
            if (isValue || isChecked) {
                reference = r;
                assignment = assigneeLeft + assigneeRight;
                return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
            } else {
                return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
            }
        }
    });

    code = convert ? `'${code}'` : code;

    if (assignment) {
        code = `
        if ($assignment) {
            return ${code};
        } else {
            ${isValue ? `$value = ${reference || `undefined`};` : ''}
            ${isChecked ? `$checked = ${reference || `undefined`};` : ''}
            return ${assignment || code};
        }
        `;
    } else {
        code = `return ${code};`;
    }

    code = `
    try {
        $instance = $instance || {};
        with ($context) {
            with ($instance) {
                ${code}
            }
        }
    } catch (error){
        console.error(error);
    }
    `;

    cache = new Function('$context', '$instance', code);
    caches.set(binder.value, cache);

    return cache.bind(null, binder.context);
};

export default computer;

const caches = new Map();
const splitPattern = /\s*{{\s*|\s*}}\s*/;

const bracketPattern = /({{)|(}})/;
const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');

const computer = function (binder: any) {
    let cache = caches.get(binder.value);
    if (cache) return cache.bind(null, binder.context);

    let reference = '';
    let assignment = '';
    let code = binder.value;

    const isValue = binder.node.name === 'value';
    const isChecked = binder.node.name === 'checked';
    const convert = code.split(splitPattern).filter((part: string) => part).length > 1;

    code = code.replace(codePattern, function (_match: any, string: string, assignee: string, assigneeLeft: string, r: string, assigneeMiddle: string, assigneeRight: string, bracketLeft: string, bracketRight: string) {
        if (string) return string;
        if (bracketLeft) return convert ? `' + (` : '(';
        if (bracketRight) return convert ? `) + '` : ')';
        if (assignee) {
            if (isValue || isChecked) {
                reference = r;
                assignment = assigneeLeft + assigneeRight;
            }
            return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
        }
    });

    code = convert ? `'${code}'` : code;

    code =
        (reference && isValue ? `$value = $assignment ? $value : ${reference};\n` : '') +
        (reference && isChecked ? `$checked = $assignment ? $checked : ${reference};\n` : '') +
        `return ${assignment ? `$assignment ? ${code} : ${assignment}` : `${code}`};`;

    // console.log(code, binder.owner);

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

    return cache.bind(binder.owner, binder.context);
    // return cache.bind(null, binder.context);
};

export default computer;
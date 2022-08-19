// does not ignore arrow func params from being watched
// does not convert outside {{ }} to string any more

const stringChar = [
    '`','"',"'"
];

const referenceEnd = [
    ',','?',':','!','|',';','@','#','&','^','%','*','+','=','-','~','<','>','(',')','{','}','[',']'
];

const referenceStart = [
    'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
    'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
    '$','_'
];

const referenceInner = [
    'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
    'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
    '0','1','2','3','4','5','6','7','8','9',
    '$','_','.'
];

const referenceIgnore = [
    '$context','$instance','$assign','$event','$value','$checked','$form','$e','$v','$c','$f',

    'this','arguments','true','false','null',

    'of','in','do','if','for','new','try','case','else','with', 'while', 'await', 'break','catch',
    'class','super','throw', 'yield','delete','export','import','return','switch','default',
    'extends','finally','continue','debugger','function','typeof','instanceof','void',

    'window',
    'undefined','NaN',
    'globalThis','self','document',
    'console','location','history','navigation','localStorage','sessionStorage',
    'Infinity','Math','Map','Set','Array','Object','String','RegExp',
    'isFinite','isNaN','parseFloat','parseInt','btoa','atob',
    'decodeURI','decodeURIComponent','encodeURI','encodeURIComponent',
];

export default function parse (data:string) {
    let code = '';

    let objectMode = 0;

    let assignmentLeft = '';
    let assignmentRight = '';
    let assignmentMode = false;

    let string = '';
    let stringMode = false;

    let reference = '';
    let referenceMode = false;
    const references: Array<string> = [];

    for (let index = 0; index < data.length; index++) {
        const char = data[index];
        const next1 = data[index+1];
        const next2 = data[index+2];
        const next3 = data[index+3];
        const last1 = data[index-1];

        if (!stringMode && !objectMode && char == '{' && next1 == '{') {
            index++;
            continue;
        }

        if (!stringMode && !objectMode && char == '}' && next1 == '}') {

            // assignment end
            if (!assignmentRight) assignmentLeft = '';

            if (referenceMode){
                references.push(reference);
                referenceMode = false;
                reference = '';
            }

            index++;
            continue;
        }

        code += char;

        // object property name end
        if (!stringMode && objectMode && char == ':') {
            reference = '';
            referenceMode = false;
        }

        // object mode start
        if (!stringMode && char == '{') {
            objectMode++;
        }

        // object mode end
        if (!stringMode && char == '}') {
            objectMode--;
        }

        // assignment right collect
        if (assignmentMode) {
            assignmentRight += char;
        }

        // assignment start
        if (!assignmentMode && !stringMode &&
            char == '=' && last1 != '=' && next1 != '=' && next1 != '>' ||
            char == '+' && next1 == '=' ||
            char == '-' && next1 == '=' ||
            char == '*' && next1 == '=' ||
            char == '/' && next1 == '=' ||
            char == '%' && next1 == '=' ||
            char == '&' && next1 == '=' ||
            char == '^' && next1 == '=' ||
            char == '|' && next1 == '=' ||
            char == '*' && next1 == '*' && next2 == '=' ||
            char == '<' && next1 == '<' && next2 == '=' ||
            char == '>' && next1 == '>' && next2 == '=' ||
            char == '&' && next1 == '&' && next2 == '=' ||
            char == '|' && next1 == '|' && next2 == '=' ||
            char == '?' && next1 == '?' && next2 == '=' ||
            char == '>' && next1 == '>' && next2 == '>' && next3 == '=') {
            assignmentMode = true;
            assignmentRight += char;
        }

        // assignment left collect
        if (!assignmentMode && !assignmentRight && !stringMode) {
            assignmentLeft += char;
        }

        // string end
        if (stringMode && string == char && last1 != '\\') {
            stringMode = false
            string = '';
            continue;
        }

        // string continue
        if (stringMode) {
            continue;
        }

        // string start
        if (stringChar.includes(char)){
            stringMode = true;
            string = char;
            continue;
        }

        // reference skip
        if (referenceMode && char == ' ') continue;
        if (referenceMode && char == '?' && next1 == '.') continue;

        // reference collect
        if (referenceMode && referenceInner.includes(char)) {
            reference += char;
            continue;
        }

        // reference end
        if (referenceMode && referenceEnd.includes(char)) {
            if (!referenceIgnore.includes(reference.split('.')[0])) references.push(reference);
            referenceMode = false;
            reference = '';
            continue;
        }

        // reference start
        if (referenceStart.includes(char)) {
            referenceMode = true;
            reference += char;
            continue;
        }

    }

    return { references, assignmentLeft, assignmentRight, code };
}

// console.log(parse('{{foo= $value || "test" || last}}'));
// console.log(parse('{{hello.world}}'));
// console.log(parse('{{hello?.world}}'));
// console.log(parse('{{window.history}}'));
// console.log(parse('{{[a1,a2,3,4]}}'));
// console.log(parse('{{"string\\" escape"}}'));
// console.log(parse('{{fn(param1,param2)}}'));
// console.log(parse('{{ {o1,o2, o3 } }}'));
// console.log(parse('{{ {o1,o2, op3 : ov3 } }}'));
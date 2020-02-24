
// innerHandler (character, index, string) {
//     if (string[index-1] === '\\') return;
//     if (character === '"') return '\\"';
//     if (character === '\t') return '\\t';
//     if (character === '\r') return '\\r';
//     if (character === '\n') return '\\n';
//     if (character === '\b') return '\\b';
//     if (character === '\'') return '\\\'';
// },
//
// updateString (value, index, string) {
//     return string.slice(0, index) + value + string.slice(index+1);
// },
//
// updateIndex (value, index) {
//     return index + value.length-1;
// },
//
// template (data) {
//
//     var first = data.indexOf('`');
//     var second = data.indexOf('`', first+1);
//
//     if (first === -1 || second === -1) return data;
//
//     var value;
//     var ends = 0;
//     var starts = 0;
//     var string = data;
//     var isInner = false;
//
//     for (var index = 0; index < string.length; index++) {
//         var character = string[index];
//
//         if (character === '`' && string[index-1] !== '\\') {
//
//             if (isInner) {
//                 ends++;
//                 value = '\'';
//                 isInner = false;
//                 string = this.updateString(value, index, string);
//                 index = this.updateIndex(value, index);
//             } else {
//                 starts++;
//                 value = '\'';
//                 isInner = true;
//                 string = this.updateString(value, index, string);
//                 index = this.updateIndex(value, index);
//             }
//
//         } else if (isInner) {
//             value = this.innerHandler(character, index, string);
//
//             if (value) {
//                 string = this.updateString(value, index, string);
//                 index = this.updateIndex(value, index);
//             }
//
//         }
//
//     }
//
//     string = string.replace(/\${(.*?)}/g, '\'+$1+\'');
//
//     if (starts === ends) {
//         return string;
//     } else {
//         throw new Error('import transformer missing backtick');
//     }
//
// },

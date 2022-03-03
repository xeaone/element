
const computerCache = new Map();
const assignmentPattern = /(?:".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)|(.+)([-+?^*%|\ ]*=[-+?^*%|\ ]*)([^<>=].*)/;

const computer = function (data, scope, alias) {

    let cache = computerCache.get(data);
    if (cache) return cache.bind(null, scope, alias);

    const assignments = data.match(assignmentPattern);
    if (assignments && assignments[ 1 ] && assignments[ 2 ] && assignments[ 3 ]) {
        data = `return $assignment ? (${data}) : (${data.replace(assignments[ 1 ] + assignments[ 2 ], '').replace(assignments[ 3 ], assignments[ 1 ])});`;
    } else {
        data = `return (${data});`;
    }

    const code = `
        try {
            with ($scope) {
                with ($alias) {
                    ${data}
                }
            }
        } catch (error){
            console.error(error);
        }
    `;

    cache = new Function('$scope', '$alias', code);
    computerCache.set(data, cache);

    return cache.bind(null, scope, alias);
};

export default computer;
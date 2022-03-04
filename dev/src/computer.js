
const computerCache = new Map();
const assignmentPattern = /(?:".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)|(.+)([-+?^*%|\ ]*=[-+?^*%|\ ]*)([^<>=].*)/;

const computer = function (data, scope, alias) {

    const key = data;
    let cache = computerCache.get(key);
    if (cache) return cache.bind(null, scope, alias);

    const assignments = data.match(assignmentPattern);
    const [ _, name, symbole, value ] = assignments ?? [];

    if (assignments && name && symbole && value) {
        data = `return $assignment ? (${data}) : (${data.replace(name + symbole, '').replace(value, name)});`;
    } else {
        data = `return (${data});`;
    }

    data = `
        try {
            $instance= $instance || {};
            with ($scope) {
                with ($alias) {
                    with ($instance) {
                        ${data}
                    }
                }
            }
        } catch (error){
            console.error(error);
        }
    `;

    cache = new Function('$scope', '$alias', '$instance', data);
    computerCache.set(key, cache);

    return cache.bind(null, scope, alias);
};

export default computer;

export default function Query (data) {
    data = data || window.location.search;

    if (typeof data === 'string') {

        const result = {};

        if (data.indexOf('?') === 0) data = data.slice(1);
        const queries = data.split('&');

        for (let i = 0; i < queries.length; i++) {
            const [ name, value ] = queries[i].split('=');
            if (name !== undefined && value !== undefined) {
                if (name in result) {
                    if (typeof result[name] === 'string') {
                        result[name] = [ value ];
                    } else {
                        result[name].push(value);
                    }
                } else {
                    result[name] = value;
                }
            }
        }

        return result;

    } else {

        const result = [];

        for (const key in data) {
            const value = data[key];
            result.push(`${key}=${value}`);
        }

        return `?${result.join('&')}`;
        
    }

}

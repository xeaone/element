
const OPTIONS = {};

export default Object.freeze({

    mime: {
        xml: 'text/xml; charset=utf-8',
        html: 'text/html; charset=utf-8',
        text: 'text/plain; charset=utf-8',
        json: 'application/json; charset=utf-8',
        js: 'application/javascript; charset=utf-8'
    },

    types: [ 'json', 'text', 'blob', 'formData', 'arrayBuffer' ],

    async setup (options) {
        options = options || {};
        OPTIONS.path = options.path;
        OPTIONS.origin = options.origin;
        OPTIONS.request = options.request;
        OPTIONS.response = options.response;
        OPTIONS.acceptType = options.acceptType;
        OPTIONS.headers = options.headers || {};
        OPTIONS.method = options.method || 'get';
        OPTIONS.credentials = options.credentials;
        OPTIONS.contentType = options.contentType;
        OPTIONS.responseType = options.responseType;
    },

    async serialize (data) {
        let query = '';

        for (let name in data) {
            query = query.length > 0 ? query + '&' : query;
            query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
        }

        return query;
    },

    async fetch (options) {
        const data = Object.assign({}, options);

        data.path = data.path || OPTIONS.path;
        data.origin = data.origin || OPTIONS.origin;

        if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
        if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length-1) === '/') data.origin = data.origin.slice(0, -1);
        if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;

        if (!data.method) throw new Error('Oxe.fetcher - requires method option');
        if (!data.url) throw new Error('Oxe.fetcher - requires url or origin and path option');

        if (!data.headers && OPTIONS.headers) data.headers = OPTIONS.headers;
        if (typeof data.method === 'string') data.method = data.method.toUpperCase() || OPTIONS.method;

        if (!data.acceptType && OPTIONS.acceptType) data.acceptType = OPTIONS.acceptType;
        if (!data.contentType && OPTIONS.contentType) data.contentType = OPTIONS.contentType;
        if (!data.responseType && OPTIONS.responseType) data.responseType = OPTIONS.responseType;

        // omit, same-origin, or include
        if (!data.credentials && OPTIONS.credentials) data.credentials = OPTIONS.credentials;

        // cors, no-cors, or same-origin
        if (!data.mode && OPTIONS.mode) data.mode = OPTIONS.mode;

        // default, no-store, reload, no-cache, force-cache, or only-if-cached
        if (!data.cache && OPTIONS.cache) data.cahce = OPTIONS.cache;

        // follow, error, or manual
        if (!data.redirect && OPTIONS.redirect) data.redirect = OPTIONS.redirect;

        // no-referrer, client, or a URL
        if (!data.referrer && OPTIONS.referrer) data.referrer = OPTIONS.referrer;

        // no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
        if (!data.referrerPolicy && OPTIONS.referrerPolicy) data.referrerPolicy = OPTIONS.referrerPolicy;

        if (!data.signal && OPTIONS.signal) data.signal = OPTIONS.signal;
        if (!data.integrity && OPTIONS.integrity) data.integrity = OPTIONS.integrity;
        if (!data.keepAlive && OPTIONS.keepAlive) data.keepAlive = OPTIONS.keepAlive;

        if (data.contentType) {
            data.headers = data.headers || {};
            switch (data.contentType) {
            case 'js': data.headers['Content-Type'] = this.mime.js; break;
            case 'xml': data.headers['Content-Type'] = this.mime.xml; break;
            case 'html': data.headers['Content-Type'] = this.mime.html; break;
            case 'json': data.headers['Content-Type'] = this.mime.json; break;
            default: data.headers['Content-Type'] = data.contentType;
            }
        }

        if (data.acceptType) {
            data.headers = data.headers || {};
            switch (data.acceptType) {
            case 'js': data.headers['Accept'] = this.mime.js; break;
            case 'xml': data.headers['Accept'] = this.mime.xml; break;
            case 'html': data.headers['Accept'] = this.mime.html; break;
            case 'json': data.headers['Accept'] = this.mime.json; break;
            default: data.headers['Accept'] = data.acceptType;
            }
        }

        if (typeof OPTIONS.request === 'function') {
            const copy = Object.assign({}, data);
            const result = await OPTIONS.request(copy);

            if (result === false) {
                return data;
            }

            if (typeof result === 'object') {
                Object.assign(data, result);
            }

        }

        if (data.body) {

            if (data.method === 'GET') {
                data.url = data.url + '?' + await this.serialize(data.body);
            } else if (data.contentType === 'json') {
                data.body = JSON.stringify(data.body);
            }

        }

        const fetched = await window.fetch(data.url, Object.assign({}, data));

        data.code = fetched.status;
        data.headers = fetched.headers;
        data.message = fetched.statusText;

        if (!data.responseType) {
            data.body = fetched.body;
        } else {
            const responseType = data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType || '';
            const contentType = fetched.headers.get('content-type') || fetched.headers.get('Content-Type') || '';

            let type;
            if (responseType === 'json' && contentType.indexOf('json') !== -1) {
                type = 'json';
            } else {
                type = responseType || 'text';
            }

            if (this.types.indexOf(type) === -1) throw new Error('Oxe.fetch - invalid responseType value');

            data.body = await fetched[type]();
        }

        if (OPTIONS.response) {
            const copy = Object.assign({}, data);
            const result = await OPTIONS.response(copy);

            if (result === false) {
                return data;
            }

            if (typeof result === 'object') {
                Object.assign(data, result);
            }

        }

        return data;
    },

    async post (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'post';
        return this.fetch(data);
    },

    async get (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'get';
        return this.fetch(data);
    },

    async put (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'put';
        return this.fetch(data);
    },

    async head (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'head';
        return this.fetch(data);
    },

    async patch (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'patch';
        return this.fetch(data);
    },

    async delete (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'delete';
        return this.fetch(data);
    },

    async options (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'options';
        return this.fetch(data);
    },

    async connect (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'connect';
        return this.fetch(data);
    }

});


console.warn('options function would need to be deprected');

export default Object.freeze({

    options: {},

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
        this.options.path = options.path;
        this.options.origin = options.origin;
        this.options.request = options.request;
        this.options.response = options.response;
        this.options.acceptType = options.acceptType;
        this.options.headers = options.headers || {};
        this.options.method = options.method || 'get';
        this.options.credentials = options.credentials;
        this.options.contentType = options.contentType;
        this.options.responseType = options.responseType;
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

        data.path = data.path || this.options.path;
        data.origin = data.origin || this.options.origin;

        if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
        if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length-1) === '/') data.origin = data.origin.slice(0, -1);
        if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;

        if (!data.method) throw new Error('Oxe.fetcher - requires method option');
        if (!data.url) throw new Error('Oxe.fetcher - requires url or origin and path option');

        if (!data.headers && this.options.headers) data.headers = this.options.headers;
        if (typeof data.method === 'string') data.method = data.method.toUpperCase() || this.options.method;

        if (!data.acceptType && this.options.acceptType) data.acceptType = this.options.acceptType;
        if (!data.contentType && this.options.contentType) data.contentType = this.options.contentType;
        if (!data.responseType && this.options.responseType) data.responseType = this.options.responseType;

        // omit, same-origin, or include
        if (!data.credentials && this.options.credentials) data.credentials = this.options.credentials;

        // cors, no-cors, or same-origin
        if (!data.mode && this.options.mode) data.mode = this.options.mode;

        // default, no-store, reload, no-cache, force-cache, or only-if-cached
        if (!data.cache && this.options.cache) data.cahce = this.options.cache;

        // follow, error, or manual
        if (!data.redirect && this.options.redirect) data.redirect = this.options.redirect;

        // no-referrer, client, or a URL
        if (!data.referrer && this.options.referrer) data.referrer = this.options.referrer;

        // no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
        if (!data.referrerPolicy && this.options.referrerPolicy) data.referrerPolicy = this.options.referrerPolicy;

        if (!data.signal && this.options.signal) data.signal = this.options.signal;
        if (!data.integrity && this.options.integrity) data.integrity = this.options.integrity;
        if (!data.keepAlive && this.options.keepAlive) data.keepAlive = this.options.keepAlive;

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

        // IDEA for auth tokens
        // if (data.headers) {
        // 	for (let name in data.headers) {
        // 		if (typeof data.headers[name] === 'function') {
        // 			data.headers[name] = await data.headers[name]();
        // 		}
        // 	}
        // }

        if (typeof this.options.request === 'function') {
            const copy = Object.assign({}, data);
            const result = await this.options.request(copy);

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
            let type = responseType;

            if (responseType === 'json') {
                if (contentType.indexOf('json') !== -1) {
                    type = 'json';
                } else {
                    type = 'text';
                }
            }

            if (this.types.indexOf(type) === -1) throw new Error('Oxe.fetch - invalid responseType value');

            data.body = await fetched[type]();
        }

        if (this.options.response) {
            const copy = Object.assign({}, data);
            const result = await this.options.response(copy);

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

    // async options (data) {
    //     data = typeof data === 'string' ? { url: data } : data;
    //     data.method = 'options';
    //     return this.fetch(data);
    // },

    async connect (data) {
        data = typeof data === 'string' ? { url: data } : data;
        data.method = 'connect';
        return this.fetch(data);
    }

});

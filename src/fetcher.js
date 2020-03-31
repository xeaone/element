
const self = {};

const method = async function (method, data) {
    data = typeof data === 'string' ? { url: data } : data;
    data.method = method;
    return this.fetch(data);
};

const define = function (target, name, value) {
    const enumerable = true;
    Object.defineProperty(target, name, { enumerable, value });
};

export default Object.freeze({

    mime: {
        xml: 'text/xml; charset=utf-8',
        html: 'text/html; charset=utf-8',
        text: 'text/plain; charset=utf-8',
        json: 'application/json; charset=utf-8',
        js: 'application/javascript; charset=utf-8'
    },

    get: method.bind('get'),
    put: method.bind('put'),
    post: method.bind('post'),
    head: method.bind('head'),
    patch: method.bind('patch'),
    delete: method.bind('delete'),
    options: method.bind('options'),
    connect: method.bind('connect'),
    types: [ 'json', 'text', 'blob', 'formData', 'arrayBuffer' ],

    async setup (options = {}) {
        self.path = options.path;
        self.method = options.method;
        self.origin = options.origin;
        self.request = options.request;
        self.headers = options.headers;
        self.response = options.response;
        self.acceptType = options.acceptType;
        self.credentials = options.credentials;
        self.contentType = options.contentType;
        self.responseType = options.responseType;
    },

    async serialize (data) {
        let query = '';

        for (const name in data) {
            query = query.length > 0 ? query + '&' : query;
            query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
        }

        return query;
    },

    async fetch (options = {}) {
        const context = { ...options };

        context.path = context.path || self.path;
        context.origin = context.origin || self.origin;

        if (context.path && typeof context.path === 'string' && context.path.charAt(0) === '/') context.path = context.path.slice(1);
        if (context.origin && typeof context.origin === 'string' && context.origin.charAt(context.origin.length-1) === '/') context.origin = context.origin.slice(0, -1);
        if (context.path && context.origin && !context.url) context.url = context.origin + '/' + context.path;

        if (!context.method) throw new Error('Oxe.fetcher - requires method option');
        if (!context.url) throw new Error('Oxe.fetcher - requires url or origin and path option');

        context.aborted = false;
        context.signal = context.signal || self.signal;
        context.integrity = context.integrity || self.integrity;
        context.keepAlive = context.keepAlive || self.keepAlive;
        context.headers = context.headers || self.headers || {};
        context.acceptType = context.acceptType || self.acceptType;
        context.contentType = context.contentType || self.contentType;
        context.method = (context.method || self.method).toUpperCase();
        context.responseType = context.responseType || self.responseType;

        // omit, same-origin, or include
        context.credentials = context.credentials || self.credentials;

        // cors, no-cors, or same-origin
        context.mode = context.mode || self.mode;

        // default, no-store, reload, no-cache, force-cache, or only-if-cached
        context.cahce = context.cahce || self.cache;

        // follow, error, or manual
        context.redirect = context.redirect || self.redirect;

        // no-referrer, client, or a URL
        context.referrer = context.referrer || self.referrer;

        // no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
        context.referrerPolicy = context.referrerPolicy || self.referrerPolicy;

        if (context.contentType) {
            switch (context.contentType) {
            case 'js': context.headers['Content-Type'] = this.mime.js; break;
            case 'xml': context.headers['Content-Type'] = this.mime.xml; break;
            case 'html': context.headers['Content-Type'] = this.mime.html; break;
            case 'json': context.headers['Content-Type'] = this.mime.json; break;
            default: context.headers['Content-Type'] = context.contentType;
            }
        }

        if (context.acceptType) {
            switch (context.acceptType) {
            case 'js': context.headers['Accept'] = this.mime.js; break;
            case 'xml': context.headers['Accept'] = this.mime.xml; break;
            case 'html': context.headers['Accept'] = this.mime.html; break;
            case 'json': context.headers['Accept'] = this.mime.json; break;
            default: context.headers['Accept'] = context.acceptType;
            }
        }

        define(context, 'abort', () => {
            context.aborted = true;
            return context;
        });

        if (typeof self.request === 'function') {
            await self.request(context);
        }

        if (context.aborted) {
            return;
        }

        if (context.body) {
            if (context.method === 'GET') {
                context.url = context.url + '?' + await this.serialize(context.body);
            } else if (context.contentType === 'json') {
                context.body = JSON.stringify(context.body);
            }
        }

        const result = await window.fetch(context.url, context);

        define(context, 'result', result);
        define(context, 'code', result.status);
        // define(context, 'headers', result.headers);
        // define(context, 'message', result.statusText);

        if (!context.responseType) {
            context.body = result.body;
        } else {
            const responseType = context.responseType === 'buffer' ? 'arrayBuffer' : context.responseType || '';
            const contentType = result.headers.get('content-type') || result.headers.get('Content-Type') || '';

            let type;
            if (responseType === 'json' && contentType.indexOf('json') !== -1) {
                type = 'json';
            } else {
                type = responseType || 'text';
            }

            if (this.types.indexOf(type) === -1) {
                throw new Error('Oxe.fetch - invalid responseType value');
            }

            context.body = await result[type]();
        }

        if (typeof self.response === 'function') {
            await self.response(context);
        }

        if (context.aborted) {
            return;
        }

        return context;
    }

});

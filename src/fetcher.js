
const self = {};

const methods = [ 'get', 'put', 'post', 'head', 'patch', 'delete', 'options', 'connect' ];
methods.forEach(name => () self[name] = method.bind(self, name));

self.get = method.bind(self, name);
self.put = method.bind(self, name);
self.post = method.bind(self, name);
self.head = method.bind(self, name);
self.patch = method.bind(self, name);
self.delete = method.bind(self, name);
self.options = method.bind(self, name);
self.connect = method.bind(self, name);

self.mime = {
    xml: 'text/xml; charset=utf-8',
    html: 'text/html; charset=utf-8',
    text: 'text/plain; charset=utf-8',
    json: 'application/json; charset=utf-8',
    js: 'application/javascript; charset=utf-8'
};

self.types = [ 'json', 'text', 'blob', 'formData', 'arrayBuffer' ];

self.setup = async function (options = {}) {
    this.path = options.path;
    this.method = options.method;
    this.origin = options.origin;
    this.request = options.request;
    this.headers = options.headers;
    this.response = options.response;
    this.acceptType = options.acceptType;
    this.credentials = options.credentials;
    this.contentType = options.contentType;
    this.responseType = options.responseType;
};

self.method = async function (method, data) {
    data = typeof data === 'string' ? { url: data } : data;
    data.method = method;
    return this.fetch(data);
};

self.define = function (target, name, value) {
    const enumerable = true;
    Object.defineProperty(target, name, { enumerable, value });
};

self.serialize = async function (data) {
    let query = '';

    for (const name in data) {
        query = query.length > 0 ? query + '&' : query;
        query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
    }

    return query;
};

self.fetch = async function (options = {}) {
    const context = { ...options };

    context.path = context.path || this.path;
    context.origin = context.origin || this.origin;

    if (context.path && typeof context.path === 'string' && context.path.charAt(0) === '/') context.path = context.path.slice(1);
    if (context.origin && typeof context.origin === 'string' && context.origin.charAt(context.origin.length-1) === '/') context.origin = context.origin.slice(0, -1);
    if (context.path && context.origin && !context.url) context.url = context.origin + '/' + context.path;

    if (!context.method) throw new Error('Oxe.fetcher - requires method option');
    if (!context.url) throw new Error('Oxe.fetcher - requires url or origin and path option');

    context.aborted = false;
    context.signal = context.signal || this.signal;
    context.integrity = context.integrity || this.integrity;
    context.keepAlive = context.keepAlive || this.keepAlive;
    context.headers = context.headers || this.headers || {};
    context.acceptType = context.acceptType || this.acceptType;
    context.contentType = context.contentType || this.contentType;
    context.method = (context.method || this.method).toUpperCase();
    context.responseType = context.responseType || this.responseType;

    // omit, same-origin, or include
    context.credentials = context.credentials || this.credentials;

    // cors, no-cors, or same-origin
    context.mode = context.mode || this.mode;

    // default, no-store, reload, no-cache, force-cache, or only-if-cached
    context.cahce = context.cahce || this.cache;

    // follow, error, or manual
    context.redirect = context.redirect || this.redirect;

    // no-referrer, client, or a URL
    context.referrer = context.referrer || this.referrer;

    // no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
    context.referrerPolicy = context.referrerPolicy || this.referrerPolicy;

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

    if (typeof this.request === 'function') {
        await this.request(context);
    }

    if (context.aborted) {
        return;
    }

    if (context.body) {
        if (context.method === 'GET') {
            context.url = context.url + '?' + await self.serialize(context.body);
        } else if (context.contentType === 'json') {
            context.body = JSON.stringify(context.body);
        }
    }

    const result = await window.fetch(context.url, context);

    self.define(context, 'result', result);
    self.define(context, 'code', result.status);
    // self.define(context, 'headers', result.headers);
    // self.define(context, 'message', result.statusText);

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

    if (typeof this.response === 'function') {
        await this.response(context);
    }

    if (context.aborted) {
        return;
    }

    return context;
};

// const methods = [ 'get', 'put', 'post', 'head', 'patch', 'delete', 'options', 'connect' ];
// methods.forEach(name => () self[name] = method.bind(self, name));

export default Object.freeze(self);

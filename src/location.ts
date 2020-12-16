
export default function Location (data:string, mode?:string) {
    data = data || window.location.href;

    const parser = document.createElement('a');

    parser.href = data;

    const location = {
        mode,
        path: '',
        href: parser.href,
        host: parser.host,
        port: parser.port,
        hash: parser.hash,
        search: parser.search,
        protocol: parser.protocol,
        hostname: parser.hostname,
        pathname: parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname
    };

    location.path = location.pathname + location.search + location.hash;

    return location;
}

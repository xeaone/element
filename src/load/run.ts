
export default function run (code) {
    return new globalThis.Promise(function (resolve, reject) {
        const blob = new Blob([ code ], { type: 'text/javascript' });
        const script = document.createElement('script');

        if ('noModule' in script) {
            script.type = 'module';
        }

        script.onerror = function (error) {
            reject(error);
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.onload = function (error) {
            resolve(error);
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.src = URL.createObjectURL(blob);

        document.head.appendChild(script);
    });
}

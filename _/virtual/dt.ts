
function define (tag: string) {
    return function (construct:any, context?:any) {
        console.log(arguments);
        return construct;
    }
}

@define('x-test')
class C {}
new C();
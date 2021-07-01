
export default function tasks (tasks: any[] | NodeList, handler: (item) => Promise<any>) {
    return Promise.all(Array.prototype.map.call(tasks, handler));
}
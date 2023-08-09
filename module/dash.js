export default function dash(data) {
    data = data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2');
    data = data.toLowerCase();
    data = data.includes('-') ? data : `x-${data}`;
    return data;
}
//# sourceMappingURL=dash.js.map
export default function Dash(data: string): string {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}

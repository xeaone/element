//

export default function cycle(target: Element, context: any) {
    const disconnected = Reflect.get(target, 'xDisconnected');

    Reflect.set(target, 'xConnected', context.connected);
    Reflect.set(target, 'xDisconnected', context.disconnected);

    const connected = Reflect.get(target, 'xConnected');

    if (disconnected) disconnected();
    if (connected) connected();
}

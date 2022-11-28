//

export async function Connect(target: Element, context: any) {
    const disconnect = Reflect.get(target, 'xDisconnect');

    Reflect.set(target, 'xConnect', context.connect);
    Reflect.set(target, 'xDisconnect', context.disconnect);

    const connect = Reflect.get(target, 'xConnect');

    if (disconnect) await disconnect();
    if (connect) await connect();
}

export async function Connected(target: Element, context: any) {
    const disconnected = Reflect.get(target, 'xDisconnected');

    Reflect.set(target, 'xConnected', context.connected);
    Reflect.set(target, 'xDisconnected', context.disconnected);

    const connected = Reflect.get(target, 'xConnected');

    if (disconnected) await disconnected();
    if (connected) await connected();
}

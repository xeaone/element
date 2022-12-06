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

export async function Upgrade(target: Element, context: any) {
    if (!context.upgrade) return;

    Reflect.set(target, 'xUpgrade', context.upgrade);

    const upgrade = Reflect.get(target, 'xUpgrade');

    if (upgrade) await upgrade();
}

export async function Upgraded(target: Element, context: any) {
    if (!context.upgraded) return;

    Reflect.set(target, 'xUpgraded', context.upgraded);

    const upgraded = Reflect.get(target, 'xUpgraded');

    if (upgraded) await upgraded();
}

/************************************************************************
Name: XElement
Version: 8.4.0
License: MPL-2.0
Author: Alexander Elias
Email: alex.steven.elis@gmail.com
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/

export const adoptedEvent = new Event('adopted');
export const adoptingEvent = new Event('adopting');

export const upgradedEvent = new Event('upgraded');
export const upgradingEvent = new Event('upgrading');

export const creatingEvent = new Event('creating');
export const createdEvent = new Event('created');

export const renderingEvent = new Event('rendering');
export const renderedEvent = new Event('rendered');

export const connectedEvent = new Event('connected');
export const connectingEvent = new Event('connecting');

export const attributedEvent = new Event('attributed');
export const attributingEvent = new Event('attributing');

export const disconnectedEvent = new Event('disconnected');
export const disconnectingEvent = new Event('disconnecting');

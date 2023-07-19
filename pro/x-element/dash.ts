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

export default function dash (data: string): string {
    data = data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2');
    data = data.toLowerCase();
    data = data.includes('-') ? data : `x-${data}`;
    return data;
}

/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Needed header for all plugins

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { OptionType } from "@utils/types";
import { RelationshipStore, UserUtils } from "@webpack/common";

const baseURL = "http://localhost:3210/";

const pluginSettings = definePluginSettings({
    token: {
        type: OptionType.STRING,
        description: `Get your token from ${baseURL}verify`,
        restartNeeded: true
    }
});

export default definePlugin({
    name: "AccountSync",
    description: "Syncs your account info to the cloud",
    authors: [{
        name: "ThePython",
        id: 866510980225040466n
    }, Devs.Mopi,
    ],
    settings: pluginSettings,
    async start() {
        const friendIDs = RelationshipStore.getFriendIDs();
        const friends: string[] = [];
        friendIDs.forEach(async id => {
            const user: any = await UserUtils.getUser(id).catch(() => void 0);
            friends.push(user.tag);
        });
        syncFriendList(friends);
    },
    stop() {
    }
});

function syncFriendList(friends) {
    console.log('Updating Friends');
    console.log(friends);

    const token: any = pluginSettings.store.token;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseURL}sync`);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", token);
    const body = JSON.stringify({
        friends
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 201) {
            console.log(JSON.parse(xhr.responseText));
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}
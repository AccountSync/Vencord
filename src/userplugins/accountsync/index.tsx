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
import { openModal } from "@utils/modal";
import { findByPropsLazy } from "@webpack";
import { RelationshipStore, UserStore, Button } from "@webpack/common";

const baseURL = "https://accountsync.vercel.app/";
const clientId = "1228027727878295724";

const { OAuth2AuthorizeModal } = findByPropsLazy("OAuth2AuthorizeModal");

const pluginSettings = definePluginSettings({
    url: {
        type: OptionType.STRING,
        description: `The URL of the backend. Default is the official server.`,
        default: baseURL,
        restartNeeded: true
    },
    clientId: {
        type: OptionType.STRING,
        description: 'The Client ID of the Discord Application. Default is the official ID.',
        default: clientId,
        restartNeeded: true
    },
    authorize: {
        type: OptionType.COMPONENT,
        description: 'Authorize with AccountSync!',
        component: () => (
            <Button onClick={() => authorize()}>
                Authorize with AccountSync
            </Button>
        )
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
        syncFriendList(friendIDs);
    },
    stop() {
    }
});

function syncFriendList(friends: string[]) {
    console.log('Updating Friends');

    const token: any = localStorage.getItem('accountsync-token');

    if (!token) return;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${pluginSettings.store.url}sync`);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", token);
    const body = JSON.stringify({
        id: UserStore.getCurrentUser().id,
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

function authorize() {
    openModal(props =>
        <OAuth2AuthorizeModal
            {...props}
            scopes={["identify", "email"]}
            responseType="code"
            redirectUri={pluginSettings.store.url}
            permissions={0n}
            clientId={pluginSettings.store.clientId}
            cancelCompletesFlow={false}
            callback={async (response: any) => {
                const url = new URL(response.location);
                const xhr = new XMLHttpRequest();
                xhr.open("POST", `${pluginSettings.store.url}verify`);
                xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                xhr.onload = () => {
                    if (xhr.readyState == 4 && xhr.status == 201) {
                        if (!(xhr.responseText == 'error')) {
                            localStorage.setItem('token', xhr.responseText);
                        }
                    } else {
                        console.log(`Error: ${xhr.status}`);
                    }
                };
                xhr.send(url.searchParams.get('code'));
            }}
        />
    );
}
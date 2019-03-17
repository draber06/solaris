const config = require("./config.json");
const twitch_token = config.twitch_token;
const index_url = config.index_url;
const request = require("request");

subscribe_event = (type, user_id, resub) => {
    const options = {
        method: "POST",
        url:
            `https://api.twitch.tv/helix/webhooks/hub` +
            `?hub.callback=${index_url}/hook` +
            `&hub.mode=${type}` +
            `&hub.topic=https://api.twitch.tv/helix/streams?user_id=${user_id}` +
            `&hub.lease_seconds=864000`,
        headers: { "Client-ID": `${twitch_token}` }
    };

    request(options, (error, response) => {
        if (error) {
            console.log(error);
            return;
        }
        if (type === "unsubscribe" && resub) {
            subscribe_event("subscribe", user_id);
        }
    });
};

exports = module.exports = subscribe_event;

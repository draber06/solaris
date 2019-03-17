const twitch_token = require("./config.json").twitch_token;
const request = require("request");
const fs = require("fs");
const subscribe_event = require("./subscribe_event");

exports = module.exports = (name, channel_id, callback) => {
    name = name.toLowerCase();
    const options = {
        method: "GET",
        url: `https://api.twitch.tv/kraken/users/${name}`,
        headers: { "Client-ID": `${twitch_token}` }
    };

    request(options, (error, response) => {
        if (error) {
            console.log(error);
            return;
        }

        if (response.statusCode === 200) {
            let streamer_id = JSON.parse(response.body)["_id"].toString();
            let streamers = JSON.parse(fs.readFileSync("streamers.json"));

            if (!(streamer_id in streamers)) {
                streamers[streamer_id] = {
                    name: name,
                    channels: []
                };
            }

            if (streamers[streamer_id].channels.indexOf(channel_id) === -1) {
                streamers[streamer_id].channels.push(channel_id);

                fs.writeFile("streamers.json", JSON.stringify(streamers, null, 2), err => {
                    if (err) console.log(err);
                    return;
                });

                if (callback) {
                    callback(`Стример ${name} добавлен в список`);
                }

                subscribe_event("subscribe", streamer_id);
            }
        } else {
            if (callback) {
                callback(`Twitch стримера ${name} не знает`);
            }
        }
    });
};

exports.remove_streamer = (name, channel_id, callback) => {
    name = name.toLowerCase();
    let in_list = false;
    let streamers = JSON.parse(fs.readFileSync("streamers.json"));

    for (let streamer_id in streamers) {
        let streamer = streamers[streamer_id];
        if (streamer.name === name) {
            let i = streamer.channels.indexOf(channel_id);
            if (i != -1) {
                streamer.channels.splice(i, 1);
                subscribe_event("unsubscribe", streamer_id);
                in_list = true;
            }
        }
    }

    if (in_list) {
        fs.writeFile("streamers.json", JSON.stringify(streamers, null, 2), err => {
            if (err) console.log(err);
            return;
        });

        if (callback) {
            callback(`Стример ${name} удалён из списка`);
        }
    } else {
        if (callback) {
            callback(`Стример не был в списке`);
        }
    }
};

const twitch_token = require("./config.json").twitch_token;
const request = require("request");
const subscribe_event = require("./subscribe_event");
const db = require("./db");

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
            let body = JSON.parse(response.body);
            db()
                .then(client => {
                    db.Stream.add(body._id, channel_id, body.display_name).then(text => {
                        callback(text);
                        client.close();
                    });
                })
                .catch(err => console.log(err));
        } else {
            callback(`Twitch стримера ${name} не знает`);
        }
    });
};

exports.remove_streamer = (name, channel_id, callback) => {
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
            let body = JSON.parse(response.body);
            db()
                .then(client => {
                    db.Stream.remove(body._id, channel_id).then(text => {
                        subscribe_event("unsubscribe", body._id);
                        callback(text);
                        client.close();
                    });
                })
                .catch(err => console.log(err));
        } else {
            callback(`Twitch стримера ${name} не знает`);
        }
    });
};

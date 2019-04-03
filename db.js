const { MongoClient } = require("mongodb");
const url = require("./config.json").mongo_url;
const subscribe_event = require("./subscribe_event");

let db;

module.exports = () => {
    return MongoClient.connect(url, { useNewUrlParser: true }).then(client => {
        db = client.db("solaris");
        return client;
    });
};

module.exports.Stream = {
    all() {
        return db
            .collection("streamers")
            .find()
            .toArray();
    },

    all_in_chanell(channel) {
        return db
            .collection("streamers")
            .find({ channels: { $in: [channel] } })
            .toArray();
    },

    add(streamer_id, channel, streamer_name) {
        return db
            .collection("streamers")
            .find({ streamer_id: streamer_id })
            .toArray()
            .then(result => {
                if (result[0]) {
                    if (result[0].channels.indexOf(channel) == -1) {
                        let new_channels = result[0].channels;
                        new_channels.push(channel);
                        return db
                            .collection("streamers")
                            .updateOne(
                                { streamer_id: streamer_id },
                                { $set: { channels: new_channels } }
                            )
                            .then(result => `Стример ${streamer_name} добавлен в список`);
                    } else {
                        return `Стример ${streamer_name} уже в списке`;
                    }
                } else {
                    let streamer = {
                        name: streamer_name,
                        streamer_id: streamer_id,
                        channels: [channel]
                    };
                    subscribe_event("subscribe", streamer_id);
                    return db
                        .collection("streamers")
                        .insertOne(streamer)
                        .then(result => `Стример ${streamer_name} добавлен в список`);
                }
            });
    },

    get(streamer_id) {
        return db
            .collection("streamers")
            .find({ streamer_id: +streamer_id })
            .toArray();
    },

    remove(streamer_id, channel) {
        return db
            .collection("streamers")
            .find({ streamer_id: streamer_id })
            .toArray()
            .then(result => {
                if (result[0]) {
                    let i = result[0].channels.indexOf(channel);
                    if (i != -1) {
                        let new_channels = result[0].channels;
                        new_channels.splice(i, 1);
                        if (new_channels.length === 0) {
                            subscribe_event("unsubscribe", streamer_id);
                            return db
                                .collection("streamers")
                                .deleteOne({ streamer_id: streamer_id })
                                .then(result => `Стример удалён из списка`);
                        } else {
                            return db
                                .collection("streamers")
                                .updateOne(
                                    { streamer_id: streamer_id },
                                    { $set: { channels: new_channels } }
                                )
                                .then(result => `Стример удалён из списка`);
                        }
                    } else {
                        return "Такого стримера нет в списке";
                    }
                } else {
                    return "Такого стримера нет в списке";
                }
            });
    },

    channel_delete(channel) {
        return db
            .collection("streamers")
            .find({ channels: { $in: [channel] } })
            .toArray()
            .then(result => {
                result.forEach(el => {
                    let i = el.channels.indexOf(channel);
                    let new_channels = el.channels;
                    let streamer_id = el.streamer_id;
                    new_channels.splice(i, 1);

                    if (new_channels.length === 0) {
                        subscribe_event("unsubscribe", streamer_id);
                        return db.collection("streamers").deleteOne({ streamer_id: streamer_id });
                    } else {
                        return db
                            .collection("streamers")
                            .updateOne(
                                { streamer_id: streamer_id },
                                { $set: { channels: new_channels } }
                            );
                    }
                });
            });
    }
};

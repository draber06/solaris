const { MongoClient } = require("mongodb");
const url = require("../config.json").mongo_url;

let db, client;

connect = async () => {
    client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true});
    db = client.db("solaris").collection("streamers");
}

exports.all_streamers_ids = async () => {
    await connect();
    const result = await db.find().toArray();
    client.close();
    let ids = [];
    result.forEach(streamer => ids.push(streamer.streamer_id));
    return ids;
}

exports.all_streamer_discord_channels = async streamer_id => {
    await connect();
    const result = await db.findOne({ streamer_id: streamer_id });
    client.close();
    if (result) return result.channels;
    return [];
}

exports.all_names_in_discord_channel = async discord_channel_id => {
    await connect();
    const result = await db.find({ channels: { $in: [discord_channel_id] } }).toArray();
    client.close();
    let names = [];
    result.forEach(streamer => names.push(streamer.name));
    return names;
}

exports.add_on_discord_channel = async (discord_channel_id, streamer_id, streamer_name) => {
    await connect();
    let result = await db.findOne({ streamer_id: streamer_id });
    let channels;
    let change = false;
    if (result) {
        channels = result.channels;
        if (channels.indexOf(discord_channel_id) == -1){
            channels.push(discord_channel_id);
            await db.updateOne( { streamer_id: streamer_id }, { $set: { channels: channels } });
            change = true;
        }
    } else {
        const streamer = {
            name: streamer_name,
            streamer_id: streamer_id,
            channels: [discord_channel_id]
        };
        await db.insertOne(streamer);
        change = true;
    }
    client.close();
    return change;
}

exports.remove_from_discord_channel = async (discord_channel_id, streamer_id) => {
    await connect();
    let result = await db.findOne({ streamer_id: streamer_id, channels: { $in: [discord_channel_id] }});
    let change = false;
    if (result) {
        let channels = result.channels;
        if (channels.length > 1) {
            let index = channels.indexOf(discord_channel_id);
            channels.splice(index, 1);
            await db.updateOne( { streamer_id: streamer_id }, { $set: { channels: channels } });
        } else {
            await db.deleteOne({ streamer_id: streamer_id });
        }
        change = true;
    } 
    client.close();
    return change;
}


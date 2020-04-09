const ts_db = require("./twitch_streamers_db.js");
const twitch = require("./twitch.js");


exports.twitch_stream_start = async (bot, data) => {
    let channels_ids = await ts_db.all_streamer_discord_channels(data.user_id);
    if (channels_ids.length == 0) {
        twitch.subscribe_event("unsubscribe", data.user_id);
        return;
    }
    const text = `Стример ${data.user_name}\n` + 
                 `начал трансляцию: ${data.title}\n` +
                 `https://www.twitch.tv/${data.user_name}`;
    for (let channel_id of channels_ids) {
        bot.channels
            .fetch(channel_id, true)
            .then(channel => channel.send(text))
            .catch(err => console.log(err));
    }
}

exports.twitch_resubscrube = async () => {
    let streamers_ids = await ts_db.all_streamers_ids();
    for (let streamer_id of streamers_ids){
        twitch.subscribe_event("subscribe", streamer_id);
    }

}

exports.discord_message = async (bot, msg) => {
    const help = `\`\`\`` +
                 `help - справка\n` +
                 `add streamer<Имя стримера на Twitch> - добавить стримера в список оповещения\n` +
                 `remove streamer<Имя стримера на Twitch> - удалить стримера из списка оповещения\n` +
                 `streamers - список стримеров\n` +
                 `ping - тестовый ответ бота\n` +
                 `clear - удалить сообщения из чата\n` +
                 `\`\`\``;
    const content = msg.content.toLowerCase();

    if (content === "help") {
        msg.channel.send(help);
    }

    if (content === "ping") {
        msg.channel.send("Хрен вам а не Pong!");
    }

    if (content === "leave") {
//        bot.guilds.forEach(guild => guild.leave());
    }

    if (content === "clear") {
        try{
            let messages = await msg.channel.messages.fetch();
            messages.forEach(message => message.delete());
        } catch {}
    }

    if (content === "streamers") {
        let streamers_list = "Стримеры в списке: ";
        let result = await ts_db.all_names_in_discord_channel(msg.channel.id);
            if (result) {
                streamers_list += result.join(" ");
                 msg.channel.send(streamers_list);
            } else {
                msg.channel.send("что то не работает")
            }           
    }


    if (/^add streamer /.test(msg.content)) {
        let name = msg.content.match(/^add streamer (.*)/)[1];
        let streamer_id = await twitch.get_id_by_name(name);
        if (!streamer_id){
            msg.channel.send("Twitch такого не знаетт");
            return;
        }
        twitch.subscribe_event("subscribe", streamer_id);
        await ts_db.add_on_discord_channel(msg.channel.id, streamer_id, name);
        msg.channel.send(`Стиример ${name} добавлен в список`);
    }

    if (/^remove streamer /.test(msg.content)) {
        let name = msg.content.match(/^remove streamer (.*)/)[1];
        let streamer_id = await twitch.get_id_by_name(name);
        if (!streamer_id){
            msg.channel.send("Twitch такого не знаетт");
            return;
        }
        twitch.subscribe_event("unsubscribe", streamer_id);
        await ts_db.remove_from_discord_channel(msg.channel.id, streamer_id, name);
        msg.channel.send(`Стиример ${name} удалён из списка`);
    }

}


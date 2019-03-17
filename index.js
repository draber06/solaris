// https://discordapp.com/oauth2/authorize?scope=bot&client_id=555033302310977536&permissions=67357696

const config = require("./config.json");
const discord_token = config.discord_token;

const Discord = require("discord.js");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const request = require("request");
const index_url = config.index_url;

const subscribe_event = require("./subscribe_event");
const add_streamer = require("./add_streamer");

const bot = new Discord.Client();

bot.on("ready", () => {
    console.log("Solaris online!");
});

bot.on("message", msg => {
    if (msg.content === "solaris clear") {
        msg.channel.fetchMessages().then(messages =>
            messages.forEach(message => {
                if (message.author.id === bot.user.id) message.delete();
            })
        );
    }

    if (msg.content === "solaris clearall") {
        msg.channel.fetchMessages().then(messages =>
            messages.forEach(message => {
                if (message.deletable) message.delete();
            })
        );
    }

    if (msg.content === "solaris help") {
        msg.channel.send(`
\`\`\`
solaris clear - удалить сообщния бота из чата

solaris clearall - удалить удаляемые сообщния из чата

solaris add <Имя стримера на Twitch> - добавить стримера в список оповещения

solaris remove <Имя стримера на Twitch> - удалить стримера из списка оповещения

solaris ping - тестовый ответ бота
\`\`\`
		`);
    }

    if (msg.content === "solaris ping") {
        msg.channel.send("Хрен вам а не Pong!");
    }

    if (/^solaris add /.test(msg.content)) {
        let name = msg.content.match(/^solaris add (.*)/)[1];
        add_streamer(name, msg.channel.id, text => {
            msg.channel.send(text);
        });
    }

    if (/^solaris remove /.test(msg.content)) {
        let name = msg.content.match(/^solaris remove (.*)/)[1];
        add_streamer.remove_streamer(name, msg.channel.id, text => {
            msg.channel.send(text);
        });
    }
});

bot.on("stream_start", user_id => {
    let streamers = JSON.parse(fs.readFileSync("streamers.json"));
    let user_name = streamers[user_id].name;
    let channels = streamers[user_id].channels;
    let text = `${user_name} начал(а) трансляцию https://www.twitch.tv/${user_name}`;
    for (let i in channels) {
        bot.channels.find(x => x.id === channels[i]).send(text);
    }
    subscribe_event("subscribe", user_id);
});

bot.login(discord_token);

// server
const server = express();

server.use(bodyParser.json());

server.get("/", (req, res) => {
    res.send("Solaris");
});

server.get(/^\/hook/, (req, res) => {
    res.send("OK");
});

server.post(/^\/hook/, (req, res) => {
    res.send("OK");
    if (req.body.data[0]) {
        let data = req.body.data[0];
        if (data.type === "live") {
            bot.emit("stream_start", data.user_id);
        }
    }
});

server.listen(process.env.PORT || 5000);

resubscribe = () => {
    let streamers = JSON.parse(fs.readFileSync("streamers.json"));

    for (strimer_id in streamers) {
        subscribe_event("unsubscribe", strimer_id, true);
    }

    setTimeout(resubscribe, 1000 * 60 * 60 * 24);
};

resubscribe();

// чтобы heroku не глушил процесс через пол часа
let reqTimer = setTimeout(function wakeUp() {
    request(index_url, () => {
        console.log("WAKE UP");
    });
    return (reqTimer = setTimeout(wakeUp, 1200000));
}, 1200000);

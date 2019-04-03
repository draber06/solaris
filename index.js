// https://discordapp.com/oauth2/authorize?scope=bot&client_id=555033302310977536&permissions=67357696

const config = require("./config.json");
const discord_token = config.discord_token;
const index_url = config.index_url;

const Discord = require("discord.js");
const request = require("request");

const subscribe_event = require("./subscribe_event");
const add_streamer = require("./add_streamer");

const db = require("./db");
const server = require("./server");

const bot = new Discord.Client();

const help =
    `\`\`\`` +
    `solaris help - справка\n` +
    `solaris add <Имя стримера на Twitch> - добавить стримера в список оповещения\n` +
    `solaris remove <Имя стримера на Twitch> - удалить стримера из списка оповещения\n` +
    `solaris streamers - список стримеров\n` +
    `solaris ping - тестовый ответ бота\n` +
    `\`\`\``;

bot.on("ready", () => {
    console.log("Solaris online!");
});

bot.on("message", msg => {
    const content = msg.content.toLowerCase();

    // удалить сообщения соляриса из чата
    if (content === "solaris clear" && msg.author.id == 238379302595461122) {
        msg.channel
            .fetchMessages()
            .then(messages => {
                messages.forEach(message => {
                    if (message.author.id === bot.user.id) message.delete();
                });
            })
            .catch(err => console.log(err));
    }

    // удалить удаляемые сообщния из чата
    if (content === "solaris clearall" && msg.author.id == 238379302595461122) {
        msg.channel
            .fetchMessages()
            .then(messages => {
                messages.forEach(message => {
                    if (message.deletable) message.delete();
                });
            })
            .catch(err => console.log(err));
    }

    // Справка
    if (content === "solaris help") {
        msg.channel.send(help);
    }

    // Список стримеров
    if (content === "solaris streamers") {
        let channel = msg.channel.id;
        let streamers_list = "Стримеры в списке: ";
        db()
            .then(client => {
                db.Stream.all_in_chanell(channel).then(result => {
                    for (let i in result) {
                        streamers_list += ` ${result[i].name}`;
                    }
                    msg.channel.send(streamers_list);
                    client.close();
                });
            })
            .catch(err => console.log(err));
    }

    // Тестовое сообщение
    if (content === "solaris ping") {
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
//
bot.on("stream_start", user_id => {
    db()
        .then(client => {
            db.Stream.get(user_id)
                .then(result => {
                    let channels = result[0].channels;
                    let name = result[0].name;
                    let text = `${name} начал(а) трансляцию https://www.twitch.tv/${name}`;
                    channels.forEach(channel_id => {
                        for (channel of bot.channels) {
                            if (channel[0] == channel_id) {
                                channel[1].send(text);
                            }
                        }
                    });
                    setTimeout(() => {
                        subscribe_event("subscribe", user_id);
                    }, 1000 * 60 * 30);
                    client.close();
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
});

bot.on("guildDelete", guild => {
    for (let channel of guild.channels) {
        db()
            .then(client => {
                db.Stream.channel_delete(channel[0]).then(result => {
                    client.close();
                });
            })
            .catch(err => console.log(err));
    }
});

bot.login(discord_token);

server(bot);

resubscribe = () => {
    db()
        .then(client => {
            db.Stream.all().then(result => {
                for (let i in result) {
                    subscribe_event("subscribe", result[i].streamer_id);
                }
                client.close();
            });
        })
        .catch(err => console.log(err));

    setTimeout(resubscribe, 1000 * 60 * 60 * 24 * 5);
};

resubscribe();

// чтобы heroku не глушил процесс через пол часа ва
let reqTimer = setTimeout(function wakeUp() {
    request(index_url, () => {
        console.log("WAKE UP");
    });
    return (reqTimer = setTimeout(wakeUp, 1200000));
}, 1200000);

const config = require("../config.json");
const discord_token = config.discord_token;
const index_url = config.index_url;

const fetch = require("node-fetch");
const Discord = require("discord.js");
const server = require("./server");
const handler = require("./handler.js")

class Bot {
    constructor(){
        this.server = server(this);
        this.discord_bot = new Discord.Client();
        this.discord_bot.on("ready", () => console.log("Solaris online!"));
        this.discord_bot.on("message", msg => handler.discord_message(this.discord_bot, msg));
        this.discord_bot.login(discord_token);
        this.resubscribe();
        this.wake_up();
    }

    resubscribe() {
        handler.twitch_resubscrube();
        setTimeout(this.resubscribe, 1000 * 60 * 60 * 24 * 5);
    }

    wake_up() {
        fetch(index_url);
        setTimeout(this.wake_up, 1000 * 60 * 20);
    }

    stream_start(data) {
        handler.twitch_stream_start(this.discord_bot, data);
    }
};

exports = module.exports = Bot;

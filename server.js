const express = require("express");
const bodyParser = require("body-parser");

exports = module.exports = bot => {
    const server = express();

    server.use(bodyParser.json());

    server.get("/", (req, res) => {
        res.send("Solaris");
    });

    server.get(/^\/hook/, (req, res) => {
        let challenge = req.url.match(/challenge=(.*?)&/)[1];
        res.send(challenge);
    });

    server.post(/^\/hook/, (req, res) => {
        res.send("OK");
        if (req.body.data[0]) {
            let data = req.body.data[0];
            if (data.type === "live") {
                bot.emit("stream_start", data);
            }
        }
    });

    server.listen(process.env.PORT || 5000);
};

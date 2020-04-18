const WebSocket = require('ws');

const wss = new WebSocket.Server({port: process.env.PORT || 8080});


var players = [];
var next_id = 0;

var missiles = [];
var next_missile_id = 0;


wss.on('connection', function (wsclient) {
    wsclient.on('message', function (message) {
        var data = JSON.parse(message);
        if (data.type == "update") {
            players.forEach(function (player) {
                if (player.id == data.data.id) {
                    player.alive = data.data.alive;
                    player.position = data.data.position;
                    player.rotation = data.data.rotation;
                }
            })
        } else if (data.type == "fire") {
            var new_missile = {id: next_missile_id, position: {x: data.data.position.x - 50, y: data.data.position.y - 60}, rotation: data.data.rotation, updates: 0};
            next_missile_id++;
            missiles.push(new_missile);
        } else if (data.type == "dead") {
            players.forEach(function (player, i) {
                if (player.id == data.data) {
                    players.splice(i, 1);
                }
            })
        }
    });

    wsclient.on('close', function (message) {
        var data = JSON.parse(message);
        players.forEach(function (player, i) {
            if (player.id == data) {
                players.splice(i, 1);
            }
        })
        wsclient.close();
    })

    players.push({id: next_id});
    wsclient.send(JSON.stringify({type: "start", data: {id: next_id}}));
    next_id++;
});

setInterval(function () {
    missiles.forEach(function (missile, i) {

        players.forEach(function (player) {
            if (missile.position.x > player.position.x - 100 && missile.position.x < player.position.x) {
                if (missile.position.y > player.position.y - 120 && missile.position.y < player.position.y) {
                    if (missile.updates > 5) {
                        player.alive = false;
                    }
                }
            }
        })

        if (missile.updates > 90) {
            missiles.splice(i, 1);
        }

        missile.position.x += 25 * Math.cos(missile.rotation * Math.PI / 180);
        missile.position.y += 25 * Math.sin(missile.rotation * Math.PI / 180);
        missile.updates++;
    });

    wss.clients.forEach(function (client) {
        client.send(JSON.stringify({type: "update", data: {players: players, missiles: missiles}}));
    });
}, 100);
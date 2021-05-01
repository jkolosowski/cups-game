const express = require('express');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const mqtt = require('mqtt');
const client = mqtt.connect('ws://localhost:8000');

app.use(express.json());
app.use(cors());
const port = 3021;

let games = [];

class Room {
    constructor(id) {
        this.id = id;
        this.users = [];
        this.team1 = null;
        this.team2 = null;
        this.round = 1;
        this.roundEnd = 11;
        this.clicked1 = false;
        this.clicked2 = false;
        this.cup1 = null;
        this.cup2 = null;
        this.randomCups();
        this.points1 = 0;
        this.points2 = 0;
        this.end = false;
    }
    addUser(nick) {
        this.users.push(nick);
    }
    randomCups() {
        this.cup1 = Math.floor(Math.random() * 3);
        this.cup2 = Math.floor(Math.random() * 3);
    }
    checkRound(number, nick) {
        if (this.team1 === nick) {
            this.clicked1 = true;
            if (this.cup1 === number) {
                this.points1 += 1;
            }
        } else if (this.team2 === nick) {
            this.clicked2 = true;
            if (this.cup2 === number) {
                this.points2 += 1;
            }
        }
        if (this.clicked1 && this.clicked2) {
            this.clicked1 = this.clicked2 = false;
            this.randomCups();
            this.round += 1;
            client.publish(`/update/${this.id}`, JSON.stringify({ round: this.round }));
        }
        if (this.round === this.roundEnd) {
            client.publish(`/update/${this.id}`, JSON.stringify({ points1: this.points1, points2: this.points2 }));
            this.end = true;
        }
    }
}

app.get('/', (req, res) => {
    try {
        const acc = games.map(game => {
            return game.id;
        });

        res.send({ activeGames: acc});
    } catch (error) {
        res.send({ error: error.message });
    }
});

app.get('/newgame', (req, res) => {
    try {
        const newGameId = uuidv4();
        games.push(new Room(newGameId));

        client.publish('/rooms', newGameId);

        res.send({ yourNewGame: newGameId });
    } catch (error) {
        res.send({ error: error.message });
    }
});

app.post('/join/:id', (req, res) => {
    try {
        const id = req.params.id;
        const nick = req.body.nick;
        const acc = games.find(game => {
            return game.id === id;
        });

        if (acc.users.includes(nick)) {
            res.send({ success: false });
        } else {
            acc.addUser(nick);
            res.send({ success: true });
        }
    } catch (error) {
        res.send({ error: error.message });
    }
});

app.post('/setteams/:id', (req, res) => {
    try {
        const id = req.params.id;
        const { team1, team2 } = req.body;

        const acc = games.find(game => id === game.id);

        if (team1) {
            acc.team1 = team1;
        } else {
            acc.team2 = team2;
        }

        client.publish(`/setteams/${id}`, JSON.stringify({ team1, team2 }));

        if (acc.team1 && acc.team2) {
            client.publish(`/update/${id}`, JSON.stringify({ round: acc.round }));
        }

        res.send({ success: true });
    } catch (error) {
        res.send({ error: error.message });
    }
});

app.get('/game/:id', (req, res) => {
    try {
        const id = req.params.id;
        const acc = games.find(game => id === game.id);

        res.send({ team1: acc.team1, team2: acc.team2, round: acc.round,
            points1: acc.points1, points2: acc.points2, end: acc.end });
    } catch (error) {
        res.send({ error: error.message });
    }
});

app.post('/cups/:id', (req, res) => {
    try {
        const id = req.params.id;
        const { number, nick } = req.body;

        const acc = games.find(game => id === game.id);
        acc.checkRound(number, nick);

        res.send({ success: true });
    } catch (error) {
        res.send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

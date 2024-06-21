const fs = require('fs');
const express = require('express');
const cors = require('cors');
const renderers = require('./renderers');
const port = 8001;

const app = express();
app.use(cors({ origin: "*" }));

app.get('/', (req, res) => {
    res.redirect('/stat/pointstaken');
});

app.get('/stat/*', async (req, res) => {
    let leaderboardName = req.path.split("/")[2];
    let leaderboard = await renderers.leaderboard(leaderboardName);
    if (!leaderboard) {
        res.status(404).send("That leaderboard doesn't exist.");
        return;
    }
    res.status(200).send(leaderboard);
});

app.get('/user/*', async (req, res) => {
    let username = req.path.split("/")[2];
    let playerStats = await renderers.player(username);
    if (!playerStats) {
        res.status(404).send("That player doesn't exist.");
        return;
    }
    res.status(200).send(playerStats);
});

app.use('/img', express.static('img'));
app.use('/css', express.static('css'));


app.listen(port);
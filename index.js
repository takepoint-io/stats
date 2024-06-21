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
    }
    res.status(200).send(leaderboard);
});

app.use('/img', express.static('img'));
app.use('/css', express.static('css'));


app.listen(port);
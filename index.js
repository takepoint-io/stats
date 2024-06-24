const fs = require('fs');
const express = require('express');
const cors = require('cors');
const renderers = require('./renderers');
const port = 8001;

const app = express();
app.use(cors({ origin: "*" }));

const staticPages = [
    "changelog",
    "about",
    "privacy"
];
const $404 = async (res) => res.status(404).send(await renderers.notFound());

app.get('/', (req, res) => {
    res.redirect('/stat/pointstaken');
});

app.get('/stat/*', async (req, res) => {
    let leaderboardName = req.path.split("/")[2];
    let leaderboard = await renderers.leaderboard(leaderboardName);
    if (!leaderboard) {
        $404(res);
        return;
    }
    res.status(200).send(leaderboard);
});

app.get('/user/*', async (req, res) => {
    let username = req.path.split("/")[2];
    let playerStats = await renderers.player(username);
    if (!playerStats) {
        $404(res);
        return;
    }
    res.status(200).send(playerStats);
});

for (let staticPage of staticPages) {
    app.get('/' + staticPage, async (req, res) => {
        let page = await renderers[staticPage]();
        res.status(200).send(page);
    });
}


app.use('/img', express.static('img'));
app.use('/css', express.static('css'));

app.get('*',function (req, res) {
    $404(res);
});

app.listen(port);
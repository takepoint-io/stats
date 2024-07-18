const express = require('express');
const cors = require('cors');
const sha256 = require('js-sha256').sha256;
const renderers = require('./tools/renderers');
const mail = require('./tools/mail');
const db = require('./tools/database');

const players = db.collection("players");
const port = 8001;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));

const tokens = new Map();
const staticPages = [
    "changelog",
    "about",
    "privacy",
    "terms"
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

app.get('/password/*', async (req, res) => {
    let pageName = req.path.split("/")[2];
    let params = req.query;
    let page;
    switch (pageName) {
        case "reset":
            page = await renderers.passwordReset(params.success);
            break;
        case "create":
            page = await renderers.passwordCreate(params.success, params.error);
            break;
        default:
            res.redirect("/password/reset");
            return;
    }
    res.status(200).send(page);
});

app.post('/password/*', async (req, res) => {
    let pageName = req.path.split("/")[2];
    let body = req.body;
    switch (pageName) {
        case "reset": {
            let success = false;
            if (mail.isEmail(body.email)) {
                let emailLowercase = body.email.toLowerCase()
                let accountExists = players.findOne({ email: emailLowercase });
                if (accountExists) {
                    let ttlHours = 2;
                    let token = mail.generateToken(16);
                    tokens.set(token.value, emailLowercase);
                    mail.send(
                        body.email, 
                        "Takepoints.io password reset",
                        `Hello,
                        Please click this link to reset your password: https://stats.nitrogem35.pw/password/create?token=${token.value}
                        This link will expire in ${ttlHours} hours.

                        If you didn't request this email, you can ignore it safely.`
                    );
                    setTimeout(() => {
                        tokens.delete(token.value);
                    }, ttlHours * 60 * 60 * 1000);
                }
                success = true;
            }
            res.redirect("/password/reset?success=" + success);
            break;
        }
        case "create": {
            let success = false;
            let error = "";
            let token = body.token;
            if (tokens.has(token)) {
                if (body.passwd === body.passwdConfirm && body.passwd.length >= 6 && body.passwd.length <= 200) {
                    let email = tokens.get(token);
                    tokens.delete(token);
                    let hash = sha256(body.passwd);
                    await players.updateOne({ email: email }, { $set: { passwordHash: hash } });
                    success = true;
                } else {
                    if (body.passwd !== body.passwdConfirm) error = "Passwords do not match.";
                    else if (body.passwd.length < 6) error = "Password must be at least 6 characters.";
                    else if (body.passwd.length > 200) error = "Password is way too long!"; 
                }
            } else if (token) {
                error = "Reset link expired.";
            }
            res.redirect("/password/create?token=" + body.token + "&success=" + success + (error ? `&error=${error}` : ""));
            break;
        }
        default:
            $404(res);
            break;
    }
})

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
const ejs = require('ejs');

const TimeAgo = require('javascript-time-ago');
const en = require('javascript-time-ago/locale/en');
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

const leaderboardMappings = require('../leaderboardMappings');
const db = require('./database');
const players = db.collection("players");


const renderers = {
    leaderboard: async (name) => {
        let which = leaderboardMappings[name];
        if (!which) return;
        let lb = await players.find(which.query).sort(which.sortfunc).limit(20).toArray();
        let table = "";
        for (let i = 0; i < lb.length; i++) {
            let entry = lb[i];
            let record = "<tr>";
            record += createTD(i + 1);
            record += createTD(`<a href="/user/${entry.username}">${entry.username}</a>`);
            record += createTD(which.format(eval(`entry${which.poi}`)));
            record += "</tr>";
            table += record;
        }
        
        return await renderPage('leaderboard', { 
            data: which,
            table,
        });
    },
    player: async (username) => {
        let playersFound = await players.find({ usernameLower: username.toLowerCase() }).toArray();
        if (!playersFound.length) return;
        let player = playersFound[0];
        player.distanceCovered = leaderboardMappings.distance.format(player.distanceCovered);
        player.joinedAt = timeAgo.format(player.createdAt);
        player.activeAt = timeAgo.format(player.lastActive);
        player.mostUsedWeapon = [
            [player.weapons.sniper, "sniper"], 
            [player.weapons.shotgun, "shotgun"], 
            [player.weapons.assault, "assault"]
        ].sort((a, b) => b[0].selected - a[0].selected)[0];
        let perks = Object.keys(player.perks)
        let mostUsedPerkName = perks.sort((a, b) => perks[b] - perks[a])[0];
        player.mostUsedPerk = [mostUsedPerkName, player.perks[mostUsedPerkName]];

        return await renderPage('user', {
            player,
            formatTime: leaderboardMappings.hours.format
        });
    },
    about: async () => {
        return await renderPage('about');
    },
    changelog: async () => {
        return await renderPage('changelog');
    },
    privacy: async() => {
        return await renderPage('privacy');
    },
    terms: async() => {
        return await renderPage('terms');
    },
    notFound: async () => {
        return await renderPage('404');
    },
    passwordReset: async (success) => {
        return await renderPage('/password/reset', {
            success
        });
    },
    passwordCreate: async (success, error) => {
        return await renderPage('/password/create', {
            success, error
        });
    }
};

async function renderPage(filename, data = {}) {
    let content = await ejs.renderFile('./templates/' + filename + '.ejs', data);
    let html = await ejs.renderFile('./templates/base.ejs', { body: content });
    return html;
}

function createTD(html) {
    return `<td>${html}</td>`
}


module.exports = renderers;
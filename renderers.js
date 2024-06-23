require('dotenv').config();
const ejs = require('ejs');
const { MongoClient, ServerApiVersion } = require("mongodb");
const TimeAgo = require('javascript-time-ago');
const en = require('javascript-time-ago/locale/en');
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');
const leaderboardMappings = {
    pointstaken: {
        name: 'Most Points Taken',
        column: 'Points Taken',
        active: 0,
        sortfunc: { pointsTaken: -1, createdAt: -1 },
        poi: '.pointsTaken',
        query: { pointsTaken: { $gt: 0 } },
        format: (v) => v.toLocaleString(),
        color: 'aqua'
    },
    pointsneutralized: {
        name: 'Most Points Neutralized',
        column: 'Points Neutralized',
        active: 1,
        sortfunc: { pointsNeutralized: -1, createdAt: -1 },
        poi: '.pointsNeutralized',
        query: { pointsNeutralized: { $gt: 0 } },
        format: (v) => v.toLocaleString(),
        color: 'purple'
    },
    score: {
        name: 'Highest Score',
        column: 'Score',
        active: 2,
        sortfunc: { score: -1, createdAt: -1 },
        poi: '.score',
        query: { score: { $gt: 0 } },
        format: (v) => v.toLocaleString(),
        color: 'blue'
    },
    kills: {
        name: 'Most Kills',
        column: 'Kills',
        active: 3,
        sortfunc: { kills: -1, createdAt: -1 },
        poi: '.kills',
        query: { kills: { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'yellow'
    },
    kdratios: {
        name: 'Highest K/D Ratios',
        column: 'K/D Ratio',
        active: 4,
        sortfunc: { kdr: -1, createdAt: -1 },
        poi: '.kdr',
        query: { deaths: { $gte: 100 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'green'
    },
    killstreaks: {
        name: 'Longest Killstreaks',
        column: 'Kills',
        active: 5,
        sortfunc: { killstreak: -1, createdAt: -1 },
        poi: '.killstreak',
        query: { killstreak: { $gt: 0 } },
        format: (v) => v.toLocaleString(),
        color: 'red'
    },
    scorepermin: {
        name: 'Highest Score Per Minute',
        column: 'Score Per Minute',
        active: 6,
        sortfunc: { spm: -1, createdAt: -1 },
        poi: '.spm',
        query: { timePlayed: { $gt: hoursToMs(5) } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'purple'
    },
    shots: {
        name: 'Most Shots Fired',
        column: 'Shots Fired',
        active: 7,
        sortfunc: { shotsFired: -1, createdAt: -1 },
        poi: '.shotsFired',
        query: { shotsFired: { $gt: 0 } },
        format: (v) => v.toLocaleString(),
        color: 'aqua'
    },
    accuracy: {
        name: 'Highest Accuracy',
        column: 'Accuracy',
        active: 8,
        sortfunc: { accuracy: -1, createdAt: -1 },
        poi: '.accuracy',
        query: { shotsFired: { $gte: 10 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}) + "%",
        color: 'blue'
    },
    distance: {
        name: 'Distance Covered',
        column: 'Distance',
        active: 9,
        sortfunc: { distanceCovered: -1, createdAt: -1 },
        poi: '.distanceCovered',
        query: { distanceCovered: { $gt: 0 } },
        format: (v) => {
            let m = v / 100;
            let km = m / 1000;
            let miles = km / 1.60934;
            km = km.toLocaleString(undefined, {
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2
            });
            miles = miles.toLocaleString(undefined, {
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2
            });
            return `${km}km (${miles}mi)`;
        },
        color: 'yellow'
    },
    hours: {
        name: 'Most Hours Played',
        column: 'Hours',
        active: 10,
        sortfunc: { timePlayed: -1, createdAt: -1 },
        poi: '.timePlayed',
        query: { timePlayed: { $gt: 0 } },
        format: (v) => {
            let hrs = msToHours(v).toLocaleString(undefined, {
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2
            });
            return hrs + "hrs";
        },
        color: 'green'
    },
    pistol: {
        name: 'Best Pistol',
        column: 'Kills With Pistol',
        active: 11,
        sortfunc: { "weapons.pistol.kills": -1, createdAt: -1 },
        poi: '.weapons.pistol.kills',
        query: { "weapons.pistol.kills": { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'red'
    },
    assault: {
        name: 'Best Assault',
        column: 'Kills With Assault',
        active: 12,
        sortfunc: { "weapons.assault.kills": -1, createdAt: -1 },
        poi: '.weapons.assault.kills',
        query: { "weapons.assault.kills": { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'purple'
    },
    sniper: {
        name: 'Best Sniper',
        column: 'Kills With Sniper',
        active: 13,
        sortfunc: { "weapons.sniper.kills": -1, createdAt: -1 },
        poi: '.weapons.sniper.kills',
        query: { "weapons.sniper.kills": { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'aqua'
    },
    shotgun: {
        name: 'Best Shotgun',
        column: 'Kills With Shotgun',
        active: 14,
        sortfunc: { "weapons.shotgun.kills": -1, createdAt: -1 },
        poi: '.weapons.shotgun.kills',
        query: { "weapons.shotgun.kills": { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'aqua'
    },
    doublekills: {
        name: 'Most Double Kills',
        column: 'Double Kills',
        active: 15,
        sortfunc: { "doubleKills": -1, createdAt: -1 },
        poi: '.doubleKills',
        query: { "doubleKills": { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'yellow'
    },
    triplekills: {
        name: 'Most Triple Kills',
        column: 'Triple Kills',
        active: 16,
        sortfunc: { "tripleKills": -1, createdAt: -1 },
        poi: '.tripleKills',
        query: { "tripleKills": { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'green'
    },
    multikills: {
        name: 'Most Multi Kills',
        column: 'Multi Kills',
        active: 17,
        sortfunc: { "multiKills": -1, createdAt: -1 },
        poi: '.multiKills',
        query: { "multiKills": { $gt: 0 } },
        format: (v) => v.toLocaleString(undefined, {minimumFractionDigits: 2}),
        color: 'red'
    }
};
const statsURL = process.env.isDev == "yes" ? "http://localhost:8001" : "https://stats.nitrogem35.pw";
const whichDatabase = process.env.isDev == "yes" ? "takepoint-dev" : "takepoint";
const mongoDB = new MongoClient(process.env.mongoConnectionStr, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const db = mongoDB.db(whichDatabase);
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
        
        let html = await ejs.renderFile('./templates/leaderboard.ejs', { 
            data: which, 
            statsURL,
            table,
        });
        return html;
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
        let html = await ejs.renderFile('./templates/user.ejs', {
            player,
            formatTime: leaderboardMappings.hours.format
        });
        return html;
    },
    notFound: async () => {
        let html = await ejs.renderFile('./templates/404.ejs');
        return html;
    }
};

function createTD(html) {
    return `<td>${html}</td>`
}

function msToHours(ms) {
    return ms / (60 * 60 * 1000);
}

function hoursToMs(hours) {
    return hours * 60 * 60 * 1000;
}


module.exports = renderers;
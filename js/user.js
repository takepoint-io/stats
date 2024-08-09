let badges = Array.from(document.getElementsByClassName("takepoint-badge"));
for (let badge of badges) {
    let info = badge.getAttribute("info");
    let ts = parseInt(badge.getAttribute("timestamp"));
    let achievedString = ""; 
    if (ts) {
        let tsDateObj = new Date(ts);
        achievedString = `\n\nAchieved on ${tsDateObj.toLocaleDateString()}, ${tsDateObj.toLocaleTimeString()}`;
    }
    badge.title = `${info}${achievedString}`;
}
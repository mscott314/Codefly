let api_form = document.querySelector('#api_form');
let formData;
let api_key;
let main = document.querySelector('#main');

api_form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let guild_info = [];
    formData = new FormData(api_form);
    api_key = formData.get('api_key');
    if (document.querySelector('#guild_list')) {
        document.querySelector('#guild_list').remove();
    }
    if (document.querySelector('#log_list')) {
        document.querySelector('#log_list').remove();
    }

    let {guilds, guild_leader} = await (await fetch(`https://api.guildwars2.com/v2/account?access_token=${api_key}`)).json();
    for (let id of guilds) {
        let {name, tag} = await (await fetch(`https://api.guildwars2.com/v2/guild/${id}`)).json();
        if (guild_leader.includes(id)) {
            guild_info.push({"name": name, "tag": tag, "leader": true, "id": id});
        } else {
            guild_info.push({"name": name, "tag": tag, "leader": false, "id": id});
        }
    }
    create_guild_list(guild_info);
    api_form.reset();
    filter.reset();
});

function create_guild_list(guild_info) {
    let section = document.querySelector('section');
    let span = document.createElement('span')
    span.setAttribute('id', 'guild_list');
    for (let guilds of guild_info) {
        if (!guilds.leader) {
            let button = document.createElement('button');
            button.disabled = true;
            button.textContent = `[${guilds.tag}] ${guilds.name}`;
            span.append(button);
        } else {
            let button = document.createElement('button');
            button.textContent = `[${guilds.tag}] ${guilds.name}`;
            span.append(button);
            button.addEventListener('click', () => {
                filter.reset();
                create_log_list(guilds.id).then().catch(() => {
                    console.log("Error at create_log_list() call")
                });
            });
        }
    }
    section.append(span);
}

async function create_log_list(guild_id) {
    let logs = await (await fetch('https://api.guildwars2.com/v2/guild/' + guild_id + '/log?access_token=' + api_key)).json();

    if (document.querySelector('#log_list')) {
        document.querySelector('#log_list').remove();
    }
    let log_list = document.createElement('div'); // The final element that gets appended to the body.
    log_list.setAttribute('id', 'log_list');

    let log_item; // a fetched api object for item_id
    let log_entry; //
    let type;
    let date;

    let len;
    if (formData.get('length') === "all") {
        len = logs.length;
    } else {
        len = parseInt(formData.get('length'));
    }

    for (let i = 0; i < len; i++) { // main loop for printing the log elements on the page

        date = `${new Date(logs[i]["time"]).toDateString()} - ${new Date(logs[i]["time"]).toLocaleTimeString()}`;
        type = logs[i]["type"];

        switch (type) {
            case "joined":
                log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} joined the guild!`);
                break;
            case "invited":
                log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["invited_by"]} invited ${logs[i]["user"]} to the guild!`);
                break;
            case "invite_declined":
                log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} declined the invite.`);
                break;
            case "kick": // sometimes there is no user or kicked by 'undefined left the guild'
                if (logs[i]["user"] === logs[i]["kicked_by"]) {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} left the guild.`);
                } else {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} was kicked by ${logs[i]["kicked_by"]}.`);
                }
                break;
            case "rank_change":
                if (logs[i]["old_rank"] === "none") {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} created the guild!.`);
                } else {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["changed_by"]} changed ${logs[i]["user"]}'s rank from ${logs[i]["old_rank"]} to ${logs[i]["new_rank"]}.`);
                }
                break;
            case "treasury": // guild treasury for upgrades to the guild before max level
                log_item = await (await fetch('https://api.guildwars2.com/v2/items/' + logs[i]["item_id"])).json();
                log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} deposited ${logs[i]["count"]} ${log_item["name"]} into guild treasury.`, log_item["icon"]);
                break;
            case "stash": // needs to include coins + conversion
                if (logs[i]["coins"]) {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} deposited coins: ${logs[i]["coins"]}`);
                    break;
                }
                log_item = await (await fetch('https://api.guildwars2.com/v2/items/' + logs[i]["item_id"])).json();
                // item_img.src = log_item["icon"];
                if (logs[i]["operation"] === "deposit") {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} deposited ${logs[i]["count"]} ${log_item["name"]} in the guild bank.`, log_item["icon"]);
                }
                if (logs[i]["operation"] === "withdraw") {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} withdrew ${logs[i]["count"]} ${log_item["name"]}`, log_item["icon"]);
                }
                if (logs[i]["operation"] === "move") {
                    log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} moved ${logs[i]["count"]} ${log_item["name"]} around the bank`, log_item["icon"]);
                }
                break;
            case "motd":
                log_entry = create_log_entry(i, date, type, logs[i], `${logs[i]["user"]} changed the guild message of the day to: ${logs[i]["motd"]}`);
                break;
            case "upgrade": // https://api.guildwars2.com/v2/recipes/12506 recipe_id
                log_item = await (await fetch('https://api.guildwars2.com/v2/guild/upgrades/' + logs[i]["upgrade_id"])).json();
                if (logs[i]["action"] === "queued") { // does not always contain user
                    log_entry = create_log_entry(i, date, logs[i]["type"], logs[i], `A guild upgrade was queued: ${log_item["name"]}`);
                }
                if (logs[i]["action"] === "cancelled") {
                    log_entry = create_log_entry(i, date, logs[i]["type"], logs[i], `A guild upgrade was cancelled.`);
                }
                if (logs[i]["action"] === "completed") {
                    log_entry = create_log_entry(i, date, logs[i]["type"], logs[i], `${logs[i]["user"]} completed the guild upgrade ${logs[i]["count"]} ${log_item["name"]}`, log_item["icon"]);
                }
                break;
            case "influence": // If total_participants = 0, array is empty and returns undefined
                if (logs[i]["participants"]) {
                    log_entry = create_log_entry(i, date, logs[i]["type"], logs[i], `Influence was added to the guild via: ${logs[i]["activity"]}. by ${logs[i]["participants"]}`);
                } else {
                    log_entry = create_log_entry(i, date, logs[i]["type"], logs[i], `Influence was added to the guild via: ${logs[i]["activity"]}.`);
                }
                break;
            default:
                log_entry = create_log_entry(i, date, logs[i]["type"], logs[i], `There was a problem generating this entry.`);
                break;
        }
        log_list.appendChild(log_entry);
    }
    main.appendChild(log_list);
    // document.body.appendChild(log_list);
}

function create_log_entry(count, date, type, details, description, image) {

    let container = document.createElement('div');
    container.setAttribute('class', `container ${type}`);

    let top_section = document.createElement('section');
    let top_left_span = document.createElement('span');
    top_left_span.textContent = count + 1;
    let top_right_span = document.createElement('span');
    top_right_span.textContent = date;

    top_section.appendChild(top_left_span);
    top_section.appendChild(top_right_span);
    container.appendChild(top_section);

    let m_section = document.createElement('section');
    let ml_span = document.createElement('span');
    ml_span.setAttribute('class', 'ml_span');

    ml_span.textContent = description;
    m_section.appendChild(ml_span);

    if (image) { // loading="lazy"
        let mr_img = document.createElement('img');
        mr_img.src = image;
        m_section.appendChild(mr_img);
    }
    container.appendChild(m_section);

    let br_details = document.createElement('details');
    let br_pre = document.createElement('pre');
    br_pre.textContent = JSON.stringify(details, null, 2);
    br_details.appendChild(br_pre);

    let b_section = document.createElement('section');
    let bl_span = document.createElement('span');
    bl_span.textContent = type;

    b_section.appendChild(br_details);
    b_section.appendChild(bl_span);
    container.appendChild(b_section);

    return container
}

let filter = document.querySelector('#filter');
filter.addEventListener('change', () => {
    let check = document.querySelectorAll('input[type=checkbox]:checked');
    let x = document.querySelectorAll('.container');

    let c;
    for (c of x.values()) {
        if (check.length > 0) {
            c.style.display = "none";
        } else {
            c.style.display = "flex";
        }
    }

    let n;
    for (n of check.values()) {
        for (c of x.values()) {
            if (n.id === c.className.split(" ")[1]) {
                c.style.display = "flex";
            }
        }
    }
});
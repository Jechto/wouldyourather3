const Pgjs = require("./pg.js");
const Dilemma = require("./dilemma.js");
const {MessageEmbed} = require('discord.js')

async function createRepeatingWur(interaction) {
    args = interaction.options["_hoistedOptions"]
    date = Math.floor(Date.now()/1000)
    args.forEach(e => {
        if (e.name == "channel") {
            channel = e.value
        } else if (e.name == "interval") {
            interval = e.value
        } else if (e.name == "date") {
            if (e.value >= date) {
                date = e.value
            }
        }
    })
    console.log(interval)
    if (interval > 172800 || interval < 3600) {
        interaction.reply({ content: "Interval must be more than 3600 and less than 172800", ephemeral: true })
        return;
    }

    r1 = await Pgjs.query('SELECT count(*) AS cnt FROM "WurQueue" WHERE "ServerID"=$1',[interaction.guild.id])
    if (r1.rows[0].cnt >= 3) {
        interaction.reply({ content: "You've reached the limit of maximum auto commands", ephemeral: true })
        return;
    }

    date = Math.floor(date/3600)*3600;
    console.log(channel,interval,date)
    await Pgjs.query('INSERT INTO "WurQueue"("ServerID","ChannelID","PostTime","Delay") VALUES ($1,$2,$3,$4)',[interaction.guild.id,interaction.channel.id,date,interval])
    interaction.reply({ content: "Date Inserted", ephemeral: true })
}

// run this method every hour or so.
async function QueryDBForMsgToSend(client) {
    // loop through all queue in db,
    // attempt to send message
    // if success update posttime by delay
    t = Math.floor(Date.now() /1000)

    queues = await Pgjs.query('SELECT "ID","ServerID","ChannelID","PostTime","Delay" FROM "WurQueue"')
    for (i = 0 ; i < queues.rows.length; i++) {
        if (parseInt(queues.rows[i].PostTime) <= t) {
            Dilemma.offsyncWouldYouRather(client,queues.rows[i])
        }   
    }
}

function delay(t, val) {
   return new Promise(function(resolve) {
       setTimeout(function() {
           resolve(val);
       }, t);
   });
}

async function ListAllRoutines(interaction) {
    queues = await Pgjs.query('SELECT "ID","ServerID","ChannelID","PostTime","Delay" FROM "WurQueue" WHERE "ServerID"=$1',[interaction.guild.id])
    
    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("List of all Active Routines").setFooter("type '/wur repeatremove [id]' to delete one of the repeating commands")

    queues.rows.forEach(q => {
        nextRun = new Date(parseInt(q.PostTime)*1000)
        timetorun = parseInt(q.PostTime) - Math.floor(Date.now() /1000)
        embed.addField("Repeat command ID: "+q.ID,"Delay: "+q.Delay+"s \nNext Post: "+nextRun.toLocaleTimeString("en-GB")+" UTC at "+nextRun.toLocaleDateString("en-GB")+" (in "+Math.floor(timetorun)+"s)",false)
    })
    interaction.reply({embeds: [embed]})
}
async function RemoveRoutine(interaction,id) {
    r1 = await Pgjs.query('SELECT count(*) AS cnt FROM "WurQueue" WHERE "ID"=$1 AND "ServerID"=$2',[id,interaction.guild.id])
    if (r1.rows[0].cnt == 1) {
        await Pgjs.query('DELETE FROM "WurQueue" WHERE "ID"=$1',[id])
        interaction.reply({ content: "Repeating Command Removed", ephemeral: true })
    } else {
        interaction.reply({ content: "Invalid ID", ephemeral: true })
    }
}

module.exports = {
    createRepeatingWur,
    QueryDBForMsgToSend,
    ListAllRoutines,
    RemoveRoutine
}

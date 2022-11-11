const isProd = true

const Dilemma = require("./dilemma.js");
const Admin = require("./admin.js")
const Profile = require("./profile.js")
const Vote = require("./vote.js")
const Gamble = require("./gamble.js")
const GambleRoll = require("./gambleroll.js")
const Repeater = require("./repeater.js")

wurcoin = "<:wurcoin:899353715071389716>"

const {MessageEmbed} = require('discord.js')
const { Client, Intents } = require('discord.js');
const Pgjs = require("./pg.js");
const { type } = require("express/lib/response");
const { options } = require("pg/lib/defaults");
const { is } = require("express/lib/request");
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MESSAGES, 
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
]});

var clientid
var guildid


const Command = {
    "name": "wur",
    "description": "Shows you a dilemma",
    "options": [
      {
        "type": 1,
        "name": "dilemma",
        "description": "Show Dilemma",
        "options": []
      },
      {
        "type": 1,
        "name": "help",
        "description": "Shows Help",
        "options": []
      },
      {
        "type": 1,
        "name": "info",
        "description": "Show bot info",
        "options": []
      },
      {
        "type": 1,
        "name": "profile",
        "description": "Show your bot profile",
        "options": []
      },
      {
        "type": 1,
        "name": "leaderboard",
        "description": "Show the leaderboard",
        "options": [
            {
                "type": 4,
                "name": "page",
                "description": "Leaderboard page",
                "required": false
            }
        ]
      },
      {
        "type": 1,
        "name": "admin",
        "description": "Admin commands",
        "options": [
          {
            "type": 3,
            "name": "config",
            "description": "config type",
            "choices": [
                {
                    "name": "Wur",
                    "value": "wur"
                },
                {
                    "name": "Message Stay",
                    "value": "msgstay"
                },
                {
                    "name": "Despawn",
                    "value": "despawn"
                }
            ],
            "required": false
          },
          {
            "type": 4,
            "name": "value",
            "description": "Value of config",
            "required": false
          }
        ]
      },
      {
        "type": 1,
        "name": "vote",
        "description": "Show information about voting",
        "options": []
      },
      {
        "type": 1,
        "name": "roll",
        "description": "Play the dice game",
        "options": [
          {
            "type": 4,
            "name": "bet",
            "description": "Your bet",
            "required": true,
            "choices": []
          },
          {
            "type": 3,
            "name": "operand",
            "description": "the operand",
            "required": true,
            "choices": [
              {
                "name": "More",
                "value": "more"
              },
              {
                "name": "Less",
                "value": "less"
              }
            ]
          },
          {
            "type": 4,
            "name": "threshhold",
            "description": "the threshhold which the operand is applied to",
            "required": true
          }
        ]
      },
      {
        "type": 1,
        "name": "repeat",
        "description": "Post a wur dilemmea on repeat with a certain interval",
        "options": [
          {
            "type": 7,
            "name": "channel",
            "description": "channel to post in",
            "required": true
          },        
          {
            "type": 4,
            "name": "interval",
            "description": "The amount of seconds delay between each wur comment (in seconds)",
            "required": true
          },
          {
            "type": 4,
            "name": "date",
            "description": "The unix date which the first message should be posted, (leave empty if you want to post right now)",
          }
        ]
      },
      {
        "type": 1,
        "name": "repeatremove",
        "description": "Remove a certain repeating command",
        "options": [      
          {
            "type": 4,
            "name": "id",
            "description": "The ID of the repeating dilemma to be removed",
          }
        ]
      }
    ]
}


if (isProd) {
    clientid = "[clientID]";
    client.api.applications(clientid).commands.post({data: Command})
} else {
   // this is only used when you wish to test the bot on your own server
    guildid = "[guildID]"
    clientid = "[clientID]";
    client.api.applications(clientid).guilds(guildid).commands.post({data: Command})
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName != "wur") return;
    //console.log(interaction)
    args = interaction.options["_hoistedOptions"]
    console.log(args) 

    if (interaction.options["_subcommand"] === "help") {help(interaction)}
    if (interaction.options["_subcommand"] === "info") {info(interaction)}
    if (interaction.options["_subcommand"] === "dilemma") {
        if (interaction.member != null) {if (interaction.member.permissions.has("ADMINISTRATOR")) {isadmin = true;}}
        r1 = await Pgjs.query('SELECT "Value" FROM "ServerConfig" WHERE "ServerID"=$1 AND "Config"=\'wur\'',[interaction.guildId])
        show = 0
        if (r1.rows.length == 1) {
            show = r1.rows[0].Value
        }
        if (show == 0) {
            Profile.create(interaction.member);
            Dilemma.wouldYouRather(interaction)
        } else if (!isadmin) {
            let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Would you rather").addFields([
                {name: "Error",value: "Permission Denied, your admin disabled this feature"}
            ])
            interaction.reply({embeds: [embed],ephemeral: true})
        } else {
            Profile.create(interaction.member);
            Dilemma.wouldYouRather(interaction)
        }
    }
    if (interaction.options["_subcommand"] === "vote") {Vote.info(interaction)}
    if (interaction.options["_subcommand"] === "leaderboard") {
        Profile.create(interaction.member);
        if (args.length == 1) {
            if (interaction,args[0].value >= 1) {
                Profile.leaderboard(interaction,args[0].value-1)
            } else {
                Profile.leaderboard(interaction,0)
            }
        } else {
            Profile.leaderboard(interaction,0)
        }
    }
    if (interaction.options["_subcommand"] === "profile") {
        Profile.create(interaction.member);
        Profile.display(interaction)
    }
    if (interaction.options["_subcommand"] === "admin") {Admin.panel(interaction)}
    if (interaction.options["_subcommand"] === "roll") {
        GambleRoll.validateInput(interaction)
    }
    if (interaction.options["_subcommand"] === "repeat") {
        if (interaction.member.permissions.has("ADMINISTRATOR")) {
            Repeater.createRepeatingWur(interaction)
        } else {
            interaction.reply({ content: "This command is admin only", ephemeral: true })
        }
    }
    if (interaction.options["_subcommand"] === "repeatremove") {
        if (interaction.member.permissions.has("ADMINISTRATOR")) {
            args = interaction.options["_hoistedOptions"]
            for (i = 0; i < args.length;i++) {
                if (args[i].name == "id") {
                    Repeater.RemoveRoutine(interaction,args[i].value)
                    return;
                }
            }
            Repeater.ListAllRoutines(interaction)   
        } else {
          interaction.reply({ content: "This command is admin only", ephemeral: true })
      }
    }
})

// -------

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}! (WUR3 Online)`);
    client.user.setActivity('"/wur help" (WUR v3.2)', { type: 'WATCHING' });
    Dilemma.client = client;
    setInterval(doTick, 1000)
});
client.on('shardError', (error) => {
    console.log(error);
});

client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot)
    return
    if (user.id != client.user.id) {
        if (messageReaction.emoji.name === "🅰") {
            Dilemma.processAnswer("A",messageReaction.message,user)
        } else if (messageReaction.emoji.name === "🅱") {
            Dilemma.processAnswer("B",messageReaction.message,user)
        } else if (messageReaction.emoji.name === "🔄") {
            GambleRoll.confirmRoll(messageReaction.message,user)
        }
    }
})

async function help(interaction) {
    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Bot Commands").addFields([
        {name: "```/wur dilemma```",value: "Show random dilemma"},
        {name: "```/wur help```",value: "Shows this message"},
        {name: "```/wur info```",value: "Shows info about the bot"},
        {name: "```/wur profile```",value: "Show your profile"},
        {name: "```/wur vote```",value: "Show info about voting"},
        {name: "```/wur leaderboard```",value: "Show leaderboards"},
        {name: "```/wur gamble```",value: "Show all gambling games"},
        {name: "```/wur admin```",value: "Show information about admin"},
        {name: "```/wur repeat```",value: "Add automated dilemma"},
        {name: "```/wur repeatremove```",value: "Remove automated dilemma"}
    ])

    await interaction.reply({embeds: [embed], ephemeral: true })
}
async function info(interaction) {
    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Information").addFields([
        {name: "**What is this?**",value: "This bot generates random would you rather dilemmas, the dilemmas are based around what u and other users vote"},
        {name: "**XP**",value: "When you answer questions you gain XP, the more answers you answer during a day, the less XP you get"},
        {name: "**WurCoins**",value: "You get WurCoins "+wurcoin+" when you answer dilemmas, the amount of WurCoins "+wurcoin+" you get is equal to your ```level * XPForQuestion```"},
    ])
    
    await interaction.reply({embeds: [embed], ephemeral: true })
}

client.login()

function getUser(id) {
    return client.users.cache.find(user => user.id === id)
}
function getChannel(channelId) {
    return client.channels.get(channelId)
}


function doTick() {
    t = Math.floor(Date.now() /1000)
    d = 600
    if (t % 60 == 0) {
        console.log("Time: "+t+" (in "+(d-(t%d))+" s)")
    }
    if (t % d == 30) {
        Repeater.QueryDBForMsgToSend(client)
    }
}

module.exports = {
    getUser,
    getChannel,
}

const {MessageEmbed, MessageAttachment} = require('discord.js')
const Pgjs = require("./pg.js");
const Profile = require("./profile.js")
wurcoin = "<:wurcoin:899353715071389716>"


async function info(interaction) {
    r1 = await Pgjs.query('SELECT "XP","DilemmasAnswered","Coins" FROM "Users" WHERE "UserID"=$1',[interaction.member.id])

    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Voting Information").addFields([
        {name: "**Voting**",value: "If you enjoy the bot, you can vote for the bot on top.gg and recieve nice rewards"},
        {name: "**Reward**",value: "the reward you get for voting is ```750*currentLevel```. So your reward would be "+(Profile.XPtoLevel(r1.rows[0].XP)*750)+wurcoin+", it will be credited to your balance within 5min of voting"},
        {name: "**Link**",value: "https://top.gg/bot/432906026849796097/vote"},
    ])
    interaction.reply({embeds: [embed], ephemeral: true })
}

module.exports = {
    info
}
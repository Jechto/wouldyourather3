const {MessageEmbed} = require('discord.js')
const { Client, Intents } = require('discord.js');
const Pgjs = require("./pg.js");

async function info(message) {
    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Gamble commands").addFields([
        {name: "```!wur roll```",value: "show info about the roll game"},
    ]).setFooter("Autodeletes in 60sec")
    message.channel.send({embeds: [embed]}).then(msgembed => {
        setTimeout(() => msgembed.delete(),60000)
        message.delete().catch(() => console.log("Error Deleting Msg ID0003"))
    })
}

module.exports = {
    info,
}
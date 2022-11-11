const {MessageEmbed} = require('discord.js')
const Pgjs = require("./pg.js");

async function panel(interaction) {
    isadmin = false;
    console.log(interaction.member.permissions)
    if (interaction.member != null) {if (interaction.member.permissions.has("ADMINISTRATOR")) {isadmin = true;}}
    if (!isadmin) {return}

    r1 = await Pgjs.query('SELECT "Config","Value" FROM "ServerConfig" WHERE "ServerID"=$1',[interaction.guildId])
    var despawntime = 60
    var msgstay = false
    var wurallowed = false
    r1.rows.forEach(r => {
        if (r.Config == 'despawn') {
            despawntime = r.Value;
        }
        if (r.Config == 'msgstay') {
            if (r.Value == 1) {
                msgstay = true;
            }
        }
        if (r.Config == 'wur') {
            if (r.Value == 1) {
                wurallowed = true;
            }
        }
    })

    args = interaction.options["_hoistedOptions"]
    console.log(args)

    config = "";
    value = 0;
    if (args.length >= 1) {
        args.forEach(e => {
            if (e.name == "config") {
                config = e.value
            }
            else if (e.name == "value") {
                value = e.value
            }
        })
    } else {
        let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Would you rather Admin Panel").setDescription("Here you can configure the bot on your server, below are the list of settings").addFields([
            {name: "Message Despawn Time (despawn)",value: +despawntime+"s (-1 = no despawn)"},
            {name: "Messages stay after reactions (msgstay)",value: msgstay+" (0 = off / 1 = on)"},
            {name: "Disables the '!wur' command for normal users (wur)",value: wurallowed+" (0 = true/ 1 = false)"}
        ]).setFooter("type '!wur admin <setting> <value>' to change a value, example '!wur admin despawn 120' will set msg despawn to 120 sec")
        await interaction.reply({embeds: [embed], ephemeral: true })
    }

    if (config == "despawn") {
        if (value >= -1 && value <= 604800) {
            await Pgjs.query('DELETE FROM "ServerConfig" WHERE "ServerID"=$1 AND "Config"=$2',[interaction.guildId,config]);
            await Pgjs.query('INSERT INTO "ServerConfig"("ServerID","Config","Value") VALUES ($1,$2,$3)',[interaction.guildId,config,value]);
            await interaction.reply({content: "Wur messages will now despawn after "+value+" seconds", ephemeral: true })
        }
    } else if (config == "msgstay") {
        if (value == 1) {
            await Pgjs.query('DELETE FROM "ServerConfig" WHERE "ServerID"=$1 AND "Config"=$2',[interaction.guildId,config]);
            await Pgjs.query('INSERT INTO "ServerConfig"("ServerID","Config","Value") VALUES ($1,$2,$3)',[interaction.guildId,config,1]);
            await interaction.reply({content: "Successfully set msgstay to true", ephemeral: true })
        } else if (value == 0) {
            await Pgjs.query('DELETE FROM "ServerConfig" WHERE "ServerID"=$1 AND "Config"=$2',[interaction.guildId,config]);
            await Pgjs.query('INSERT INTO "ServerConfig"("ServerID","Config","Value") VALUES ($1,$2,$3)',[interaction.guildId,config,0]);
            await interaction.reply({content: "Successfully set msgstay to false", ephemeral: true })
        } else {
            await interaction.reply({content: "Error, please use 1 for true and 0 for false", ephemeral: true })
        }
    } else if (config == "wur") {
        if (value == 1) {
            await Pgjs.query('DELETE FROM "ServerConfig" WHERE "ServerID"=$1 AND "Config"=$2',[interaction.guildId,config]);
            await Pgjs.query('INSERT INTO "ServerConfig"("ServerID","Config","Value") VALUES ($1,$2,$3)',[interaction.guildId,config,1]);
            await interaction.reply({content: "Successfully set wur to true", ephemeral: true })
        } else if (value == 0) {
            await Pgjs.query('DELETE FROM "ServerConfig" WHERE "ServerID"=$1 AND "Config"=$2',[interaction.guildId,config]);
            await Pgjs.query('INSERT INTO "ServerConfig"("ServerID","Config","Value") VALUES ($1,$2,$3)',[interaction.guildId,config,0]);
            await interaction.reply({content: "Successfully set wur to false", ephemeral: true })
        } else {
            await interaction.reply({content: "Error, please use 1 for true and 0 for false", ephemeral: true })
        }
    }
}

module.exports = {
    panel
}

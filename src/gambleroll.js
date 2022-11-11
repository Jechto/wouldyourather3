const reward = require("./reward.js");
const Discord = require("discord.js");
const {MessageEmbed} = require('discord.js')
const Pgjs = require("./pg.js");

const numbers = [
    "<a:0_:851463676530786364>",
    "<a:1_:851463677341073439>",
    "<a:2_:851463677700734986>",
    "<a:3_:851463677714628608>",
    "<a:4_:851463677864837190>",
    "<a:5_:851463677714628639>",
    "<a:6_:851463677810835506>",
    "<a:7_:851463677822500874>",
    "<a:8_:851463677697327136>",
    "<a:9_:851463677853040691>"
]
wurcoin = "<:wurcoin:899353715071389716>"
rtp = 0.99

async function validateInput(interaction) {
    args = interaction.options["_hoistedOptions"]
    args.forEach(e => {
        if (e.name == "bet") {
            bets = e.value
        } else if (e.name == "operand") {
            operand = e.value
        } else if (e.name == "threshhold") {
            threshhold = e.value
        }
    })
    roll(interaction,bets,operand,threshhold)
}
async function roll(interaction,bets,operand,threshhold) {
    if (threshhold <= 1 && threshhold <= 9999) {
        let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Invalid Parameters").addFields([
            {name: "invalid parameters",value: "Threshhold must be within 1 and 9999"},
        ]).setFooter("Autodeletes in 60sec")
        interaction.reply({embeds: [embed]})
        return 
    }

    let reward = 0
    if (operand == "more") {
        reward = 10000/(10000-threshhold)*bets*rtp
    } else if (operand == "less") {
        reward = 10000/threshhold*bets*rtp
    } else {
        return
    }

    r1 = await Pgjs.query('SELECT "Coins" FROM "Users" WHERE "UserID"=$1',[interaction.user.id])
    coins = r1.rows[0].Coins

    if (coins < bets) {
        return
    }

    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Confirm Roll").addFields([
        {name: "Bet",value: bets+" "+wurcoin},
        {name: "Roll "+operand+" "+threshhold+" to win!",value: Math.floor(reward)+" "+wurcoin},
        {name: "Info",value: "you or anyone can react to play"},
    ]).setFooter("React to roll 🔄.Autodeletes in 60sec")
    interaction.reply({embeds: [embed]})
    interaction.fetchReply().then(reply => {
        reply.react("🔄");
        setTimeout(() => reply.delete(),60000)
    })
}
async function confirmRoll(message,user) {
    if (message.embeds.length == 1) {
        embed = message.embeds[0]
        e = embed; // idk why it has to be this way
        if (embed.color == 16562691 && embed.title == "Confirm Roll") {
            unparedbet = e.fields[0].value.split(' ')[0]
            operand = e.fields[1].name.split(' ')[1]
            unparedthreshold = e.fields[1].name.split(' ')[2]
            console.log("bet: "+unparedbet)
            console.log("operand: "+operand)
            console.log("threshold: "+unparedthreshold)
            console.log("user",user.id)
            bet = parseInt(unparedbet)
            threshhold = parseInt(unparedthreshold)
            if (threshhold > 10000 || threshhold <= 0) {return;}
            if (bet <= 0) {return;}
            r1 = await Pgjs.query('SELECT "Coins" FROM "Users" WHERE "UserID"=$1',[user.id])
            coins = r1.rows[0].Coins
            if (coins < bet) {return}

            let reward = 0
            if (operand == "more") {
                reward = 10000/(10000-threshhold)*bet*rtp
            } else if (operand == "less") {
                reward = 10000/threshhold*bet*rtp
            } else {
                return
            }

            // send roll
            let roll = Math.floor(Math.random()*10000);
            let digits = (roll+"").split("");
            let rolltext = "";
            for (i = 0; i < digits.length;i++) {
                rolltext += numbers[parseInt(digits[i])]
            }
            if (roll < 1000) {
                rolltext = "<a:0_:851463676530786364>"+rolltext
                if (roll < 100) {
                    rolltext = "<a:0_:851463676530786364>"+rolltext
                    if (roll < 10) {
                        rolltext = "<a:0_:851463676530786364>"+rolltext
                    }
                }
            }

            let winnings = 0
            if (operand == "more" && threshhold < roll) {
                winnings = reward
            } else if (operand == "less" && threshhold > roll) {
                winnings = reward
            }

            await Pgjs.query('UPDATE "Users" SET "Coins"="Coins"+$1 WHERE "UserID"=$2',[(winnings-bet),user.id])
            console.log("UPDATE Users SET Coins=Coins+"+(winnings-bet)+"WHERE UserID="+user.id)


            let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Rolling for "+user.username).addFields([
                {name: "Roll "+operand+" "+threshhold+" to win!",value: Math.floor(reward)+" "+wurcoin},
                {name: "Rolling...",value: rolltext}
            ]).setFooter("Autodeletes in 20sec")
            message.channel.send({embeds: [embed]}).then(async msgembed => {
                setTimeout(() => msgembed.delete(),20000)
                setTimeout(() => {
                    let embed2 = new MessageEmbed().setColor("#FCBA03").setTitle("Rolling for "+user.username).addFields([
                        {name: "Roll "+operand+" "+threshhold+" to win!",value: Math.floor(reward)+" "+wurcoin},
                        {name: "You won:",value: winnings+" "+wurcoin}
                    ]).setFooter("Autodeletes in 20sec")
                    msgembed.edit({embeds: [embed2]})
                },4000)
            })

        }
    }
}

async function help(message) {
    let embed = new Discord.MessageEmbed()
    .setColor("#FCBA03")
    .setTitle("Roll guide")
    .setFooter("Autodespawns in 60 Sec")
    .addFields(
        {name: "How to play",value: "This is a 10000 sided dice game, you attempt to guess what number the dice lands on, you make a prediction by typing ```!wur roll <more/less> <number> <bet>``` this bets a certain amount on the dice rolling less or more than the number"},
        {name: "Payouts",value: "the lower the odds on the your prediction being right the higher your potential win is"}
    );
    message.channel.send({embeds: [embed]}).then(msgembed => {
        setTimeout(() => msgembed.delete(),60000)
        message.delete().catch(() => console.log("Error Deleting Msg ID4003"))
    })
}
module.exports = {
    roll,
    help,
    confirmRoll,
    validateInput
}
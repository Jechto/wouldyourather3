const {MessageEmbed} = require('discord.js')
const Pgjs = require("./pg.js");
const Profile = require("./profile.js");


Reactions = new Map()

async function wouldYouRather(interaction) {

    channeltosendin = interaction.channel

    r = await Pgjs.query('SELECT "Question","Ranking" FROM "Questions" ORDER BY random() LIMIT 1')
    questionA = r.rows[0]
    r2 = await Pgjs.query('SELECT "Question","Ranking" FROM "Questions" ORDER BY abs("Ranking"-$1) OFFSET random()*5+1 LIMIT 1',[questionA.Ranking])
    questionB = r2.rows[0]

    cfg = 30
    msgstay = 0
    r3 = await Pgjs.query('SELECT "Value" FROM "ServerConfig" WHERE "Config"=\'despawn\' AND "ServerID"=$1',[interaction.guildId])
    if (r3.rows.length == 1) {
        cfg = r3.rows[0].Value
    }
    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Would you rather").addFields([
        {name: "🅰",value: "```"+questionA.Question+"```"},
        {name: "🅱",value: "```"+questionB.Question+"```"}
    ]).setFooter("React Below - Autodeletes in "+cfg+"sec")
    //console.log(embed)
    if (typeof interaction.isCommand !== "undefined") {
        await interaction.reply({embeds: [embed]})
        await interaction.fetchReply().then(reply => reply.react("🅰").then(() => reply.react("🅱"))) // works for first interactions
        interaction.fetchReply().then(reply => {
            if (cfg != -1) {
                setTimeout(() => {
                    QuestionA = reply.embeds[0].fields[0].value.replaceAll('```','');
                    QuestionB = reply.embeds[0].fields[1].value.replaceAll('```','');
                    CompileAnswers(reply,QuestionA,QuestionB)
                    Reactions.delete(reply.id)
                    reply.delete().catch(() => console.log("Error Deleting Msg ID1003"))
                },(1000*cfg))
            }
        }).catch(() => console.log("Error sending message ID2001"))
    } else {
        channeltosendin.send({embeds: [embed]}).then(msgembed => msgembed.react("🅰").then(() => msgembed.react("🅱").then(() => {
            if (cfg != -1) {
                setTimeout(() => {
                    QuestionA = msgembed.embeds[0].fields[0].value.replaceAll('```','');
                    QuestionB = msgembed.embeds[0].fields[1].value.replaceAll('```','');
                    CompileAnswers(msgembed,QuestionA,QuestionB)
                    Reactions.delete(msgembed.id)
                    msgembed.delete().catch(() => console.log("Error Deleting Msg ID1003"))
                },(1000*cfg))
            }
        }))).catch(() => console.log("Error sending message ID2002"))
    }
}

async function offsyncWouldYouRather(client,q) {

    channeltosendin = client.channels.cache.get(q.ChannelID)
    if (channeltosendin === undefined) {
        console.log("False")
        Pgjs.query('UPDATE "WurQueue" SET "FailedAttempts"="FailedAttempts"+1 WHERE "ID"=$1',[q.ID])
        return
    }
    console.log("Channel Valid - Attempting Send")
    r = await Pgjs.query('SELECT "Question","Ranking" FROM "Questions" ORDER BY random() LIMIT 1')
    questionA = r.rows[0]
    r2 = await Pgjs.query('SELECT "Question","Ranking" FROM "Questions" ORDER BY abs("Ranking"-$1) OFFSET random()*5+1 LIMIT 1',[questionA.Ranking])
    questionB = r2.rows[0]
    //console.log(questionA)
    //console.log(questionB)
    cfg = 30
    msgstay = 0
    r3 = await Pgjs.query('SELECT "Value" FROM "ServerConfig" WHERE "Config"=\'despawn\' AND "ServerID"=$1',[q.ServerID])
    if (r3.rows.length == 1) {
        cfg = r3.rows[0].Value
    }
    let embed = new MessageEmbed().setColor("#FCBA03").setTitle("Would you rather").addFields([
        {name: "🅰",value: "```"+questionA.Question+"```"},
        {name: "🅱",value: "```"+questionB.Question+"```"}
    ]).setFooter("React Below - Autodeletes in "+cfg+"sec")
    channeltosendin.send({embeds: [embed]}).then(msgembed => msgembed.react("🅰").then(() => msgembed.react("🅱").then(() => {
        if (cfg != -1) {
            setTimeout(() => {
                QuestionA = msgembed.embeds[0].fields[0].value.replaceAll('```','');
                QuestionB = msgembed.embeds[0].fields[1].value.replaceAll('```','');
                CompileAnswers(msgembed,QuestionA,QuestionB)
                Reactions.delete(msgembed.id)
                msgembed.delete()
            },(1000*cfg))
        }
    }))).catch(() => {
        console.log("Error sending message ID2002")
        Pgjs.query('UPDATE "WurQueue" SET "FailedAttempts"="FailedAttempts"+1 WHERE "ID"=$1',[q.ID])
    })

    t = Math.floor(Date.now() / 1000)
    newPostTime = parseInt(q.PostTime)
    console.log("True -- Updating Repeating Message")
    if (parseInt(q.Delay) <= 0) {
        return
    }
    while(newPostTime < t) {
        newPostTime += parseInt(q.Delay);
    }
    console.log("Final")
    Pgjs.query('UPDATE "WurQueue" SET "PostTime"=$1,"FailedAttempts"=0 WHERE "ID"=$2',[newPostTime,q.ID])
    return
}


async function processAnswer(emoji,message,user) {
    servid = message.guild.id

    if (Reactions.has(message.id)) {
        exist = false;

        Reactions.get(message.id).forEach(e => {
            if (e.user == user) {
                exist = true
            }
        })
        if (exist) {return}
        // Add user to list
        r = Reactions.get(message.id)
        r.push({"user": user, "react": emoji})
        Reactions.set(message.id, r)
    } else {
        Reactions.set(message.id, [{"user": user, "react": emoji}])
    }
    stay = 0
    r1 = await Pgjs.query('SELECT "Value" FROM "ServerConfig" WHERE "Config"=\'msgstay\' AND "ServerID"=$1',[message.guild.id])
    if (r1.rows.length == 1) {
        stay = r1.rows[0].Value
    }
    if (stay == 0) {
        CompileAnswers(message,"","")
        message.delete().catch(() => console.log("Error Deleting Msg ID1002"))
        Reactions.delete(message.id)
    }
}

async function CompileAnswers(message,QuestionA,QuestionB) {
    if (!Reactions.has(message.id)) {return}
    c = 0
    QuestionA = message.embeds[0].fields[0].value.replaceAll('```','');
    QuestionB = message.embeds[0].fields[1].value.replaceAll('```','');
    Reactions.get(message.id).forEach(e => {
        c = c + 1
        console.log(e.user)
        if(e.react == "A") {
            AddPoints(e.user,e.react,QuestionA,QuestionB)
        }
        if(e.react == "B") {
            AddPoints(e.user,e.react,QuestionA,QuestionB)
        }
    })
    if (c >= 1) {
        wouldYouRather(message)
    } else {
    }
}

async function AddPoints(user,emoji,A,B) {
    Profile.create(user);
    console.log("A:"+A)
    console.log("B:"+B)
    r1 = await Pgjs.query('SELECT "Question","Ranking" FROM "Questions" WHERE "Question" in ($1,$2);',[A,B])
    if (r1.rows.length != 2) {return}
    Arank = 0
    Brank = 0
    console.log(r1.rows)
    r1.rows.forEach(r => {
        if (A == r.Question) {
            Arank = r.Ranking
        } else if (B == r.Question) {
            Brank = r.Ranking
        }
    })
    console.log("ARank:"+Arank)
    console.log("BRank:"+Brank)
    ts = Math.floor((Date.now()/1000) - 86400)
    r4 = await Pgjs.query('SELECT count(*) FROM "UserHistory" WHERE "UserID"=$1 AND "TimestampAnswered" > $2 AND "ApplyToMultiplier"=1',[user.id,ts])
    r3 = await Pgjs.query('SELECT "XP" FROM "Users" WHERE "UserID"=$1',[user.id])
    level = Profile.XPtoLevel(r3.rows[0].XP)
    K = 50*Math.pow(0.95,parseInt(r4.rows[0].count));
    xp = K;
    selectedQuestion = ''

    console.log("XP: +"+xp+" Coins: "+(xp*level)+" UUID: "+user.id)
    if (emoji == "A") {
        Arank = Elo(Arank,Brank,K,1)
        Brank = Elo(Brank,Arank,K,0)
        selectedQuestion = Arank

        Pgjs.query('UPDATE "Questions" SET "Ranking"=$1,"Pickcount"="Pickcount"+1 WHERE "Question"=$2',[Arank,A])
        Pgjs.query('UPDATE "Questions" SET "Ranking"=$1,"NotPickcount"="NotPickcount"+1 WHERE "Question"=$2',[Brank,B])

    } else if (emoji == "B") {
        Arank = Elo(Arank,Brank,K,0)
        Brank = Elo(Brank,Arank,K,1)
        selectedQuestion = Brank

        Pgjs.query('UPDATE "Questions" SET "Ranking"=$1,"NotPickcount"="NotPickcount"+1 WHERE "Question"=$2',[Arank,A])
        Pgjs.query('UPDATE "Questions" SET "Ranking"=$1,"Pickcount"="Pickcount"+1 WHERE "Question"=$2',[Brank,B])
    }

    Pgjs.query('INSERT INTO "UserHistory"("UserID", "TimestampAnswered", "DilemmaAnswered", "Letter", "ApplyToMultiplier") VALUES ($1,$2,$3,$4,$5)',[user.id,Math.floor(Date.now()/1000),selectedQuestion,emoji,1])
    Pgjs.query('UPDATE "Users" SET "XP"="XP"+$1,"Coins"="Coins"+$2,"DilemmasAnswered"="DilemmasAnswered"+1,"Username"=$3,"Picture"=$4 WHERE "UserID"=$5',[Math.floor(xp),Math.floor(xp*level),user.username,user.displayAvatarURL({ format: 'png' }),user.id])
}

function Elo(RankOne,RankTwo, K, Win) {
    EA = 1/(1+Math.pow(10,(RankOne-RankTwo)/4000));
    RA = parseInt(RankOne) + parseInt(K*(Win-EA));
    return RA;
}
function getRandomInt(min,max) {
    r = Math.random()
    console.log(r)
    return Math.floor(r * max + min);
}

module.exports = {
    wouldYouRather,
    processAnswer,
    offsyncWouldYouRather,
}

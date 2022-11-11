const {MessageEmbed, MessageAttachment} = require('discord.js')
const Pgjs = require("./pg.js");
console.log("PROFILE")
//const wurmain = require("./wur3.js");
//const { createCanvas, loadImage } = require('canvas');
console.log("PROFILE")
const { path } = require('express/lib/application');
console.log("PROFILE")

async function create(user) {
    r1 = await Pgjs.query('SELECT "UserID" FROM "Users" WHERE "UserID"=$1',[user.id])
    if (r1.rows.length == 0) {
        await Pgjs.query('INSERT INTO "Users"("UserID","Username","XP","DilemmasAnswered","Coins","Picture") VALUES ($1,$2,$3,$4,$5,$6)',[user.id,user.username,0,0,0,user.displayAvatarURL({ format: 'png' })])
        console.log("User Created")
    } else {
        await Pgjs.query('UPDATE "Users" SET "Picture"=$1 WHERE "UserID"=$2',[user.displayAvatarURL({ format: 'png' }),user.id])
    }
}

async function display(interaction) {
    canvas = createCanvas(750, 150)
    ctx = canvas.getContext('2d')
    
    r1 = await Pgjs.query('SELECT "XP","DilemmasAnswered","Coins" FROM "Users" WHERE "UserID"=$1',[interaction.member.id])

    xp = r1.rows[0].XP
    dilans = r1.rows[0].DilemmasAnswered
    coins = r1.rows[0].Coins
    level = 1
    xpToLevel = 250
    xpLeft = xp
    while(xpToLevel < xpLeft) {
        if (xpToLevel <= xpLeft) {
            xpLeft = xpLeft - xpToLevel
            xpToLevel = xpToLevel+(50*level)
            level = level + 1
        }
    }
    // ------------- //

    bgimage = await loadImage('images/WurBG.png')
    ctx.drawImage(bgimage,0, 0,750,150)

    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(10, 10, canvas.width-20, canvas.height-20)

    icon = await loadImage(interaction.member.displayAvatarURL({ format: 'png' }))
    ctx.drawImage(icon,10,10,canvas.height-20,canvas.height-20)

    ctx.font = 'bold 40px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(interaction.user.username, canvas.height+10, 55);

    ctx.font = 'bold 20px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText("Level: "+level, canvas.height+10,90);
    ctx.fillText("XP: "+xp, canvas.height+140,90);

    ctx.fillStyle="#000000"
    ctx.fillRect(canvas.height+10,95,560,25)
    ctx.fillStyle="#00CC00"
    process = xpLeft/xpToLevel 
    ctx.fillRect(canvas.height+10,95,560*process,25)

    ctx.fillStyle = '#FFFFFF'
    xpbar = Math.floor(xpLeft)+"/"+Math.floor(xpToLevel);
    ctx.fillText(xpbar,610,115)

    coin = await loadImage("images/Wurcoin.png")
    ctx.font = 'bold 28px Arial'
    ctx.drawImage(coin,canvas.width-65,25,30,30)
    ctx.fillText(coins,canvas.width-70-(coins.length*20),50)

    attachment = new MessageAttachment(canvas.toBuffer(),'temp.png')
    interaction.reply({files: [attachment]})
    interaction.fetchReply().then(reply => setTimeout(() => reply.delete(),20000))
}

async function safeLoadImage(f) {
    try {
        i = await loadImage(f)
        console.log("Loaded Img")
        return i
    } catch(err) {
        console.log("Error Loading Image")
        i = await loadImage('https://cdn.discordapp.com/embed/avatars/0.png')
        return i
    }
}


async function leaderboard(interaction,page) {
    await interaction.deferReply();
    r1 = await Pgjs.query('SELECT "UserID","Username","XP","Picture" FROM "Users" ORDER BY "XP" DESC LIMIT 10 OFFSET $1*10',[page])
    r2 = await Pgjs.query('SELECT "UserID","Username","XP","Picture" FROM "Users" ORDER BY "XP" DESC')
    row = 0
    userdata = {}
    r2.rows.forEach(r => {
        row = row + 1
        if (r.UserID == interaction.member.id) {
            r["rank"] = row;
            userdata = r
            console.log(r)
        }
    })

    canvas = createCanvas(750, 450)
    ctx = canvas.getContext('2d')

    bgimage = await loadImage('images/WurBG.png')


    row = 0
    filepaths = []
    r1.rows.forEach(async r => {
        console.log(r["Picture"])
        filepaths.push(r["Picture"])
        row = row + 1
    })

    row = 0
    r1.rows.forEach(async r => {
        createLBrow(canvas,bgimage,row,((row+1)+(page*10)),r)
        row = row + 1
    })

    row = 0
    for await (const img of filepaths.map(f => safeLoadImage(f))) {
        ctx.drawImage(img,2,2+row*35,31,31)
        row = row + 1
    }
    ctx.fillStyle = '#37393E'
    ctx.fillRect(0,350,canvas.width,35)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 22px Arial'
    ctx.fillText("Your XP (Top "+(Math.floor(userdata.rank/r2.rows.length*10000)/100)+"%)",10,375)
    createLBrow(canvas,bgimage,11,userdata.rank,userdata)
    console.log("Loading users image")
    img = await safeLoadImage(userdata["Picture"])
    ctx.drawImage(img,2,2+11*35,31,31);


    attachment = new MessageAttachment(canvas.toBuffer(),'temp.png')
    await interaction.editReply({files: [attachment]})
    setTimeout(() => {
        interaction.deleteReply()
    },60000)
}

function createLBrow(canvas,bgimage,row,rank,r) {
    ctx.font = '22px Arial'
    ctx.drawImage(bgimage,0,row*35,canvas.width,35)
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(2, 2+row*35, canvas.width-4, 35-4)

    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(rank+" : "+r.Username,40, 25+row*35)
    ctx.fillText(r.XP+" XP",620,25+row*35)

    ctx.fillStyle = '#FCBA03'
    ctx.fillRect(550,6+row*35, 60, 22)
    ctx.font = '16px Arial'
    ctx.fillStyle = '#000000'
    ctx.fillText("Lvl: "+XPtoLevel(r.XP),550+5,25+row*35)
    //u = wurmain.getUser(r.UserID)
    //icon = await loadImage(u.displayAvatarURL({ format: 'png' }))
    //ctx.drawImage(icon,0,row*35,30,30)

}

function XPtoLevel(xp) {
    level = 1
    xpToLevel = 250
    xpLeft = xp
    while(xpToLevel < xpLeft) {
        if (xpToLevel <= xpLeft) {
            xpLeft = xpLeft - xpToLevel
            xpToLevel = xpToLevel+(50*level)
            level = level + 1
        }
    }
    return level
}

module.exports = {
    display,
    leaderboard,
    XPtoLevel,
    create
}
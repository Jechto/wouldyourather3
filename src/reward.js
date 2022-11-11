const pgjs = require("./pg.js");

async function PayUser(user, text, amount) {
    console.log("paying "+user.id+" "+amount)
    await pgjs.query("UPDATE Users SET Coins=Coins+$1 WHERE UserID=$2",[amount,user.id])
}
async function GiveXP(user,amount) {
    console.log("awarding "+user.id+" "+amount+"xp")
    await pgjs.query("UPDATE Users SET XP=XP+$1 WHERE UserID=$2",[amount,user.id])
}

module.exports = {
    PayUser,
    GiveXP
}
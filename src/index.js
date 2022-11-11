const isProd = true
var manager
console.log("START")
const { ShardingManager } = require('discord.js');
console.log("START")
if (isProd) {
  manager = new ShardingManager('./wur3.js', { token: '' }); // Prod Bot token
} else {
  manager = new ShardingManager('./wur3.js', { token: '' }); // Test Bot token
}
console.log("START")
manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
manager.spawn();

// Topgg token
tgg = ""

console.log("START")
const { AutoPoster } = require('topgg-autoposter')
const ap = AutoPoster(tgg, manager)
const Topgg = require("@top-gg/sdk")
console.log("START")
const express = require("express")
const app = express()
console.log("START")
const webhook = new Topgg.Webhook(tgg)
const Pgjs = require("./pg.js");
console.log("START")
const Profile = require("./profile.js")
console.log("START")

if (isProd) {
  ap.on('posted', () => {
    console.log('Posted stats to Top.gg!')
  })
  app.post("/dblwebhook", webhook.listener(async vote => {
      console.log("Someone Voted")
      console.log(vote)
      console.log(vote.user)
      r1 = await Pgjs.query('SELECT "XP" FROM "Users" WHERE "UserID"=$1',[vote.user])
      xp = r1.rows[0].XP
      coins = Profile.XPtoLevel(xp)*750
      Pgjs.query('INSERT INTO "Votes"("Timestamp", "UserID") VALUES ($1,$2)',[Math.floor(Date.now()/1000),vote.user]);
      Pgjs.query('UPDATE "Users" SET "Coins"="Coins"+$1 WHERE "UserID"=$2',[coins,vote.user]);
  }))
  app.listen(5001, () => {
      console.log(`Example app listening at http://localhost:5001`)
  })
}
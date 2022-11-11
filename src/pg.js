const  PgClient  = require('pg')
var pg = new PgClient.Client({ // Conn string for Docker
    host: 'host.docker.internal',
    port: 5432,
    user: 'postgres',
    password: '[password]',
    database: 'wur'
  })
var pgalt = new  PgClient.Client({ // Conn string for dev env
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '[password]',
    database: 'wur'
  })

async function query(q,param) {
    if (param == undefined) {
        return new Promise(resolve => {
            pg.query(q, (err, res) => {
                if (err) {
                    console.log(err)
                    resolve([]);
                }else{
                    resolve(res);
                }
            })
        })
    } else {
        return new Promise(resolve => {
            pg.query(q, param, (err, res) => {
                if (err) {
                    console.log("ERROR")
                    //console.log(err)
                    console.log("QUERY")
                    console.log(q)
                    console.log(param)
                    console.log(err)
                    resolve([]);
                }else{
                    resolve(res);
                }
            })
        })
    }
}

pg.connect(function(err) {
    if (err) {
        console.log("Err");
        pg = pgalt;
        pg.connect(function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Connected!");
            }
        });
    } else {
        console.log("Connected!");
    }
});

module.exports = {
    query
}

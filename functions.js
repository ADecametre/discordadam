module.exports={

/* fle:{
  req: (from, to) => {
    const http = require('https');
    const fs = require('fs');
    const file = fs.createWriteStream(to);
    const request = http.get(from, response => {
      response.pipe(file);
    });
  },
  out: to => {
    //requireWithoutCache("./"+to, require);
    const fs = require("fs");
    fs.readFile('./'+to, 'utf8', (error, data) => {
      if (error)
        throw error;
      console.log(data);
    });
  }
}
(from, to=null) => {
  return new Promise((resolve, reject) => {
    request(from, (error, response, body) => {
      resolve(body);
    });
  });
} */
nll:val=>{
  if(typeof(val) == undefined || val==null || val==""){
    return true;
  }else{
    return false;
  }
},
wfile:(to,txt)=>{
  return new Promise((resolve, reject) => {
	  const fs = require('fs');
    fs.writeFile(to, txt, (err) => {
      if (err) err_rep("wfile",err).then(value=>{resolve(value);});
      resolve();
    });
  });
},
rfile:from=>{return new Promise((resolve, reject) => {
  const fs = require('fs');
  fs.readFile(from, 'utf8', (err,data) => {
    if (err) err_rep("wfile",err).then(value=>{resolve(value);});
    resolve(data);
  });
})},
err_rep:(place,err)=>{
  return new Promise((resolve, reject) => {
	  const fs = require('fs');
    const rand=require("randomstring");
    var moment = require('moment-timezone');
    let code = rand.generate(5);
    let time=moment().tz("America/Toronto").format("DD/MM/YY HH:mm");
    let txt = 'Code : '+code+'\nDate : '+time+'\nLieu : '+place+'\nErreur : '+err.stack;
    fs.writeFile('errors/'+code+'.txt', txt, (err) => {
      if (err) throw err;
      console.error(txt);
      resolve('<@'+process.env.moderator+'> :confused:\nUne erreur s\'est produite.\nCode d\'erreur : '+code);
    });
  });
},
sql:async (sql)=>{
  return new Promise((resolve, reject) => {
    con.query(sql, function (err, rows, fields) {
      if (err) module.exports.err_rep("sql-query",err).then(value=>{resolve(value);});
      resolve(rows);
    });
  });
},
getPos : (string, subString, index) => string.split(subString, index).join(subString).length,
getNum : string => { if(string.match(/\d+/g)){return parseInt(string.match(/\d+/g).map(Number).join(""))}else{ return null; } }

};

  const mysql = require('mysql');
  function sql_con() {
    con = mysql.createConnection({
      host: process.env.sql_host,
      user: process.env.sql_user,
      password: process.env.sql_password,
      database: process.env.sql_user
    });

    con.connect(function(err) {
      if(err) {
        console.log('Error when connecting to DB : ', err);
        setTimeout(sql_con, 2000);
      }
      console.log("Reconnecting to DB.");
    });
    
    con.on('error', function(err) {
      console.log('DB error : ', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        sql_con();
      } else {
        module.exports.err_rep("sql-connect",err).then(value=>{resolve(value);});
      }
    });
  }

  sql_con();
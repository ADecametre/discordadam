const Discord = require('discord.js');
const bot = new Discord.Client();
// require('dotenv').config();
const f = require('./functions.js');
const req = require('request-promise');
const { resolve } = require('path');
const moment = require('moment-timezone');
const momFormat = require("moment-duration-format");
//const { sql } = require('./functions.js');
// var requireWithoutCache = require('require-without-cache');
// f.rfile('./cache/prefix.txt').then(data=>{console.log('H:'+data);global.pref = data;});

setInterval(() => {
	console.log("Checking interval started");

	let d=moment().tz("America/Toronto").format("DD/MM");
	momFormat(moment);
	let h=moment().tz("America/Toronto").format("HH:mm");
	f.sql("SELECT `uid`, `server` FROM `bday` WHERE `done` = 0 && `date` LIKE '"+d+"%'")
		.then(rows => {
			if(rows[0]){
										for (let x = 0; x < rows.length; x++) {
				// f.sql("SELECT `bday_channel`, `bday_hour`, `bday_message` FROM `vars` WHERE `server` = '"+rows[x].server+"'")
					// .then(rows2 => {
						if(v[rows[x].server]){
							let d_diff = moment.duration( moment(h,"HH:mm").diff(moment(v[rows[x].server].bday_hour,"HH:mm")) ).format("m").replace(/,/g, "");

							if (-5 <= d_diff && d_diff <= 55) {
								let gu = bot.guilds.cache.find(guild => guild.id == rows[x].server) || null;
								if(gu){
									let ch = gu.channels.cache.find(channel => channel.id == v[rows[x].server].bday_channel) || null;
									if (ch) {
											f.sql("UPDATE `bday` SET `done`=1 WHERE `uid`='"+rows[x].uid+"' AND `server`='"+rows[x].server+"'")
												.then(()=>{
													ch.send(v[rows[x].server].bday_message.replace(/<@someone>/g,"<@!"+rows[x].uid+">"));
												})
									}
								}
							}
						}
					// })
										}
			}
		});
		f.sql("SELECT `uid`, `server`, `date` FROM `bday` WHERE `done` = 1")
			.then(rows => {
				if(rows[0]){
					for (let x = 0; x < rows.length; x++) {
						let d_diff = moment.duration( moment(d,"DD/MM").diff(moment(rows[x].date,"DD/MM")) ).format("d").replace(/,/g, "");
						if (d_diff >= 1) {
							f.sql("UPDATE `bday` SET `done`=0 WHERE `uid`='"+rows[x].uid+"' AND `server`='"+rows[x].server+"'")
						}
					}
				}
				
			});
}, 10*60*1000);

bot.on('message', message=>{
	let s = message.guild.id;
	if(!f.nll(v[s])){
		let args=message.content.substring(v[s].pref.length).replace(/'/g, "\\'").split(" ");
		let larg=pre=>{return message.content.substring(message.content.indexOf(args[pre]))}
		if(message.content.includes(process.env.bot)){
			args = ['help'];
		}
		switch(args[0]){
			case 'help':
				let file = [new Discord.MessageAttachment('./images/help.png', 'help.png'), new Discord.MessageAttachment('./images/info_sm.png', 'info_sm.png')];
				let mess = new Discord.MessageEmbed()
					.setColor('#99ff99')
					.setThumbnail('attachment://help.png')
				
				if(!f.nll(args[1])){
					f.sql("SELECT * FROM `help` WHERE `name`='"+args[1]+"' AND `par` IS NULL")
						.then(rows=>{
							if(!f.nll(rows)){
								mess.setTitle("**Aide ‧ "+v[s].pref+rows[0].name+"**")
									.setDescription(rows[0].desc);
								f.sql("SELECT * FROM `help` WHERE `par` LIKE '"+args[1]+"%' ORDER BY `par` ASC")
									.then(rows2=>{
										if(!f.nll(rows2)){
											for(let x=0;x<rows2.length;x++){
												let name=" "+rows2[x].name;
												
												let desc = "\u200B"+rows2[x].desc+'\n';
												if(!f.nll(rows2[x].list)){
													desc+="*";
													let s_list=rows2[x].list.split(";");
													for(let y = 0; y < s_list.length; y++){
														desc+="`"+s_list[y]+"`"
														if(y != s_list.length-1){
															desc += "; ";
														}
													}
													desc+="*\n";
												}
												if(!f.nll(rows2[x].ex)){
													desc+="\u200B*Ex. : ";
													let s_ex=rows2[x].ex.split(";");
													for(let y = 0; y < s_ex.length; y++){
														desc+=" `"+s_ex[y]+"`"
														if(y != s_ex.length-1){
															desc += ";";
														}
													}
													desc+="*\n";
												}
				
												if(x!=0 && x%2==1){
													mess.addField('\u200B','\u200B',true);
												}
												if(x == rows2.length && x%2==0){
													mess.addField('\u200B','\u200B',true);
													mess.addField('\u200B','\u200B',true);
												}
				
												mess.addField(name, desc, true);
											}
										}else{
											mess.addField('\u200B','\u200B',true);
											mess.addField('*Aucun paramètre*', '\u200B',true);
											mess.addField('\u200B','\u200B',true);
										}
										message.channel.send({ files: [file[0]], embed: mess });
									})
							}else{
								mess.addField('\u200B', ':warning: La fonction *`'+args[1]+'`* n\'existe pas.\n\u200B \u200B \u200B <:help:726511256269226046> *`'+v[s].pref+'help`*')
								message.channel.send({ files: [file[0]], embed: mess });
							}
						})
				}else{
					mess.setFooter(v[s].pref+"help commande", "attachment://help.png");
					f.sql("SELECT * FROM `help` WHERE `par` IS NULL ORDER BY `name` ASC")
						.then(rows => {
							mess.setTitle("__**Aide**__");
							for(let x = 0; x < rows.length; x++){
								let name = "**"+v[s].pref+rows[x].name+"**";
								f.sql("SELECT * FROM `help` WHERE `par` LIKE '"+rows[x].name+"%' ORDER BY `par` ASC")
									.then(rows2 => {
										for(let y = 0; y<rows2.length; y++){
											name += " "+rows2[y].name;
										}
										if(x!=0 && x%2==1){
											mess.addField('\u200B','\u200B',true)
										}
										mess.addField(name,"\u200B\u200B "+rows[x].sdesc,true);
										if(x == rows.length-1 && x%2==0){
											mess.addField('\u200B','\u200B',true);
											mess.addField('\u200B','\u200B',true);
										}
										if(x == rows.length-1){
											message.channel.send({ files: [file[0]], embed: mess });
										}
									});
							}
						});
				}
				break;
			case 'passion':
				message.channel.send('C\'est vraiment passionnément passionnant !');
				break;
			case 'zoom':
				/* req('https://BlandInsecureProgramminglanguage--five-nine.repl.co')
					.then((htmlString) => {
						message.channel.send(htmlString);
					})
					.catch((err) => {
						f.err_rep("zoom-req",err).then(value=>{message.channel.send(value);});
					}); */
				break;
			case 'set':
				if(message.member.id==process.env.moderator || message.member.hasPermission("ADMINISTRATOR")){
					if(!f.nll(args[1])){
						switch(args[1]){
							case 'prefix':
								if(!f.nll(args[2])){
									if(larg(2).length>10){
										message.channel.send(":warning: Le préfix ne peut pas être plus long que 10 caractères.")
									}else{
										f.sql("UPDATE `vars` SET `pref`='"+larg(2)+"' WHERE `server`='"+s+"'")
											.then(()=>{
												message.channel.send(":white_check_mark: Préfix changé à *`"+larg(2)+"`*.");
												global.v[s].pref=larg(2);
											});
									}
								}else{
									message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help set`*");
								}
								break;
							case 'bday_hour':
								if(!f.nll(args[2])){
									if(!larg(2).toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)$/)){
										message.channel.send(":warning: Veuillez entrer l'heure sous le format `HH:MM` (24h).")
									}else{
										f.sql("UPDATE `vars` SET `bday_hour`='"+larg(2)+"' WHERE `server`='"+s+"'")
											.then(()=>{
												message.channel.send(":white_check_mark: Heure d'anniversaire changé à *`"+larg(2)+"`*.");
												global.v[s].bday_hour=larg(2);
											});
									}
								}else{
									message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help set`*");
								}
								break;
							case 'bday_channel':
								if(!f.nll(args[2])){
									if( message.guild.channels.cache.find(channel => channel.id == f.c_mention(args[2])[1]) ){
										f.sql("UPDATE `vars` SET `bday_channel`='"+f.c_mention(args[2])[1]+"' WHERE `server`='"+s+"'")
										.then(()=>{
											message.channel.send(":white_check_mark: Salon changé à "+args[2]+".");
											global.v[s].bday_channel=f.c_mention(args[2])[1];
										});
									}else if( message.guild.channels.cache.find(channel => channel.name == args[2]) ){
										let ch = message.guild.channels.cache.find(channel => channel.name == args[2])
										f.sql("UPDATE `vars` SET `bday_channel`='"+ch.id+"' WHERE `server`='"+s+"'")
											.then(()=>{
												message.channel.send(":white_check_mark: Salon changé à <#"+ch.id+">.");
												global.v[s].bday_channel=ch.id;
											});
									}else{
										message.channel.send(":warning: Nom de salon invalide.")
									}
									
								}else{
									message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help set`*");
								}
								break;
							case 'bday_message':
								if(!f.nll(args[2])){
									if(larg(2).length <= 500){
										if(args[2] == "default"){
											f.sql("UPDATE `vars` SET `bday_message`=DEFAULT(`bday_message`) WHERE `server`='"+s+"'")
												.then(()=>{
													f.sql("SELECT DEFAULT(`bday_message`) AS `default` FROM `vars`")
														.then(rows => {
															message.channel.send(":white_check_mark: Message d'anniversaire modifié.");
															global.v[s].bday_message = rows[0].default;
														});
												});
										}else{
											f.sql("UPDATE `vars` SET `bday_message`='"+larg(2).replace(/'/g,"\\'")+"' WHERE `server`='"+s+"'")
												.then(()=>{
													message.channel.send(":white_check_mark: Message d'anniversaire modifié.");
													global.v[s].bday_message=larg(2);
												});
										}
									}else{
										message.channel.send(":warning: Le message ne peut pas être plus long que 500 caractères.")
									}
								}else{
									message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help set`*");
								}
								break;
							default:
								message.channel.send(":warning: Le paramètre *`"+args[1]+"`* n'existe pas.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help set`*");
						}
					}else{
						message.channel.send("<:info:725144790915743754> Veuillez préciser le paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help set`*");
					}
				}else{
					message.channel.send(':warning: Vous n\'avez pas la permission de modifier les paramètres.');
				}
				break;
			case 'suggest':
				if(!f.nll(args[1])){
					if(args[1].length>1000){
						message.channel.send(":warning: La suggestion ne peut pas être plus longue que 1000 caractères.")
					}else{
						// var moment = require('moment-timezone');
						let d=moment().tz("America/Toronto").format("DD/MM/YY HH:mm:ss");
						f.sql("INSERT INTO `suggest`(`name`, `uid`, `date`, `sug`) VALUES ('"+message.member.user.tag+"','"+message.member.id+"','"+d+"','"+larg(1)+"')")
							.then(()=>{
								message.channel.send(":white_check_mark: Suggestion envoyée à <@!"+process.env.moderator+">.");
							});
					}
				}else{
					message.channel.send("<:info:725144790915743754> Veuillez indiquer votre suggestion.\n\u200B \u200B \u200B *`"+v[s].pref+"help suggest`*");
				}
				break;
			case 'about':
				// var moment = require('moment-timezone');
				let d=moment().tz("America/Toronto").format("DD/MM/YY HH:mm");

				let nv = new Array;
				if(f.nll(args[1])){
					for(let x=2;x>=0;x--){
						nv[x]=false;
					}
				}else{
					let v = args[1].split('.');
					for(let x=2;x>=0;x--){
						nv[x]=!f.nll(v[x]);
					}
				}

				let fv;
				if(nv[2]){ // avec ssv
					fv = 2;
					fv1 = 1;
					query="SELECT * FROM `about` WHERE `id`='"+args[1]+"' AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` ASC LIMIT 6";
				}else if(nv[1]){ // avec sv
					fv = 2;
					fv1 = 0;
					query="SELECT * FROM `about` WHERE `id` LIKE '"+args[1]+"%' AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` ASC LIMIT 6";
				}else if(nv[0]){ // avec v
					fv = 0;
					fv1 = 1;
					query="SELECT * FROM `about` WHERE `id` LIKE '"+args[1]+"%' AND `id` LIKE '%.0' AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` ASC LIMIT 6";
				}else{ // avec rien
					fv = 2;
					fv1 = 0;
					query = "SELECT * FROM `about` WHERE `id` LIKE CONCAT( SUBSTRING_INDEX( (SELECT `id` FROM `about` WHERE STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` DESC LIMIT 1) ,'.',2), '%' ) AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` ASC LIMIT 6";
					// query = "SELECT * FROM `about` WHERE STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` DESC LIMIT 1";
				}

				f.sql(query)
					.then( rows => {
						if(!f.nll(rows) && rows.constructor !== Array){
							message.channel.send(rows);
						}else if(!f.nll(rows[0])){
							bot.users.fetch(process.env.moderator).then(mod => {
								bot.users.fetch(process.env.bot).then(bot => {
									momFormat(moment);
									let d_diff = moment.duration( moment(d,"DD/MM/YY HH:mm").diff(moment(rows[0].date,"DD/MM/YY HH:mm")) );
									let d_form;
									if(d_diff.format("M").replace(/,/g, "") >= 6){
										d_form = rows[0].date.substr(0,6)+"20"+rows[0].date.substr(6,2);
									}else if(d_diff.format("d").replace(/,/g, "") >= 7){
										d_form = parseInt( rows[0].date.substr(0,2) ) + " " + f.abv_month[ parseInt(rows[0].date.substr(3,2)) ]
									}else if(d_diff.format("h").replace(/,/g, "") >= 24){
										d_form = d_diff.format("d") + "j"
									}else if(d_diff.format("m").replace(/,/g, "") >= 60){
										d_form = d_diff.format("h") + "h"
									}else if(d_diff.format("s").replace(/,/g, "") >= 60){
										d_form = d_diff.format("m") + " min"
									}else if(d_diff.format("s").replace(/,/g, "") < 60){
										d_form = "Quelq. sec."
									}

									let mess = new Discord.MessageEmbed()
										.setColor('#99ff99')
										.setTitle('Version ' + rows[0].id.substr(0, f.getPos(rows[0].id, '.', fv+fv1)) + " ‧ *" + d_form + "*")
										.setURL()
										.setAuthor(bot.username, null, 'http://a-decametre.tk')
										.setDescription(rows[0].info)
										.setThumbnail(bot.avatarURL())
										/* .addFields(
											{ name: 'Regular field title', value: 'Some value here' },
											{ name: '\u200B', value: '\u200B' },
											{ name: 'Inline field title', value: 'Some value here', inline: true },
											{ name: 'Inline field title', value: 'Some value here', inline: true },
										)
										.addField('Inline field title', 'Some value here', true)
										.setImage(bot.avatarURL())
										.setTimestamp() */
										.setFooter(mod.username+'#'+mod.discriminator+'\n', mod.avatarURL());

									for(let x = rows.length-1;x>0;x--){
										momFormat(moment);
										let d_diff = moment.duration( moment(d,"DD/MM/YY HH:mm").diff(moment(rows[x].date,"DD/MM/YY HH:mm")) );
										let d_form;
										if(d_diff.format("M").replace(/,/g, "") >= 6){
											d_form = rows[0].date.substr(0,6)+"20"+rows[0].date.substr(6,2);
										}else if(d_diff.format("d").replace(/,/g, "") >= 7){
											d_form = parseInt( rows[0].date.substr(0,2) ) + " " + f.abv_month[ parseInt(rows[0].date.substr(3,2)) ]
										}else if(d_diff.format("h").replace(/,/g, "") >= 24){
											d_form = d_diff.format("d") + "j"
										}else if(d_diff.format("m").replace(/,/g, "") >= 60){
											d_form = d_diff.format("h") + "h"
										}else if(d_diff.format("s").replace(/,/g, "") >= 60){
											d_form = d_diff.format("m") + " min"
										}else if(d_diff.format("s").replace(/,/g, "") < 60){
											d_form = "Quelq. sec."
										}
										mess.addFields(
											{ name: '\u200B', value: '\u200B', inline: true },
											{ name: '.'+rows[x].id.split('.')[fv] + " ‧ *" + d_form + "*", value: rows[x].info, inline: true },
											{ name: '\u200B', value: '\u200B', inline: true }
										);
									}

									message.channel.send(mess);
								});
							});
						}else{
							message.channel.send(':warning: La version *`'+args[1]+'`* n\'existe pas.\n\u200B \u200B \u200B <:help:726511256269226046> *`'+v[s].pref+'about`*');
						}
					})
					.catch(err => {
						f.err_rep("about-req",err).then(value=>{message.channel.send(value);});
					});
				break;
			case 'poll':
				message.fetch({limit:1}).then(msg=>{ setTimeout(()=>{msg.delete();return;},10000); });
				let mess2 = new Discord.MessageEmbed()
					.setColor('#99ff99')
					.setAuthor(message.author.username+'#'+message.author.discriminator+'\n', message.author.avatarURL());

				let str = larg(1);
				let char;
				let e = false;

				for( let x = 0; true; x++ ){
					if(x == 0){
						char = ["{","}"];
					}
					let op = str.indexOf(char[0]);
					let clo = str.indexOf(char[1]);
					let sub = str.substring(op+1,clo);

					if( op != -1 && clo != -1 ){
						if(!f.nll(sub)){
							if(x == 0){
								mess2.setTitle(sub);
								char = ["[","]"];
							}else{
								mess2.addField(":regional_indicator_"+f.alph[x]+": "+sub, '\u200B', true);
							}
						}else{
							e = true;
							if(x == 0){
								message.channel.send(":warning: Le titre ne peut pas être vide.").then(msg2=>setTimeout(()=>{msg2.delete()},5000));
							}else{
								message.channel.send(":warning: Les options ne peuvent pas être vides.").then(msg2=>setTimeout(()=>{msg2.delete()},5000));
							}
						}
					}else{
						if(e == false){
							if(x <= 2){
								message.channel.send("<:info:725144790915743754> Veuillez indiquer un titre et au moins deux options.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help poll`*").then(msg2=>setTimeout(()=>{msg2.delete()},5000));
							}else if(x > 20){
								message.channel.send(":warning: Il ne peut pas y avoir plus de 20 options.").then(msg2=>setTimeout(()=>{msg2.delete()},5000));
							}else{
								message.channel.send(mess2).then(sentEmbed => {
									for( y = 1; y < x; y++ ){
										sentEmbed.react(f.e_alph[y]);
									}
								});
							}
						}
						break;
					}

					str = str.substring(clo+1);
					
				}
				break;
			case 'bday':
				if(!f.nll(v[s].bday_channel)){
					if(!f.nll(args[1])){
						if(f.nll(args[2])){
							args[2] = args[1];
							args[1] = '<@!'+message.member.id+'>';
						}
						if(!f.nll(args[2])){
							let mem = message.guild.members.cache.find(member => member.id == f.u_mention(args[1])[1] || member.user.username == args[1].replace(/([^\\])(_)/g,'$1 ').replace(/\\/g,'') || member.nickname == args[1].replace(/([^\\])(_)/g,'$1 ').replace(/\\/g,'')) || null;
							if (mem){
								// if(args[2].match(/^(0[1-9]|[1-2]\d|3[0-1])(\/)(0[1-9]|1[0-2])((\/)(19\d\d|20\d\d))?$/)){
								// var moment = require('moment-timezone');
								if(args[2].match(/^(0[1-9]|[1-2]\d|3[0-1])(\/)(0[1-9]|1[0-2])((\/)(19\d\d|20\d\d))?$/) && moment(args[2], "DD/MM/YYYY").isValid()){
									f.sql("SELECT COUNT(*) AS cnt FROM `bday` WHERE `server`='"+s+"' && `uid`='"+mem.id+"'")
										.then(rows => {
											if(rows[0].cnt > 0){
												if(message.member.id == mem.id || message.member.id==process.env.moderator || message.member.hasPermission("ADMINISTRATOR")){
													f.sql("UPDATE `bday` SET `uid` = '"+mem.id+"', `server` = '"+message.guild.id+"', `date` = '"+args[2]+"', `done` = 0 WHERE `uid` = '"+mem.id+"' && `server`='"+s+"'")
														.then(()=>{
															nme = mem.nickname || mem.user.username; 
															message.channel.send(":white_check_mark: Anniversaire modifié (*`"+nme+"`* - *`"+args[2]+"`*).");
														});
												}else{
													message.channel.send(':warning: Vous n\'avez pas la permission de modifier l\'anniversaire.');
												}
											}else{
												f.sql("INSERT INTO `bday` (`uid`, `server`, `date`, `done`) VALUES ('"+mem.id+"', '"+message.guild.id+"', '"+args[2]+"', 0);")
													.then(()=>{
														nme = mem.nickname || mem.user.username; 
														message.channel.send(":white_check_mark: Anniversaire ajouté (*`"+nme+"`* - *`"+args[2]+"`*).");
													});
											}
										});
								}else if(args[2] == 'delete'){
									f.sql("SELECT COUNT(*) AS cnt FROM `bday` WHERE `server`='"+s+"' && `uid`='"+mem.id+"'")
										.then(rows => {
											if(rows[0].cnt > 0){
												if(message.member.id == mem.id || message.member.id==process.env.moderator || message.member.hasPermission("ADMINISTRATOR")){
													f.sql("DELETE FROM `bday` WHERE `uid` = '"+mem.id+"' && `server` = '"+s+"'")
														.then(()=>{
															nme = mem.nickname || mem.user.username; 
															message.channel.send(":white_check_mark: Anniversaire supprimé (*`"+nme+"`*).");
														});
												}else{
													message.channel.send(':warning: Vous n\'avez pas la permission de modifier l\'anniversaire.');
												}
											}else{
												nme = mem.nickname || mem.user.username; 
												message.channel.send("<:info:725144790915743754> Aucun anniversaire enregistré (*`"+nme+"`*).");
											}
										});
									
								}else{
									message.channel.send(":warning: Veuillez indiquer votre date sous le format `JJ/MM` ou `JJ/MM/AAAA`.");
								}
							}else{
								message.channel.send(":warning: Nom d'utilisateur incorrect.");
							}
						}else{
							message.channel.send("<:info:725144790915743754> Veuillez préciser la date de naissance.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help bday`*");
						}
					}else{
						message.channel.send("<:info:725144790915743754> Veuillez préciser l'utilisateur ou la date de naissance.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"help bday`*");
					}
				}else{
					message.channel.send("<:info:725144790915743754> Aucun salon d'affichage défini par les modérateurs.\n\u200B \u200B \u200B <:help:726511256269226046> *`"+v[s].pref+"set bday_channel [salon]`*")
				}
				break;
		}
	}
});

f.sql("SELECT * from `vars`")
	.then(rows=>{
		global.v=new Array;
		for(let x = 0 ; x < rows.length ; x++){
			let s = rows[x].server;
			global.v[s]=rows[x];
		}
		bot.on('ready', () =>{
			console.log('Bot A-Decametre.tk prêt !');
		});
	});
bot.login(process.env.token);
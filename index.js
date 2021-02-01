const Discord = require('discord.js');
const bot = new Discord.Client();
// require('dotenv').config();
const f = require('./functions.js');
const req = require('request-promise');
const { resolve } = require('path');
const moment = require('moment-timezone');
const momFormat = require("moment-duration-format");
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({auth:process.env.git_token,timeZone:"America/Toronto"});

sync();
setInterval(sync, 10*60*1000);

bot.on('message', message=>{
	let s = null;
	if(message.guild){
		s = message.guild.id;
	}
	if(!f.nll(v[s])){
		let messages = [];
		let cont = true;
		let repl = str => str.replace(/<pref>/g,v[s].pref).replace(/<@bot>/g,process.env.bot).replace(/<@mod>/g,process.env.moderator).replace(/<@auth>/g,message.author.id);
		
		// INTERACTIONS
		for(let x = 0 ; x < i.length ; x++){

			// Check server
			if(i[x].server){
				if(!( !i[x].server.split(" ").includes("-"+s) && (!i[x].server.split(" ").some(v => v > 0) || i[x].server.split(" ").includes(s)) )){
					continue;
				}
			}

			// Check times
			if(i[x].time){
				let time = new Date().getTime()/1000;
				let incl = false;
				let times = i[x].time.split("&&");
				let regex = [];
				for(let t = 0 ; t < times.length ; t++){
					regex[t] = (/(\d+)?-(\d+)?/).exec(times[t])
					if((!regex[t][1] || Number(time) >= Number(regex[t][1])) && (!regex[t][2] || Number(time) <= Number(regex[t][2]))){
						incl = true;
						break;
					}
				}
				if(!incl){continue}
			}

			// Check RegExp
			if(!( message.content.match(RegExp(repl(i[x].message),"g")) && message.author.id.match(RegExp(repl(i[x].author),"g")) )){
				continue;
			}


				// Send message
				if(i[x].send){
					// Reg Groups
					let sends = repl(i[x].send);
					let num_groups = (new RegExp(repl(i[x].message) + '|')).exec('').length - 1;
					let groups = (new RegExp(repl(i[x].message))).exec(message.content)
					for(let y = 1 ; y <= num_groups ; y++){
						sends = sends.replace(new RegExp("\\$\\{"+y+"\\}","g"), groups[y] || "")
					}
					// Messages
					sends = sends.split(";;;");
					let msg = [];
					for(let y = 0 ; y < sends.length ; y++){
						// Randomise
						if(sends[y].split(";OR;").length > 1){
							msg[y] = sends[y].split(";OR;")[Math.floor(Math.random()*(sends[y].split(";OR;").length))]
						}else{
							msg[y] = sends[y]
						}
						// Send (/Delete self)(Delay)
						if(i[x].delete_self != null){
							setTimeout(()=>message.channel.send(msg[y]).then(msg2=>setTimeout(()=>{msg2.delete()},i[x].delete_self)),i[x].delay)
						}else{
							setTimeout(()=>message.channel.send(msg[y]),i[x].delay)
						}
					}
				}
				// Direct message
				if(i[x].dm){
					let sends = i[x].dm.split(";;;");
					let pmsg = []
					let msg = [];
					for(let y = 0 ; y < sends.length ; y++){
						//Analyse
						pmsg[y] = (/\[\[(.+)\]\]{{(.+)}}/g).exec(repl(sends[y]))
						// Randomise
						msg[y] = [];
						if(pmsg[y]){
							for(z = 1; z <= 2; z++){
								if(pmsg[y][z].split(";OR;").length > 1){
									msg[y][z] = pmsg[y][z].split(";OR;")[Math.floor(Math.random()*(sends[y].split(";OR;").length))]
								}else{
									msg[y][z] = pmsg[y][z]
								}
							}
						}else{
							console.error("Interaction DM could not be sent.1")
						}
						// Send (/Delete self)(Delay)
						if(msg[y] && bot.users.cache.get(msg[y][1])){
							if(i[x].delete_self != null){
								setTimeout(()=>bot.users.cache.get(msg[y][1]).send(msg[y][2]).then(msg2=>setTimeout(()=>{msg2.delete()},i[x].delete_self)),i[x].delay)
							}else{
								setTimeout(()=>bot.users.cache.get(msg[y][1]).send(msg[y][2]),i[x].delay)
							}
						}else{
							console.error("Interaction DM could not be sent.");
						}
					}
				}
				// Execute command
				if(i[x].command){
					let coms = i[x].command.split(";;;");
					for(let y = 0 ; y < coms.length ; y++){
						messages.push(repl(coms[y]));
					}
				}
				// React
				if(i[x].react){
					let reacts = i[x].react.split(";");
					for(let y = 0 ; y < reacts.length ; y++){
						message.react(reacts[y]);
					}
				}
				// Delete
				if(i[x].delete != null){
					setTimeout(()=>{message.delete();return;},i[x].delete);
				}
				// Continue program
				if(!i[x].continue){
					cont = false;
				}

		}
		if(cont){messages.push(message.content)}
		
		for(let mnumber = 0 ; mnumber < messages.length ; mnumber++){
			let args;
			if(messages[mnumber].startsWith(v[s].pref)){
				args = messages[mnumber].substring(v[s].pref.length).replace(/'/g, "\\'").split(" ");
			}else{
				return;
			}
			let larg = pre => {
				let ret = '';
				for(let x = pre ; x < args.length ; x++){
					ret += args[x];
					if(x != args.length-1){
						ret += ' ';
					}
				}
				return ret;
			}
			switch(args[0]){
				case 'help':
					let file = [new Discord.MessageAttachment('./images/help.png', 'help.png'), new Discord.MessageAttachment('./images/info_sm.png', 'info_sm.png')];
					let mess = new Discord.MessageEmbed()
						.setColor('#99ff99')
						.setThumbnail('attachment://help.png')
					
					if(!f.nll(args[2])){
						f.sql("SELECT * FROM `help` WHERE `name`='"+larg(1)+"' AND `par` IS NULL AND `sect` IS NULL")
							.then(rows=>{
								if(!f.nll(rows)){
									let title = "**Aide ‧ "+v[s].pref.replace(/\*\*/,'\\**')+rows[0].name+"**";
									mess // .setTitle("**Aide ‧ "+v[s].pref.replace(/\*\*/,'\\**')+rows[0].name+"**")
										.setDescription(rows[0].desc);
									f.sql("SELECT * FROM `help` WHERE `par` LIKE '"+larg(1)+"-%' ORDER BY `par` ASC")
										.then(rows2=>{
											if(!f.nll(rows2)){
												for(let x=0;x<rows2.length;x++){
													let name=" "+rows2[x].name;
													title += " "+rows2[x].name;
													
													let desc = "\u200B"+rows2[x].desc+'\n';
													if(!f.nll(rows2[x].list)){
														desc+="*";
														let s_list=rows2[x].list.split(";;;");
														for(let y = 0; y < s_list.length; y++){
															desc+="`"+s_list[y]+"`"
															if(y != s_list.length-1){
																desc += " ; ";
															}
														}
														desc+="*\n";
													}
													if(!f.nll(rows2[x].ex)){
														desc+="\u200B*Ex. : ";
														let s_ex=rows2[x].ex.split(";;;");
														for(let y = 0; y < s_ex.length; y++){
															desc+=" `"+s_ex[y]+"`"
															if(y != s_ex.length-1){
																desc += " ; ";
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
											
											// EX & LIST
											let list = '\u200B\u200B';
											if(!f.nll(rows[0].list)){
												list += "*";
												let s_list = rows[0].list.split(";;;");
												for(let y = 0; y < s_list.length; y++){
													list += "`"+s_list[y]+"`"
													if(y != s_list.length-1){
														list += " ; ";
													}
												}
												list += "*\n";
											}
											let ex = '\u200B\u200B';
											if(!f.nll(rows[0].ex)){
												// ex += "*";
												let s_ex = rows[0].ex.replace(/<pref>/g, v[s].pref).split(";;;");
												for(let y = 0; y < s_ex.length; y++){
													if(y == 0){
														ex += "Ex. : ";
													}else{
														ex += " ; ";
													}
													// ex += "`"+s_ex[y]+"`"
													ex += f.mark(s_ex[y],'`');
												}
												// ex += "*\n";
											}
											mess.addField(list,f.mark(ex,'*'))
												.setTitle(title);

											message.channel.send({ files: [file[0]], embed: mess });
										})
								}else{
									mess.addField('\u200B', ':warning: La fonction '+f.mark(larg(1))+' n\'existe pas.\n\u200B \u200B \u200B <:help:726511256269226046> *`'+v[s].pref+'help`*')
									message.channel.send({ files: [file[0]], embed: mess });
								}
							})
					}else if(!f.nll(args[1])){
						f.sql("SELECT * FROM `help` WHERE `name`='"+args[1]+"' AND `par` IS NULL")
							.then(rows=>{
								if(!f.nll(rows)){
									let title = "**Aide ‧ "+v[s].pref.replace(/\*\*/,'\\**')+rows[0].name+"**";
									mess // .setTitle("**Aide ‧ "+v[s].pref.replace(/\*\*/,'\\**')+rows[0].name+"**")
										.setDescription(rows[0].desc);
									f.sql("SELECT * FROM `help` WHERE `par` LIKE '"+args[1]+"-%' ORDER BY `par` ASC")
										.then(rows2=>{
											if(!f.nll(rows2)){
												for(let x=0;x<rows2.length;x++){

													if(rows2[x].l2 && rows2[x].l2 != "none"){
														title += " "+rows2[x].l2;
													}else if(rows2[x].l2 != "none"){
														title += " "+rows2[x].name;
													}

													let name;
													if(rows2[x].expl && rows2[x].expl != "none"){
														name=" "+rows2[x].expl;
													}else if(rows2[x].expl != "none"){
														name=" "+rows2[x].name;
													}
													
													let desc = "\u200B"+rows2[x].desc+'\n';
													if(!f.nll(rows2[x].list)){
														desc+="*";
														let s_list=rows2[x].list.split(";;;");
														for(let y = 0; y < s_list.length; y++){
															desc+="`"+s_list[y]+"`"
															if(y != s_list.length-1){
																desc += " ; ";
															}
														}
														desc+="*\n";
													}
													if(!f.nll(rows2[x].ex)){
														desc+="\u200B*Ex. : ";
														let s_ex=rows2[x].ex.split(";;;");
														for(let y = 0; y < s_ex.length; y++){
															desc+=" `"+s_ex[y]+"`"
															if(y != s_ex.length-1){
																desc += " ; ";
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
													if(rows2[x].expl != "none"){
														mess.addField(name, desc, true);
													}
												}
											}else{
												mess.addField('\u200B','\u200B',true);
												mess.addField('*Aucun paramètre*', '\u200B',true);
												mess.addField('\u200B','\u200B',true);
											}
											
											// EX & LIST
											let list = '\u200B\u200B';
											if(!f.nll(rows[0].list)){
												list += "*";
												let s_list = rows[0].list.split(";;;");
												for(let y = 0; y < s_list.length; y++){
													list += "`"+s_list[y]+"`"
													if(y != s_list.length-1){
														list += " ; ";
													}
												}
												list += "*\n";
											}
											let ex = '\u200B\u200B';
											if(!f.nll(rows[0].ex)){
												// ex += "*";
												let s_ex = rows[0].ex.replace(/<pref>/g, v[s].pref).split(";;;");
												for(let y = 0; y < s_ex.length; y++){
													if(y == 0){
														ex += "Ex. : ";
													}else{
														ex += " ; ";
													}
													// ex += "`"+s_ex[y]+"`"
													ex += f.mark(s_ex[y],'`');
												}
												// ex += "*\n";
											}
											mess.addField(list,f.mark(ex,'*'))
												.setTitle(title);

											message.channel.send({ files: [file[0]], embed: mess });
										})
								}else{
									mess.addField('\u200B', ':warning: La fonction '+f.mark(args[1])+' n\'existe pas.\n\u200B \u200B \u200B <:help:726511256269226046> *`'+v[s].pref+'help`*')
									message.channel.send({ files: [file[0]], embed: mess });
								}
							})
					}else{
						mess.setFooter(v[s].pref+"help [commande]", "attachment://help.png")
							.setTitle("__**Aide**__");

						f.sql("SELECT DISTINCT `sect` FROM `help` WHERE `par` IS NULL AND `sect` IS NOT NULL ORDER BY `sect` ASC")
							.then(rows => {
								for(let x = 0 ; x < rows.length ; x++){

									let sect = "= '"+rows[x].sect+"'";
									if(!rows[x].sect){
										sect = "IS NULL";
									}//else{
										// mess.addField(rows[x].sect,'\u200B');
									//}

									f.sql("SELECT * FROM `help` WHERE `sect` "+sect+" AND `par` IS NULL ORDER BY `name` ASC")
										.then(rows2 => {

											for(let y = 0; y < rows2.length; y++){
												let name = "**"+v[s].pref+rows2[y].name+"**";
												f.sql("SELECT * FROM `help` WHERE `par` LIKE '"+rows2[y].name+"-%' ORDER BY `par` ASC")
													.then(rows3 => {
														if(y == 0 && rows[x].sect.match(/\S/g)){
															mess.addField('\u200B','\u200B\u200B\u200B ___**'+rows[x].sect+'**___');
														}
														for(let z = 0; z<rows3.length; z++){
															if(rows3[z].l1 && rows3[z].l1 != "none"){
																name += " "+rows3[z].l1;
															}else if(rows3[z].l1 != "none"){
																name += " "+rows3[z].name;
															}
														}
														if(y!=0 && y%2==1){
															mess.addField('\u200B','\u200B',true)
														}
														mess.addField(name,"\u200B\u200B "+rows2[y].sdesc,true);
														if(y == rows2.length-1 && y%2==0){
															mess.addField('\u200B','\u200B',true);
															mess.addField('\u200B','\u200B',true);
														}
														if(y == rows2.length-1 && x == rows.length-1){
															message.channel.send({ files: [file[0]], embed: mess });
														}
													});
											}
										});

								}
							})
					}
					break;
				case 'zoom':
					if(!(s == 630090289951801356 || s == 700823351379361892)){message.channel.send("<:info:725144790915743754> Cette fonction n'est disponible que sur des serveurs sélectionnés.");break;}

					message.fetch({limit:1}).then(msg=>{ setTimeout(()=>{msg.delete();return;},10000); });
					let d1 = moment().tz("America/Toronto").format("DD/MM/YY HH:mm");
					let now1 = moment(d1,"DD/MM/YY HH:mm:ss").format("YYYY/MM/DD HH:mm:ss");
					f.sql("SELECT * FROM `zoom` WHERE STR_TO_DATE(`time`, '%d/%m/%y %H:%i') >= DATE_SUB('"+now1+"', INTERVAL 10 MINUTE) AND STR_TO_DATE(`time`, '%d/%m/%y %H:%i') <= DATE_ADD('"+now1+"', INTERVAL 20 MINUTE) AND `exe`=0 ORDER BY STR_TO_DATE(`time`, '%d/%m/%y %H:%i');")
						.then(rows=>{
							const conv_cours = {"FR":"Français", "SC":"Science", "HI":"Histoire", "AN":"Anglais", "MA":"Mathématiques", "EP":"Éducation physique", "ES":"Espagnol", "AR":"Arabe", "AD":"Art dramatique", "EC":"ECR"/*, "FM":"Français/Mathématiques"*/};
							const conv_groupe = {"Co":" - Cobalt", "Hg":" - Mercure", "Av":" - Avancé", "Re":" - Régulier", "Ar":" - Arabe", /*"Cr":" - Corail", "Ma":" - Marine",*/ "S4":""/*, "P5":""*/};
							
							if(rows.length){
								var crs = [];
								for(let x=0;x<rows.length;x++){
									let h = rows[x].time.substring(9).replace(":","h").replace("h00","h");
									if(!crs[h]){
										crs[h] = [];
									}
									/* if((x+1)%3 == 0){
										crs[h]["**\xa0\xa0\xa0\xa0 | \xa0**"] = "**\xa0\xa0\xa0\xa0\xa0\xa0|** \n **\xa0\xa0\xa0\xa0\xa0\xa0|**";
									} */
									if(1==1){
										crs[h]["__**"+conv_cours[rows[x].cours.substring(3,5)]+conv_groupe[rows[x].cours.substring(0,2)]+"**__"] = "\n\xa0\xa0*"+rows[x].ID+"* - *"+rows[x].PW+"*\n\xa0\xa0\xa0*("+rows[x].LN+")*";
										f.sql('UPDATE `zoom` SET `exe`=1 WHERE `cours`="'+rows[x].cours+'"');
									}
								}
								for(var key in crs){
									var embed = new Discord.MessageEmbed()
										.setTitle(key)
										.setColor(10092441);
									for(var key1 in crs[key]){
										embed.addField(key1, crs[key][key1], true);
									}
									message.channel.send({embed: embed})
									// console.log(crs);
								};
							}else{
								message.channel.send("<:info:725144790915743754> Aucune conférence dans les 20 prochaines minutes.")
							}
						})
					break;
				case 'set':
					if(message.member.id == process.env.moderator || message.member.hasPermission("ADMINISTRATOR")){
						if(!f.nll(args[1])){
							switch(args[1]){
								case 'prefix':
									if(!f.nll(args[2])){
										if(larg(2).length>10){
											message.channel.send(":warning: Le préfix ne peut pas être plus long que 10 caractères.")
										}else if( (' '+larg(2)+' ').match(/(```)|([^`]``[^`]+`[^`])|([^`]`[^`]+``[^`])|(\*[^*]*_)|(_[^*]*\*)/g) ){
											message.channel.send(":warning: Préfixe invalide.")
										}else if(larg(2) == "default"){
											f.sql("UPDATE `vars` SET `pref`=DEFAULT(`pref`) WHERE `server`='"+s+"'")
												.then(() => {
													f.sql("SELECT DEFAULT(`pref`) AS `default` FROM `vars`")
														.then(rows => {
															message.channel.send(":white_check_mark: Préfix changé à *`"+rows[0].default+"`*.");
															global.v[s].pref=rows[0].default;
														})
												});
										}else{
											f.sql("UPDATE `vars` SET `pref`='"+larg(2)+"' WHERE `server`='"+s+"'")
												.then(()=>{
													message.channel.send(":white_check_mark: Préfix changé à "+f.mark(larg(2))+".");
													global.v[s].pref=larg(2);
												});
										}
									}else{
										message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help set prefix"));
									}
									break;
								case 'bday_hour':
									if(!v[s].bday){message.channel.send("<:info:725144790915743754> Cette fonction a été désactivée.");break;}
									if(!f.nll(args[2])){
										if(!larg(2).toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)$/)){
											message.channel.send(":warning: Veuillez entrer l'heure sous le format `HH:MM` (24h).")
										}else{
											f.sql("UPDATE `vars` SET `bday_hour`='"+larg(2)+"' WHERE `server`='"+s+"'")
												.then(()=>{
													message.channel.send(":white_check_mark: Heure d'anniversaire changée à *`"+larg(2)+"`*.");
													global.v[s].bday_hour=larg(2);
												});
										}
									}else{
										message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help set bday_hour"));
									}
									break;
								case 'bday_channel':
									if(!v[s].bday){message.channel.send("<:info:725144790915743754> Cette fonction a été désactivée.");break;}
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
										message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help set bday_channel"));
									}
									break;
								case 'bday_message':
									if(!v[s].bday){message.channel.send("<:info:725144790915743754> Cette fonction a été désactivée.");break;}
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
										message.channel.send("<:info:725144790915743754> Veuillez préciser la valeur du paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help set bday_message"));
									}
									break;
								case 'enable':
									if(!f.nll(args[2])){
										if(typeof v[s][args[2]] != "undefined"){
											if(v[s][args[2]] == 0){
												f.sql("UPDATE `vars` SET `"+args[2]+"` = 1 WHERE `server`='"+s+"'")
													.then(() => {
														v[s][args[2]] = 1;
														message.channel.send(":white_check_mark: Fonction activée (*`"+args[2]+"`*).");
													});
											}else{
												message.channel.send("<:info:725144790915743754> Cette fonction est déjà activée (*`"+args[2]+"`*).");
											}
										}else{
											message.channel.send(":warning: Cette fonction n'existe pas.")
										}
									}else{
										message.channel.send("<:info:725144790915743754> Veuillez préciser la fonction à activer.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help set enable"));
									}
									break;
								case 'disable':
									if(!f.nll(args[2])){
										if(typeof v[s][args[2]] != "undefined"){
											if(v[s][args[2]] == 1){
												f.sql("UPDATE `vars` SET `"+args[2]+"` = 0 WHERE `server`='"+s+"'")
													.then(() => {
														v[s][args[2]] = 0;
														message.channel.send(":white_check_mark: Fonction désactivée (*`"+args[2]+"`*).");
													});
											}else{
												message.channel.send("<:info:725144790915743754> Cette fonction est déjà désactivée (*`"+args[2]+"`*).");
											}
										}else{
											message.channel.send(":warning: Cette fonction n'existe pas.")
										}
									}else{
										message.channel.send("<:info:725144790915743754> Veuillez préciser la fonction à désactiver.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help set disable"));
									}
									break;
								default:
									message.channel.send(":warning: Le paramètre "+f.mark(args[1])+" n'existe pas.\n\u200B \u200B \u200B <:help:726511256269226046>  "+f.mark(v[s].pref+"help set"));
							}
						}else{
							message.channel.send("<:info:725144790915743754> Veuillez préciser le paramètre à modifier.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help set"));
						}
					}else{
						message.channel.send(':warning: Vous n\'avez pas la permission de modifier les paramètres.');
					}
					break;
				case 'suggest':
					if(!f.nll(args[1])){
						if(args[1].length>200){
							message.channel.send(":warning: La suggestion ne peut pas être plus longue que 200 caractères.")
						}else{
							octokit.request('POST /repos/{owner}/{repo}/issues', {
								owner: 'ADecametre',
								repo: 'discordadam',
								title: `[Bot] ${message.member.user.tag} (<@${message.member.id}>) - ${larg(1)}`,
								labels: ['enhancement']
							}).then(({ data }) => {
								console.log(data);
								message.channel.send(":white_check_mark: Suggestion envoyée.\nMerci de supporter le bot.");
								let mess = new Discord.MessageEmbed()
									.setColor('#99ff99')
									.setAuthor(`${message.member.user.tag} (<@${message.member.id}>)`, message.author.displayAvatarURL({dynamic : true}))
									.setTitle("Nouvelle suggestion")
									.setDescription(larg(1));
								bot.users.cache.get(process.env.moderator).send(mess);
							});
						}
					}else{
						message.channel.send("<:info:725144790915743754> Veuillez indiquer votre suggestion.\n\u200B \u200B \u200B "+f.mark(v[s].pref+"help suggest"));
					}
					break;
				case 'issue':
					if(!f.nll(args[1])){
						if(args[1].length>200){
							message.channel.send(":warning: La description du problème ne peut pas être plus longue que 200 caractères.")
						}else{
							octokit.request('POST /repos/{owner}/{repo}/issues', {
								owner: 'ADecametre',
								repo: 'discordadam',
								title: `[Bot] ${message.member.user.tag} (<@${message.member.id}>) - ${larg(1)}`,
								labels: ['bug']
							}).then(({ data }) => {
								console.log(data);
								message.channel.send(":white_check_mark: Problème envoyé.\nMerci de supporter le bot.");
								let mess = new Discord.MessageEmbed()
									.setColor('#99ff99')
									.setAuthor(`${message.member.user.tag} (<@${message.member.id}>)`, message.author.displayAvatarURL({dynamic : true}))
									.setTitle("Nouveau problème")
									.setDescription(larg(1));
								bot.users.cache.get(process.env.moderator).send(mess);
							});
						}
					}else{
						message.channel.send("<:info:725144790915743754> Veuillez décrire votre problème.\n\u200B \u200B \u200B "+f.mark(v[s].pref+"help issue"));
					}
					break;
				case 'about':
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
						query="SELECT `id`,`date`,`info_ext` AS `info` FROM `about` WHERE `id`='"+args[1]+"' AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ASC LIMIT 1";
					}else if(nv[1]){ // avec sv
						fv = 2;
						fv1 = 0;
						query="SELECT `id`,`date`,`info` FROM `about` WHERE `id` LIKE '"+args[1]+"%' AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ASC LIMIT 6";
					}else if(nv[0]){ // avec v
						if(args[1] != "next"){
							fv = 0;
							fv1 = 1;
							query="SELECT `id`,`date`,`info` FROM `about` WHERE `id` LIKE '"+args[1]+"%' AND `id` LIKE '%.0' AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ASC LIMIT 6";
						}else{
							fv = 2;
							fv1 = 1;
							query="SELECT `id`,`date`,`info_ext` AS `info` FROM `about` WHERE STR_TO_DATE(`date`, '%d/%m/%y %H:%i')>=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ASC LIMIT 1";
						}
					}else{ // avec rien
						fv = 2;
						fv1 = 0;
						query = "SELECT `id`,`date`,`info` FROM `about` WHERE `id` LIKE CONCAT( SUBSTRING_INDEX( (SELECT `id` FROM `about` WHERE STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` DESC LIMIT 1) ,'.',2), '%' ) AND STR_TO_DATE(`date`, '%d/%m/%y %H:%i')<=STR_TO_DATE('"+d+"', '%d/%m/%y %H:%i') ORDER BY `id` ASC LIMIT 6";
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
										let d_form = "";
										let d_diff = moment.duration( moment(d,"DD/MM/YY HH:mm").diff(moment(rows[0].date,"DD/MM/YY HH:mm")) );
										if(args[1] && args[1] == "next" && d_diff < 0){
											d_diff = moment.duration( moment(rows[0].date,"DD/MM/YY HH:mm").diff(moment(d,"DD/MM/YY HH:mm")) );
											if(d_diff.format("s").replace(/,/g, "") >= 60 && d_diff.format("d").replace(/,/g, "") < 7){d_form += "Dans "}
										}else if(d_diff.format("s").replace(/,/g, "") >= 60 && d_diff.format("d").replace(/,/g, "") < 7){d_form += "Il y a "}

										if(d_diff.format("M").replace(/,/g, "") >= 6){
											d_form += rows[0].date.substr(0,6)+"20"+rows[0].date.substr(6,2);
										}else if(d_diff.format("d").replace(/,/g, "") >= 7){
											d_form += parseInt( rows[0].date.substr(0,2) ) + " " + f.abv_month[ parseInt(rows[0].date.substr(3,2)) ]
										}else if(d_diff.format("h").replace(/,/g, "") >= 24){
											if(d_diff.format("d") != 1){
												d_form += d_diff.format("d") + " jours"
											}else{
												d_form += "1 jour"
											}
										}else if(d_diff.format("m").replace(/,/g, "") >= 60){
											if(d_diff.format("h") != 1){
												d_form += d_diff.format("h") + " heures"
											}else{
												d_form += "1 heure"
											}
										}else if(d_diff.format("s").replace(/,/g, "") >= 60){
											if(d_diff.format("m") != 1){
												d_form += d_diff.format("m") + " minutes"
											}else{
												d_form += "1 minute"
											}
										}else if(d_diff.format("s").replace(/,/g, "") < 60){
											d_form += "Quelques secondes"
										}

										let mess = new Discord.MessageEmbed()
											.setColor('#99ff99')
											.setTitle('Version ' + rows[0].id.substr(0, f.getPos(rows[0].id, '.', fv+fv1)) + " ‧ *" + d_form + "*")
											.setURL()
											.setAuthor(bot.username, null, 'http://a-decametre.tk/bot')
											.setDescription(rows[0].info)
											.setThumbnail(bot.displayAvatarURL({dynamic : true}))
											/* .addFields(
												{ name: 'Regular field title', value: 'Some value here' },
												{ name: '\u200B', value: '\u200B' },
												{ name: 'Inline field title', value: 'Some value here', inline: true },
												{ name: 'Inline field title', value: 'Some value here', inline: true },
											)
											.addField('Inline field title', 'Some value here', true)
											.setImage(bot.displayAvatarURL({dynamic : true}))
											.setTimestamp() */
											.setFooter(mod.username+'#'+mod.discriminator+'\n', mod.displayAvatarURL({dynamic : true}));

										for(let x = rows.length-1;x>0;x--){
											momFormat(moment);
											let d_diff = moment.duration( moment(d,"DD/MM/YY HH:mm").diff(moment(rows[x].date,"DD/MM/YY HH:mm")) );
											let d_form;
											if(d_diff.format("M").replace(/,/g, "") >= 6){
												d_form = rows[x].date.substr(0,6)+"20"+rows[x].date.substr(6,2);
											}else if(d_diff.format("d").replace(/,/g, "") >= 7){
												d_form = parseInt( rows[x].date.substr(0,2) ) + " " + f.abv_month[ parseInt(rows[x].date.substr(3,2)) ]
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
								message.channel.send(':warning: La version *`'+args[1]+'`* n\'existe pas.\n\u200B \u200B \u200B <:help:726511256269226046>  '+f.mark(v[s].pref+"help about"));
							}
						})
						.catch(err => {
							f.err_rep("about-req",err).then(value=>{message.channel.send(value);});
						});
					break;
				case 'poll':
					if(!v[s][args[0]]){message.channel.send("<:info:725144790915743754> Cette fonction a été désactivée.");break;}
					
					message.fetch({limit:1}).then(msg=>{ setTimeout(()=>{msg.delete();return;},10000); });
					let user = message.member.nickname || message.author.username;
					// let mem = message.guild.members.cache.find(member => member.id == message.author.id);
					let mess2 = new Discord.MessageEmbed()
						.setColor('#99ff99')
						.setAuthor(user+'\n', message.author.displayAvatarURL({dynamic : true}));
					
					let fields = larg(1).match(/{(.*)}|\[(.*?)\]/g).map(function(match) { return match.slice(1, -1); });
					for(let x = 0 ; x < fields.length ; x++){
						// if(fields[x].match(/(.*?)\|(.*)|(.*)/)){
							fields[x]=fields[x].match(/(.*?);;(.*)|(.*)/);
						// }
					}

					if(!larg(1).match(/{(.*)}/g) || fields.length < 3){
						message.channel.send("<:info:725144790915743754> Veuillez indiquer un titre et au moins deux options.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help poll")).then(msg2=>setTimeout(()=>{msg2.delete()},5000));
					}else if(fields.length > 21){
						message.channel.send(":warning: Il ne peut pas y avoir plus de 20 options.").then(msg2=>setTimeout(()=>{msg2.delete()},5000));
					}else if(fields.includes("")){
						message.channel.send(":warning: Le titre et les options ne peuvent pas être vides.").then(msg2=>setTimeout(()=>{msg2.delete()},5000));
					}else{
						let title = fields[0][1] || fields[0][0];
						mess2.setTitle(title);
						if(fields[0][2]){mess2.setDescription(fields[0][2])}

						for(let x = 1 ; x < fields.length ; x++){
							let field = fields[x][1] || fields[x][0];
							let desc = fields[x][2] || '\u200B';
							mess2.addField(":regional_indicator_" + f.alph[x] + ": " + field, desc, true);
							if(x == fields.length-1){
								message.channel.send(mess2).then(sentEmbed => {
									for(y=1 ; y<=x ; y++){
										sentEmbed.react(f.e_alph[y]);
									}
								});
							}
						}
					}
					break;
				case 'bday':
					if(!v[s][args[0]]){message.channel.send("<:info:725144790915743754> Cette fonction a été désactivée.");break;}
					
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
								message.channel.send("<:info:725144790915743754> Veuillez préciser la date de naissance.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help bday"));
							}
						}else{
							message.channel.send("<:info:725144790915743754> Veuillez préciser l'utilisateur ou la date de naissance.\n\u200B \u200B \u200B <:help:726511256269226046> "+f.mark(v[s].pref+"help bday"));
						}
					}else{
						message.channel.send("<:info:725144790915743754> Aucun salon d'affichage défini par les modérateurs.\n\u200B \u200B \u200B <:help:726511256269226046>  "+f.mark(v[s].pref+"help set bday_channel"));
					}
					break;
				case 'pfp' :
					if(!v[s][args[0]]){message.channel.send("<:info:725144790915743754> Cette fonction a été désactivée.");break;}

					if(f.nll(args[1])){
						let mess = new Discord.MessageEmbed()
							.setColor('#99ff99')
							.setTitle((message.guild.members.cache.find(member => member.id == message.author.id).displayName || message.author.username))
							.setDescription("Photo de profil")
							.setImage(message.author.displayAvatarURL({dynamic : true, size: 1024}));
						message.channel.send(mess);
					}else{
						let mem = message.guild.members.cache.find(member => member.id == f.u_mention(args[1])[1] || member.user.username == larg(1) /* args[1].replace(/([^\\])(_)/g,'$1 ').replace(/\\/g,'') */ || member.nickname == larg(1) /* args[1].replace(/([^\\])(_)/g,'$1 ').replace(/\\/g,'') */) || null;
						if(mem){
							let mess = new Discord.MessageEmbed()
								.setColor('#99ff99')
								.setTitle((mem.nickname || mem.user.username))
								.setDescription("Photo de profil")
								.setImage(mem.user.displayAvatarURL({dynamic : true, size: 1024}));
							message.channel.send(mess);
						}else{
							message.channel.send(":warning: Nom d'utilisateur incorrect.");
						}
					}
					break;
				case 'sync' :
					sync();
					message.react("✅");
					break;
			}
		}
	}
});

function sync() {
	i_sync();
	v_sync();
	bday_sync();
	console.log("Synchronizing…");
}

function i_sync(){
	f.sql("SELECT * from `interactions` WHERE `active`=1 AND `name` NOT LIKE '{!!%'")
		.then(rows=>{
			global.i=new Array;
			for(let x = 0 ; x < rows.length ; x++){
				global.i[x]=rows[x];
			}
		});
}
function v_sync(){
	f.sql("SELECT * from `vars`")
		.then(rows=>{
			global.v=new Array;
			for(let x = 0 ; x < rows.length ; x++){
				let s = rows[x].server;
				global.v[s]=rows[x];
			}
		});
}
function bday_sync() {
	let d=moment().tz("America/Toronto").format("DD/MM");
	momFormat(moment);
	let h=moment().tz("America/Toronto").format("HH:mm");
	f.sql("SELECT `uid`, `server` FROM `bday` WHERE `done` = 0 && `date` LIKE '"+d+"%'")
		.then(rows => {
			// if(rows[0]){
			for (let x = 0; x < rows.length; x++) {
				// f.sql("SELECT `bday_channel`, `bday_hour`, `bday_message` FROM `vars` WHERE `server` = '"+rows[x].server+"'")
					// .then(rows2 => {
				if(v[rows[x].server] && v[rows[x].server].bday){
					let d_diff = moment.duration( moment(h,"HH:mm").diff(moment(v[rows[x].server].bday_hour,"HH:mm")) ).format("m").replace(/,/g, "");

					if (-5 <= d_diff && d_diff <= 115) {
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
			// }
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
}

bot.on('ready', () =>{
	function i_status_sync(){
		f.sql("SELECT `message`,`author`,`send`,`dm`,`delay` from `interactions` WHERE `name`='{!!status}' AND `active`=1")
			.then(rows=>{
				// Randomise
				let rands = ['message','author','send','dm'];
				let r = false;
				for(let x = 0 ; x < rands.length ; x++){
					if(rows[0][rands[x]].split(";OR;").length > 1){
						rands[x] = rows[0][rands[x]].split(";OR;")
						r = true;
					}else{
						rands[x] = [rows[0][rands[x]]]
					}
				}
				let delay = rows[0].delay;
				if(rows[0].delay == 0){
					delay = 10000;
				}
				//Status
				if(!r){
					bot.user.setPresence({
						status: rands[0][0] || '',
						activity: {
							type: rands[1][0] || '',
							name: rands[2][0] || '',
							url: rands[3][0] || ''
						}
					});
				}else{
					setInterval(() => {
						bot.user.setPresence({
							status: rands[0][Math.floor(Math.random()*(rands[0].length))] || '',
							activity: {
								type: rands[1][Math.floor(Math.random()*(rands[1].length))] || '',
								name: rands[2][Math.floor(Math.random()*(rands[2].length))] || '',
								url: rands[3][Math.floor(Math.random()*(rands[3].length))] || ''
							}
						});
					}, delay);
				}
				// bot.user.setStatus("dnd")
				// bot.user.setActivity('Rien', { type: 'STREAMING', url: 'http://bit.ly/98K8eH' })
			})
	}
	i_status_sync();
	setInterval(i_status_sync, 10*60*1000);

	console.log('Bot A-Decametre.tk prêt !\n');
});
bot.login(process.env.token);
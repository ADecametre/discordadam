const Discord = require('discord.js');
const bot = new Discord.Client();
// require('dotenv').config();
const f = require('./functions.js');
const req = require('request-promise');
const { resolve } = require('path');
//const { sql } = require('./functions.js');
// var requireWithoutCache = require('require-without-cache');
// f.rfile('./cache/prefix.txt').then(data=>{console.log('H:'+data);global.pref = data;});

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
										if(x == rows.length-1 && x%2==0){
											mess.addField('\u200B','\u200B',true);
											mess.addField('\u200B','\u200B',true);
										}
										mess.addField(name,"\u200B\u200B "+rows[x].sdesc,true);
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
									if(args[2].length>10){
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
						var moment = require('moment-timezone');
						d=moment().tz("America/Toronto").format("DD/MM/YY HH:mm:ss");
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
				var moment = require('moment-timezone');
				d=moment().tz("America/Toronto").format("DD/MM/YY HH:mm");

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
									const momFormat = require("moment-duration-format");
									momFormat(moment);
									let d_diff = moment.duration( moment(d,"DD/MM/YY HH:mm").diff(moment(rows[0].date,"DD/MM/YY HH:mm")) );
									let d_form;
									if(d_diff.format("M").replace(/,/g, "") >= 6){
										d_form = rows[0].date.substr(0,6)+"20"+rows[0].date.substr(6,2);
									}else if(d_diff.format("d").replace(/,/g, "") >= 7){
										var month = ["janv.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
										d_form = parseInt( rows[0].date.substr(0,2) ) + " " + month[ parseInt(rows[0].date.substr(3,2)) - 1 ]
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
										mess.addFields(
											{ name: '\u200B', value: '\u200B', inline: true },
											{ name: '.'+rows[x].id.split('.')[fv], value: rows[x].info, inline: true },
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
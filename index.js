(async () => {
	// default imports
	const events = require('events');
	const {exec} = require("child_process")
	const logs = require("discord-logs")
	const Discord = require("discord.js")
	const {
		MessageEmbed,
		MessageButton,
		MessageActionRow,
		Intents,
		Permissions,
		MessageSelectMenu
	} = require("discord.js")
	const fs = require('fs');
	let process = require('process');
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	// block imports
	let https = require("https")
	let {Player, QueueRepeatMode} = require("discord-player")
	let playdl = require("play-dl")

	// define s4d components (pretty sure 90% of these arnt even used/required)
	let s4d = {
		Discord,
		fire: null,
		joiningMember: null,
		reply: null,
		player: null,
		manager: null,
		Inviter: null,
		message: null,
		notifer: null,
		checkMessageExists() {
			if (!s4d.client) throw new Error('You cannot perform message operations without a Discord.js client')
			if (!s4d.client.readyTimestamp) throw new Error('You cannot perform message operations while the bot is not connected to the Discord API')
		}
	};

	// check if d.js is v13
	if (!require('./package.json').dependencies['discord.js'].startsWith("^13.")) {
		let file = JSON.parse(fs.readFileSync('package.json'))
		file.dependencies['discord.js'] = '^13.12.0'
		fs.writeFileSync('package.json', JSON.stringify(file))
		exec('npm i')
		throw new Error("Seems you arent using v13 please re-run or run `npm i discord.js@13.12.0`");
	}

	// check if discord-logs is v2
	if (!require('./package.json').dependencies['discord-logs'].startsWith("^2.")) {
		let file = JSON.parse(fs.readFileSync('package.json'))
		file.dependencies['discord-logs'] = '^2.0.0'
		fs.writeFileSync('package.json', JSON.stringify(file))
		exec('npm i')
		throw new Error("discord-logs must be 2.0.0. please re-run or if that fails run `npm i discord-logs@2.0.0` then re-run");
	}

	// create a new discord client
	s4d.client = new s4d.Discord.Client({
		intents: [
			Object.values(s4d.Discord.Intents.FLAGS).reduce((acc, p) => acc | p, 0)
		],
		partials: [
			"REACTION",
			"CHANNEL"
		]
	});

	// when the bot is connected say so
	s4d.client.on('ready', () => {
		console.log(s4d.client.user.tag + " is alive!")
	})

	// upon error print "Error!" and the error
	process.on('uncaughtException', function (err) {
		console.log('Error!');
		console.log(err);
	});

	// give the new client to discord-logs
	logs(s4d.client);

	// pre blockly code
	s4d.player = new Player(s4d.client)

	// blockly code
	var arguments2, command, volume, onoff;


	s4d.player.on("trackStart", async (queue, track) => {
		var embed = new Discord.MessageEmbed()
		embed.setTitle((['now playing ', track.title, '\n', 'author: ', track.author, '\n', 'url: ', track.url, '\n', 'views: ', track.views, '\n', 'duration: ', track.duration].join('')));
		embed.setImage((track.thumbnail));
		(queue.metadata.channel).send({embeds: [embed]});
	})

	s4d.player.on("queueEnd", async (queue) => {
		(queue.metadata.channel).send({content: String('queue finished')});

	})

	s4d.player.on("trackAdd", async (queue, track) => {
		(queue.metadata.channel).send({content: String((['music ', track.title, 'added to queue'].join('')))});
	})

	s4d.player.on("error", async (queue, error) => {
		console.log("************************")
		console.log("* BIG ERROR HAPPENED ! *")
		console.log("************************")
		console.log(error.stack)
		(queue.metadata.channel).send({content: String('error, sorry')});
	})

	await s4d.client.login(process.env.token).catch((e) => {
		const tokenInvalid = true;
		const tokenError = e;
		if (e.toString().toLowerCase().includes("token")) {
			throw new Error("An invalid bot token was provided!")
		} else {
			throw new Error("Privileged Gateway Intents are not enabled! Please go to https://discord.com/developers and turn on all of them.")
		}
	});

	s4d.client.on('messageCreate', async (s4dmessage) => {
		arguments2 = (s4dmessage.content).split(' ');
		command = arguments2.splice(0, 1)[0];
		if (command == 's!play') {
			if ((s4dmessage.member.voice.channelId) == null) {
				s4dmessage.channel.send({content: String('you are not in a voice channel!')});
				return
			}
			if ((s4dmessage.guild.me.voice.channelId) != null && (s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
				s4dmessage.channel.send({content: String('you are not in my voice channel!')});
				return
			}
			const queue = s4d.player.createQueue((s4dmessage.guild), {
				metadata: {channel: (s4dmessage.channel)}, async onBeforeCreateStream(track, source, _queue) {
					if (source === "youtube") {
						return (await playdl.stream(track.url, {discordPlayerCompatibility: true})).stream;
					}
				}
			});
			if (!(queue.connection)) {
				await queue.connect((s4dmessage.member.voice.channel))
				;
			}
			queue.play((await s4d.player.search((arguments2.join(' ')), {requestedBy: (s4dmessage.author)}).then(x => x.tracks[0])));
		}
		if (command == 's!pause') {
			if ((s4dmessage.member.voice.channel) == null) {
				s4dmessage.channel.send({content: String('you are not in a voice channel!')});
				return
			}
			if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
				s4dmessage.channel.send({content: String('you are not in my voice channel!')});
				return
			}
			if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
				s4dmessage.channel.send({content: String('there is no music playing!')});
				return
			}
			(s4d.player.getQueue((s4dmessage.guild).id)).setPaused(true)
			s4dmessage.channel.send({content: String('paused music')});
		}
		if (command == 's!resume') {
			if ((s4dmessage.member.voice.channel) == null) {
				s4dmessage.channel.send({content: String('you are not in a voice channel!')});
				return
			}
			if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
				s4dmessage.channel.send({content: String('you are not in my voice channel!')});
				return
			}
			if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
				s4dmessage.channel.send({content: String('there is no music playing!')});
				return
			}
			(s4d.player.getQueue((s4dmessage.guild).id)).setPaused(false)
			s4dmessage.channel.send({content: String('resumed the music')});
		}
		if (command == 's!stop') {
			if ((s4dmessage.member.voice.channel) == null) {
				s4dmessage.channel.send({content: String('you are not in a voice channel!')});
				return
			}
			if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
				s4dmessage.channel.send({content: String('you are not in my voice channel!')});
				return
			}
			if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
				s4dmessage.channel.send({content: String('there is no music playing!')});
				return
			}
			(s4d.player.getQueue((s4dmessage.guild).id)).destroy()
			s4dmessage.channel.send({content: String('stopped music')});
		}
		if (command == 's!volume') {
			volume = arguments2[0];
			if ((s4dmessage.member.voice.channel) == null) {
				s4dmessage.channel.send({content: String('you are not in a voice channel!')});
				return
			}
			if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
				s4dmessage.channel.send({content: String('you are not in my voice channel!')});
				return
			}
			if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
				s4dmessage.channel.send({content: String('there is no music playing!')});
				return
			}
			if ((Number(volume)) < 0) {
				s4dmessage.channel.send({content: String('the volume need to be more then 0!')});
				return
			}
			if ((Number(volume)) > 100) {
				s4dmessage.channel.send({content: String('the volume need to be less then 100!')});
				return
			}
			(s4d.player.getQueue((s4dmessage.guild).id)).setVolume(volume)
			s4dmessage.channel.send({content: String(('the volume is now ' + String(volume)))});
		}
		if (command == 's!skip') {
			if ((s4dmessage.member.voice.channel) == null) {
				s4dmessage.channel.send({content: String('you are not in a voice channel!')});
				return
			}
			if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
				s4dmessage.channel.send({content: String('you are not in my voice channel!')});
				return
			}
			if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
				s4dmessage.channel.send({content: String('there is no music playing!')});
				return
			}
			(s4d.player.getQueue((s4dmessage.guild).id)).skip()
			s4dmessage.channel.send({content: String(('skipped music ' + String((s4d.player.getQueue((s4dmessage.guild).id)).current)))});
		}
		if (command == 's!loop') {
			onoff = arguments2[0];
			if (onoff == 'on') {
				if ((s4dmessage.member.voice.channel) == null) {
					s4dmessage.channel.send({content: String('you are not in a voice channel!')});
					return
				}
				if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
					s4dmessage.channel.send({content: String('you are not in my voice channel!')});
					return
				}
				if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
					s4dmessage.channel.send({content: String('there is no music playing!')});
					return
				}
				(s4d.player.getQueue((s4dmessage.guild).id)).setRepeatMode(QueueRepeatMode.QUEUE)
				s4dmessage.channel.send({content: String('loop on')});
			} else if (onoff == 'off') {
				if ((s4dmessage.member.voice.channel) == null) {
					s4dmessage.channel.send({content: String('you are not in a voice channel!')});
					return
				}
				if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
					s4dmessage.channel.send({content: String('you are not in my voice channel!')});
					return
				}
				if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
					s4dmessage.channel.send({content: String('there is no music playing!')});
					return
				}
				(s4d.player.getQueue((s4dmessage.guild).id)).setRepeatMode(QueueRepeatMode.OFF)
				s4dmessage.channel.send({content: String('loop off')});
			} else {
				s4dmessage.channel.send({content: String('you need to send !loop on/off')});
			}
		}
		if (command == 's!back') {
			if ((s4dmessage.member.voice.channel) == null) {
				s4dmessage.channel.send({content: String('you are not in a voice channel!')});
				return
			}
			if ((s4dmessage.member.voice.channelId) != (s4dmessage.guild.me.voice.channelId)) {
				s4dmessage.channel.send({content: String('you are not in my voice channel!')});
				return
			}
			if (!((s4d.player.getQueue((s4dmessage.guild).id)).playing)) {
				s4dmessage.channel.send({content: String('there is no music playing!')});
				return
			}
			(s4d.player.getQueue((s4dmessage.guild).id)).back()
			s4dmessage.channel.send({content: String('playing previous music')});
		}

	});

	return s4d
})();

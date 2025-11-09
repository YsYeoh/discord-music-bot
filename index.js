require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const $ = require( "jquery" );
const search = require("yt-search");
const ytdl = require("ytdl-core");
const { 
  joinVoiceChannel, 
  getVoiceConnection,
  VoiceConnectionStatus,
  AudioPlayerStatus 
} = require('@discordjs/voice');

const TOKEN = process.env.TOKEN;

const PREFIX = '!';

var servers = {};

client.login(TOKEN);

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  let args = msg.content.substring(PREFIX.length).split(" ");
  //let data = "https://www.youtube.com/results?search_query=%E6%9D%8E%E8%8D%A3%E6%B5%A9%E5%90%88%E9%9B%86";
  //console.log(data);
  
  switch (args[0]){
    case 'play':
      function play(connection, msg){
        var server = servers[msg.guild.id];
        server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter: "audioonly"}))
        server.queue.shift();
        server.dispatcher.on("end", function(){
          if(server.queue[0]){
            play(connection, msg);
          } else{
            connection.disconnect();
          }
        })
      }

      if(!args[1]){
        msg.channel.send("You need to provide a link!")
        return;
      }

      if(!msg.member.voiceChannel){
        msg.channel.send("You must be in a channel to play the bot!");
        return;
      }

      if(!servers[msg.guild.id]) servers[msg.guild.id] = {
        queue : []
      }

      var server = servers[msg.guild.id];

      if(args[1].substring(0,4) !== "http"){
        var searchStr = "";
        for(var i=1; i<args.length; i++){
          searchStr += args[i] + " ";
        } 
        console.info(searchStr);
        search(searchStr, getVideo);
      }
      else{
        server.queue.push(args[1]);
        msg.channel.send("Play " + args[1]);
      }

      function getVideo(err, res){
        if(err) throw err;

        let videos = res.videos.slice(0,1);
        server.queue.push(videos[0].url);
        msg.channel.send("Play " + videos[0].url);
      }

      
      if(!msg.guild.voiceConnection) msg.member.voiceChannel.join().then(function(connection){
        play(connection, msg);
      })

    break;

    case 'skip':
      var server = servers[msg.guild.id];
      if(server.dispatcher) server.dispatcher.end();
      msg.channel.send("Skipping the song!");
    break;

    case 'stop':
      var server = servers[msg.guild.id];
      if(msg.guild.voiceConnection){
        for(var i= server.queue.length -1; i>=0; i--){
          server.queue.splice(i, 1);
        }

        server.dispatcher.end();
        msg.channel.send("Ending the queue leaving the voice channel!");
      }

      if(msg.guild.voiceConnection) msg.guild.voiceConnection.disconnect();
    break;

    case 'ping':
      msg.reply('pong');
      msg.channel.send('pong');
    break;

    case 'help':
      msg.channel.send("WELCOME TO SOHAIKIA SERVER\n<---------------------------------------------------------------------------------->\n<!play> to play a song (Example, !play https://www.example.com)\n<!skip> to skip current song\n<!stop> to clear the queue song\n<!love> to fuck you\n<!queue> to see the queue musics");
    break;

    case 'love':
      msg.reply("FUCK YOU");
    break;

    case 'queue':
      var server = servers[msg.guild.id];
      var str = "Music in Queue\n==================================================================\n";
      for(var i=0; i<server.queue.length; i++){
        str += i+1 + ") " + server.queue[i] + "\n"
      }
      msg.channel.send(str);
    break;
  }
});

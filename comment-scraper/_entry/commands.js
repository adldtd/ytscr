const path = require("path");

const comments_cli = require(path.join(__dirname, "..", "comments", "cli")).cli;
const chat_cli = require(path.join(__dirname, "..", "chat", "cli")).cli;
const videos_cli = require(path.join(__dirname, "..", "videos", "cli")).cli;

const scrape_comments = require(path.join(__dirname, "..", "comments", "comment-scraper")).scrape;
const scrape_chat = require(path.join(__dirname, "..", "chat", "chat-scraper")).scrape;
const scrape_videos = require(path.join(__dirname, "..", "videos", "video-scraper")).scrape;


  /***********************************************************************/
 /* The "entry level" commands; specify which part of YouTube to scrape */
/***********************************************************************/


const cmd = {

  "help": {
    aliases: ["help"],
    simpleDescription: "Displays command information",
    description: "A command which takes in another command name as the next input. By specifiying a valid " +
    "command, the program will print some info as well as the usability of that cmd. All commands have their " +
    "help commands, which can be accessed by typing \"ytscr [COMMAND NAME HERE] help\".",
    examples: ["help comments"],
  },

  "comments": {
    aliases: ["comments"],
    simpleDescription: "Command for YouTube comment scraping",
    description: "A command which scrapes comment data from a video. Requires one video as input (see \"" +
    "comments help input\" for a more detailed description.) Records the author, the author id, the author " +
    "image, the comment text, the comment id, the date published, the votes, and the replies.",
    examples: ["comments v=https://www.youtube.com/watch?v=jNQXAC9IVRw"],
    cli: comments_cli,
    scrape: scrape_comments
  },

  "chat": {
    aliases: ["chat"],
    simpleDescription: "Command for YouTube chat message scraping",
    description: "A command which scrapes message data from a live chat. Requires one video as input (see \"" +
    "chat help video\" for a more detailed description), which is/was a stream or a premiere with enabled " +
    "chat. Records the author, the author id, the author image, the message text, the message id, and the " +
    "timestamp (in milliseconds).",
    examples: ["chat v=https://www.youtube.com/watch?v=1fueZCTYkpA"],
    cli: chat_cli,
    scrape: scrape_chat
  },

  "videos": {
    aliases: ["videos"],
    simpleDescription: "Command for searching and scraping videos",
    description: "A command which scrapes video data retrieved from a search query. Requires a string as input " +
    "(see \"videos help search\"). Records the author, the name of the video, a \"snippet\" (part of the " +
    "description), the video time, the views, the date published, the video thumbnail, the video id, the " +
    "author's picture, and their channel id. NOTE: Although the region is defined as the US in " +
    "config_data.json, because of how YouTube works, the videos retrieved are heavily dependent on your IP " +
    "address location.",
    examples: ["videos s=ytscr"],
    cli: videos_cli,
    scrape: scrape_videos
  }

}

module.exports.cmd = cmd;
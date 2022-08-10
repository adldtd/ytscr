const path = require("path");

const comments = require(path.join(__dirname, "..", "comments", "cli"));
const chat = require(path.join(__dirname, "..", "chat", "cli"));

const scrape_comments = require(path.join(__dirname, "..", "comments", "comment-scraper"));
const scrape_chat = require(path.join(__dirname, "..", "chat", "chat-scraper"));


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
    examples: ["comments i=https://www.youtube.com/watch?v=jNQXAC9IVRw"],
    cli: comments.cli,
    scrape: scrape_comments.scrape
  },

  "chat": {
    aliases: ["chat"],
    simpleDescription: "Command for YouTube chat message scraping",
    description: "A command which scrapes message data from a live chat. Requires one video as input (see \"" +
    "chat help input\" for a more detailed description), which is/was a stream or a premiere with enabled " +
    "chat. Records the author, the author id, the author image, the message text, the message id, and the " +
    "timestamp (in milliseconds).",
    examples: ["chat i=https://www.youtube.com/watch?v=1fueZCTYkpA"],
    cli: chat.cli,
    scrape: scrape_chat.scrape
  }

}

module.exports.cmd = cmd;
const comments = require(__dirname + "/comments/cli");

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
    cli: comments.cli
  }

}

module.exports.cmd = cmd;
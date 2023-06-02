const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));

const subscribeDmodule = require(path.join(__dirname, "..", "..", "common", "subscribe-dmodule")).subscribeDmodule;
const subscribeMeta = require(path.join(__dirname, "..", "..", "common", "subscribe-meta")).subscribeMeta;
const { basicFilterableCli, basicUnfilterableCli } = require("../../common/cli_funcs");

const meta_cmd = require("./meta/commands").cmd;
const comments_cmd = require("./comments/commands").cmd;
const chat_cmd = require("./chat/commands").cmd;
const recommended_cmd = require("./recommended/commands").cmd;

const meta_scraper = require(path.join(__dirname, "meta", "meta-scraper")).scraper;
const comment_scraper = require(path.join(__dirname, "comments", "comment-scraper")).scraper;
const chat_scraper = require(path.join(__dirname, "chat", "chat-scraper")).scraper;
const recommended_scraper = require(path.join(__dirname, "recommended", "recommended-scraper")).scraper;


  /******************************************/
 /* The video module commands + submodules */
/******************************************/


const cmd = {

  modules: { //Special commands that allow entrance to other subcommands/submodules
  //In this case, these need to be specified at the start
  
    "meta": {
      aliases: ["meta"],
      simpleDescription: "Submodule for scraping metadata from a YouTube video",
      description: "The submodule for retrieving inner video information (the title, uploader, description, " +
      "etc).",
      examples: ["meta [argument 1] [argument 2] ... #"],
      cli: (args, currentState, settings) =>
        basicUnfilterableCli(meta_cmd, "video", "meta", args, currentState, settings),
      scrape: meta_scraper
    },

    "comments": {
      aliases: ["comments"],
      simpleDescription: "Submodule for scraping comments from a YouTube video",
      description: "The submodule for retrieving comment data inside a YouTube video.",
      examples: ["comments [argument 1] [argument 2] ... #"],
      cli: (args, currentState, settings) => {
        let result = basicFilterableCli(comments_cmd, "video", "comments", args, currentState, settings);
        if (result !== 0) return result;

        if (!settings.comments.replies && !settings.comments.nrf)
          console.log("WARNING: -nrf is specified alongside --noreply, making the former redundant (no replies will be saved).");

        return 0;
      },
      scrape: comment_scraper
    },

    "chat": {
      aliases: ["chat"],
      simpleDescription: "Submodule for scraping live chat replay from a YouTube video",
      description: "The submodule for retrieving chat data from a past livestream/premiere. Will be ignored " +
      "if the video was not live in the past (and if it is an ongoing livestream.)",
      examples: ["chat [argument 1] [argument 2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(chat_cmd, "video", "chat", args, currentState, settings),
      scrape: chat_scraper
    },

    "recommended": {
      aliases: ["recommended"],
      simpleDescription: "Submodule for scraping recommendations for a YouTube video",
      description: "The submodule for retrieving recommended videos. The amount of recommendations heavily depends " +
      "on the video type, its uploader, and the time of access.",
      examples: ["recommended [argument 1] [argument 2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(recommended_cmd, "video", "recommended", args, currentState, settings),
      scrape: recommended_scraper
    }

  },

  commands: {

    "-i": {redirect: "--input"},
    "--input": {
      aliases: ["--input", "-i"],
      simpleDescription: "The video from which to scrape",
      description: "A command which takes in a video link as input. Required argument for scraping to function. " +
      "Can be either a direct link, a \"youtu.be\" link, a shorts link, or a pure video ID.",
      examples: ["--input <VIDEO LINK>"],
      call: inputCall,
      numArgs: 1
    }

  }

}

//*************************************************************************** Settings for the CLI

let validModules = cmd.modules;


var thisSettings = {
  input: ""
}

var thisCurrentState = {
  
}


subscribeDmodule(validModules, cmd.commands, thisCurrentState, thisSettings);
subscribeMeta(cmd.commands);

//*************************************************************************** CLI call functions

function inputCall(parsed, currentState, innerState, settings, innerSettings) {

  let command = parsed.command;
  let argument = parsed.args[0];

  if (innerSettings.input === "") {
      
    if (argument.substring(0, 32) === "https://www.youtube.com/watch?v=" || argument.substring(0, 24) === "www.youtube.com/watch?v=" || argument.substring(0, 20) === "youtube.com/watch?v=") {
      innerSettings.input = argument;
    } else if (argument.substring(0, 31) === "https://www.youtube.com/shorts/" || argument.substring(0, 23) === "www.youtube.com/shorts/" || argument.substring(0, 19) === "youtube.com/shorts/") {
      innerSettings.input = "https://youtube.com/watch?v=" + argument.split("shorts/", 2)[1]; //YouTube shorts are converted to videos this way
    } else if (argument.substring(0, 17) === "https://youtu.be/" || argument.substring(0, 9) === "youtu.be/") {
      innerSettings.input = "https://youtube.com/watch?v=" + argument.split(".be/", 2)[1];
    } else if (argument.length === 11) { //Pure video ID
      innerSettings.input = "https://youtube.com/watch?v=" + argument;
    } else
      currentState.error = errors.errorCodes(-2, command, argument);
        
  } else
    currentState.error = errors.errorCodes(-1, command, argument);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
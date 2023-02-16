const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));
const helpers = require("../../common/helpers");

const subscribeDmodule = require(path.join(__dirname, "..", "..", "common", "subscribe-dmodule")).subscribeDmodule;
const subscribeMeta = require(path.join(__dirname, "..", "..", "common", "subscribe-meta")).subscribeMeta;

const videos_cli = require("./videos/cli").cli;

const videos_scrape = require("./videos/videos-scraper").scrape;


var validModules = {/*meta: "",*/ videos: ""};

const cmd = {

  modules: {

    /*"meta": {
      aliases: ["meta"],
      simpleDescription: "Submodule for playlist metadata",
      description: "A submodule that focuses on the metadata inside the playlist.",
      examples: ["meta [argument1] [argument2] ... #"],
      cli: undefined,
      scrape: undefined
    },*/

    "videos": {
      aliases: ["videos"],
      simpleDescription: "Submodule for all the videos in the playlist",
      description: "A submodule that focuses on the videos contained in the playlist.",
      examples: ["videos [argument1] [argument2] ... #"],
      cli: videos_cli,
      scrape: videos_scrape
    }

  },

  commands: {

    "-i": {redirect: "--input"},
    "--input": {
      aliases: ["--input", "-i"],
      simpleDescription: "The playlist from which to scrape",
      description: "A command which takes in a video link as input. Required argument for scraping to function. " +
      "Can be either a direct link or a pure playlist ID.",
      examples: ["--input <PLAYLIST LINK>"],
      call: inputCall,
      numArgs: 1
    }

  }
  
};

let commands = cmd.commands;
subscribeDmodule(validModules, commands);
subscribeMeta(commands);


function inputCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (innerSettings.input === "") {
      
    if (a.substring(0, 38) === "https://www.youtube.com/playlist?list=" || a.substring(0, 30) === "www.youtube.com/playlist?list=" || a.substring(0, 26) === "youtube.com/playlist?list=") {
      innerSettings.input = a;
    } else if (a.length === 34) { //Pure playlist ID
      innerSettings.input = "https://www.youtube.com/playlist?list=" + a;
    } else
      currentState.error = errors.errorCodes(-4, c, a);
        
  } else
    currentState.error = errors.errorCodes(-1, c, a);
}


module.exports.cmd = cmd;
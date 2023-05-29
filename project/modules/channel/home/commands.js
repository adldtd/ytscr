const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const basicFilterableCli = require("../../../common/cli_funcs").basicFilterableCli;
const subscribeDmoduleSimple = require("../../../common/subscribe-dmodule").subscribeDmoduleSimple;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;

const videosResults_cmd = require("./results/commands").cmdVideos;
const shortsResults_cmd = require("./results/commands").cmdShorts;
const playlistsResults_cmd = require("./results/commands").cmdPlaylists;
const channelsResults_cmd = require("./results/commands").cmdChannels;


  /************************************************************************/
 /* Arguments + commands and corresponding functions for the home module */
/************************************************************************/

const cmd = {

  modules: {

    "videos": {
      aliases: ["videos"],
      simpleDescription: "Submodule for the homepage's videos",
      description: "A submodule that focuses on the homepage's listed videos. Part of the greater \"results\" section.",
      examples: ["videos [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(videosResults_cmd, "channel", "videosResults", args, currentState, settings),
      scrape: null
    },

    "shorts": {
      aliases: ["shorts"],
      simpleDescription: "Submodule for the homepage's shorts",
      description: "A submodule that focuses on the homepage's listed shorts. Part of the greater \"results\" section.",
      examples: ["shorts [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(shortsResults_cmd, "channel", "shortsResults", args, currentState, settings),
      scrape: null
    },

    "playlists": {
      aliases: ["playlists"],
      simpleDescription: "Submodule for the homepage's playlists",
      description: "A submodule that focuses on the homepage's listed playlists. Part of the greater \"results\" section.",
      examples: ["playlists [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(playlistsResults_cmd, "channel", "playlistsResults", args, currentState, settings),
      scrape: null
    },

    "channels": {
      aliases: ["channels"],
      simpleDescription: "Submodule for the homepage's channels",
      description: "A submodule that focuses on the homepage's listed channels. Part of the greater \"results\" section.",
      examples: ["channels [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(channelsResults_cmd, "channel", "channelsResults", args, currentState, settings),
      scrape: null
    }

  },

  commands: {

    "-sep": {redirect: "--seperate"},
    "--seperate": {
      aliases: ["--seperate", "-sep"],
      simpleDescription: "Specifies how to categorize results",
      description: "A flag that tells the scraper how to split up results. By default, all retrieved " +
      "data is placed into the same array (in the order that it was found). Each data piece has an unremovable " +
      "attribute known as \"type\", which either classifies it as a video, channel, etc. Raising this flag " +
      "removes the \"type\" attribute, and makes it so all data pieces are placed into seperate categories.",
      call: seperateCall,
      numArgs: 0
    },

    "-nsec": {redirect: "--nosections"},
    "--nosections": {
      aliases: ["--nosections", "-nsec"],
      simpleDescription: "Stops section names/data from being scraped",
      description: "A flag which tells the scraper to stop saving section information during data collection. " +
      "By default, the scraper places data into \"section packs,\" which include the section title, a section " +
      "subtitle, and a list of items. This flag causes the scraper to simply append that list of items to the " +
      "greater list, instead of placing it into a section.",
      call: nosectionsCall,
      numArgs: 0
    },

    "-l": {redirect: "--lim"},
    "--lim": {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of content scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all items " +
      "are retrieved. NOTE: The value entered limits the amount of ALL content (across ALL submodules).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    }

  }
  
};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;
let validModules = cmd.modules;


var thisSettings = {
  seperate: false,
  nosections: false,
  lim: Number.POSITIVE_INFINITY
}

var thisCurrentState = {

}


subscribeDmoduleSimple(validModules, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function seperateCall(parsed, currentState, innerState, settings, innerSettings) {
  innerSettings.seperate = true;
}

function nosectionsCall(parsed, currentState, innerState, settings, innerSettings) {
  innerSettings.nosections = true;
}

function limCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!isNaN(parseInt(a))) {
    a = parseInt(a);
    if (a > 0)
      innerSettings.lim = a;
    else
      currentState.error = errors.errorCodes(15, c, a);
  } else
    currentState.error = errors.errorCodes(16, c, a);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
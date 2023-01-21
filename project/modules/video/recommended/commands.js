const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeDmoduleSimple = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-dmodule")).subscribeDmoduleSimple;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;

const results_cli = require("./results/cli").cli;

const validModules = {videos: "", playlists: ""};


const cmd = {

  modules: {

    videos: {
      aliases: ["videos"],
      simpleDescription: "Submodule for dealing with recommended videos",
      description: "A submodule that focuses solely on recommended videos.",
      examples: ["videos [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    },

    playlists: {
      aliases: ["playlists"],
      simpleDescription: "Submodule for dealing with recommended playlists",
      description: "A submodule that focuses solely on recommended playlists.",
      examples: ["playlists [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    },

    mixes: {
      aliases: ["mixes"],
      simpleDescription: "Submodule for dealing with recommended YouTube Mixes",
      description: "A submodule that focuses solely on recommeded mixes (infinite playlists).",
      examples: ["mixes [argument1] [argument2] .. #"],
      cli: results_cli,
      scrape: undefined
    }

  },

  commands: {

    "-sep": {redirect: "--seperate"},
    "--seperate": {
      aliases: ["--seperate", "-sep"],
      simpleDescription: "Specifies how to categorize results",
      description: "A flag that tells the scraper how to split up recommendations. By default, all retrieved " +
      "data is placed into the same array (in the order that it was found). Each data piece has an unremovable " +
      "attribute known as \"type\", which either classifies it as a video or a playlist. Raising this flag " +
      "removes the \"type\" attribute, and makes it so all data pieces are placed into seperate categories.",
      call: seperateCall,
      numArgs: 0
    },

    "-l": {redirect: "--lim"},
    "--lim":
    {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of recommendations scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all recommendations " +
      "are retrieved. NOTE: The value entered limits the scraper based on how many results were checked, " +
      "not how many matched the filters (see limfilter).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    }

  },

};


var commands = cmd.commands;
subscribeDmoduleSimple(validModules, commands);
subscribeMeta(commands);


function seperateCall(parsed, currentState, innerState, settings, innerSettings) {
  if (!innerSettings.savesections)
    innerSettings.seperate = true;
  else
    currentState.error = errors.errorCodesConflict(0, parsed.command, "--savesections");
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
const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));
const helpers = require("../../common/helpers");
const map = helpers.map;

const subscribeDmodule = require(path.join(__dirname, "..", "..", "common", "subscribe-dmodule")).subscribeDmodule;
const subscribeMeta = require(path.join(__dirname, "..", "..", "common", "subscribe-meta")).subscribeMeta;

const meta_cli = require("./meta/cli").cli;
const results_cli = require("./results/cli").cli;


const validTimeFrames = {LastHour: "",
                       Today: "",
                       ThisWeek: "",
                       ThisMonth: "",
                       ThisYear: ""};

const validTypes = {Video: "",
                  Channel: "",
                  Playlist: "",
                  Movie: ""};

const validDurations = {"Under4Minutes": "Under 4 minutes",
                      "4-20Minutes": "4-20 minutes",
                      "Over20Minutes": "Over 20 minutes"};

const validFeatures = {"Live": "Livestream",
                     "4K": "4K Video",
                     "HD": "High Definition",
                     "Subtitles/CC": "Includes subtitles",
                     "CreativeCommons": "",
                     "360": "360 video",
                     "VR180": "",
                     "3D": "",
                     "HDR": "",
                     "Location": "",
                     "Purchased": ""};

const validMetrics = {Relevance: "",
                    UploadDate: "Sorts from most recent to least",
                    ViewCount: "Sorts from highest views to lowest",
                    Rating: "Sorts from least likes to most"};


const cmd = {
  
  modules: {

    "meta": {
      aliases: ["meta"],
      simpleDescription: "Submodule for search metadata",
      description: "A submodule that focuses on the metadata surrounding search results.",
      examples: ["meta [argument1] [argument2] ... #"],
      cli: meta_cli,
      scrape: undefined
    },

    "videos": {
      aliases: ["videos"],
      simpleDescription: "Submodule for working with video results",
      description: "A submodule that focuses on retrieved videos. Part of the greater \"results\" section.",
      examples: ["videos [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    },

    "shorts": {
      aliases: ["shorts"],
      simpleDescription: "Submodule for working with shorts results",
      description: "A submodule that focuses on retrieved YouTube shorts. Part of the greater \"results\" " +
      "section. NOTE: Shorts are technically videos, just in this case they tend to have less search information " +
      "- thus they are made seperate.",
      examples: ["shorts [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    },

    "channels": {
      aliases: ["channels"],
      simpleDescription: "Submodule for working with channel results",
      description: "A submodule that focuses on retrieved channels. Part of the greater \"results\" section.",
      examples: ["channels [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    },

    "playlists": {
      aliases: ["playlists"],
      simpleDescription: "Submodule for working with playlist results",
      description: "A submodule that focuses on retrieved playlists. Part of the greater \"results\" section.",
      examples: ["playlists [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    },

    "mixes": {
      aliases: ["mixes"],
      simpleDescription: "Submodule for working with YouTube Mix results",
      description: "A submodule that focuses on retrieved YouTube Mixes. Part of the greater \"results\" section. " +
      "NOTE: Mixes are considered by YouTube as (infinite) playlists, though they tend to have less information " +
      "alongside them - thus they are made seperate.",
      examples: ["mixes [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    },

    "movies": {
      aliases: ["movies"],
      simpleDescription: "Submodule for working with movie results",
      description: "A submodule that focuses on retrieved movies. Part of the greater \"results\" section.",
      examples: ["movies [argument1] [argument2] ... #"],
      cli: results_cli,
      scrape: undefined
    }

  },

  commands: {

    "-i": {redirect: "--input"},
    "--input": {
      aliases: ["--input", "-i"],
      simpleDescription: "The term/sentence to be searched",
      description: "A command which takes in a search query as input. Results may depend heavily on external " +
      "factors, such as your location, or your IP address. Certain queries will have no results.",
      examples: ["--input chess", "-i \"Me at the zoo\""],
      call: inputCall,
      numArgs: 1
    },

    "-sep": {redirect: "--seperate"},
    "--seperate": {
      aliases: ["--seperate", "-sep"],
      simpleDescription: "Specifies how to categorize results",
      description: "A flag that tells the scraper how to split up search results. By default, all retrieved " +
      "data is placed into the same array (in the order that it was found). Each data piece has an unremovable " +
      "attribute known as \"type\", which either classifies it as a video, channel, etc. Raising this flag " +
      "removes the \"type\" attribute, and makes it so all data pieces are placed into seperate categories.",
      call: seperateCall,
      numArgs: 0
    },

    "-ssec": {redirect: "--savesections"},
    "--savesections": {
      aliases: ["--savesections", "-ssec"],
      simpleDescription: "Saves section names/data during result scraping",
      description: "A flag which tells the scraper to save information \"sections\" while collecting data. " +
      "When returning results, YouTube sometimes wraps results into seperate packs (i.e. \"People also " +
      "watched\"). This flag causes the program to retain that info, wrapping saved results in nested lists. " +
      "NOTE: This flag is mutually exclusive with --seperate.",
      call: savesectionsCall,
      numArgs: 0
    },

    "-tfr": {redirect: "--tframe"},
    "--tframe": {
      aliases: ["--tframe", "-tfr"],
      simpleDescription: "Part of the filters section; caps results that were uploaded in a specific timeframe",
      description: "A command which takes in an upload time, which YouTube can use to fine-tune/filter " +
      "searching. Only one choice may be specified. By default, no fixed frame is specified, meaning YouTube " +
      "can return videos within any time frame.",
      validValues: validTimeFrames,
      examples: ["--tframe LastHour", "-tfr \"ThisMonth\""],
      call: genericValidityOneTimeCall,
      numArgs: 1
    },

    "-tp": {redirect: "--type"},
    "--type": {
      aliases: ["--type", "-tp"],
      simpleDescription: "Part of the filters section; forces results to be of (or related to) a specific type",
      description: "A command which takes in the type of result to be retrieved, which YouTube uses to " +
      "automatically filter searching. Only one choice may be selected. By default, no type is specified, " +
      "meaning YouTube can return results of any type. NOTE: This is not at all similar to the \"--exclude\" " +
      "command; the latter tends to be more \"restrictive\" (for example, doing \"--type movie\" without " +
      "\"--exclude videos\" may result in some videos being saved.)",
      validValues: validTypes,
      examples: ["--type Movie", "-tp \"Video\""],
      call: genericValidityOneTimeCall,
      numArgs: 1
    },

    "-dur": {redirect: "--duration"},
    "--duration": {
      aliases: ["--duration", "-dur"],
      simpleDescription: "Part of the filters section; forces all (video + movie) results to be of a certain duration",
      description: "A command which takes in a duration, which YouTube uses to automatically filter searching. " +
      "Only one choice may be selected. By default, no duration is specified - YouTube can return videos of any " +
      "duration. NOTE: This command is only \"valid\" for video and movie results.",
      validValues: validDurations,
      examples: ["--duration 4-20Minutes", "-dur \"Over20Minutes\""],
      call: genericValidityOneTimeCall,
      numArgs: 1
    },

    "-ft": {redirect: "--features"},
    "--features": {
      aliases: ["--features", "-ft"],
      simpleDescription: "Part of the filters section; passes selected content features for YouTube to filter",
      description: "A command which takes in a certain \"feature\", which YouTube uses to filter videos. In " +
      "short, YouTube only returns content that has the designated feature. This command can be input " +
      "multiple times, with different features. NOTE: Some combinations of features may be \"unique\", and thus " +
      "not return any content at all.",
      validValues: validFeatures,
      examples: ["--features Live", "-ft \"360\""],
      call: featuresCall,
      numArgs: 1
    },

    "-st": {redirect: "--sort"},
    "--sort": {
      aliases: ["--sort", "-st"],
      simpleDescription: "Part of the filters section; tells YouTube how it should sort returned results",
      description: "A command which takes in a metric, which YouTube uses to sort search results. Only one " +
      "choice may be selected. By default, YouTube sorts by \"relevance\", which is highly dependent on " +
      "time, as well as the user's location. NOTE: Most of the search metrics only apply to videos and movies.",
      validValues: validMetrics,
      examples: ["--sort Rating", "-st \"UploadDate\""],
      call: genericValidityOneTimeCall,
      numArgs: 1
    },

    "-l": {redirect: "--lim"},
    "--lim":
    {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of content scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all search items " +
      "are retrieved. NOTE: The value entered limits the amount of ALL content (across ALL submodules).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    }

  }
}

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;
let validModules = cmd.modules;


var thisSettings = {
  input: "",

  seperate: false,
  savesections: false,

  lim: Number.POSITIVE_INFINITY,
  tframe: "",
  type: "",
  duration: "",
  features: {},
  sort: ""
}

var thisCurrentState = {

}


subscribeDmodule(validModules, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function inputCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];
  
  if (innerSettings.input === "") {
    if (a !== "")
      innerSettings.input = a;
    else
      currentState.error = errors.errorCodes(-3, c, a);
  } else
    currentState.error = errors.errorCodes(-1, c);
}

function seperateCall(parsed, currentState, innerState, settings, innerSettings) {
  if (!innerSettings.savesections)
    innerSettings.seperate = true;
  else
    currentState.error = errors.errorCodesConflict(0, parsed.command, "--savesections");
}

function savesectionsCall(parsed, currentState, innerState, settings, innerSettings) {
  if (!innerSettings.seperate)
    innerSettings.savesections = true;
  else
    currentState.error = errors.errorCodesConflict(0, parsed.command, "--seperate");
}

//Call for all commands which accept one unique (originally === ""), must-be-valid input
function genericValidityOneTimeCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  c = ("redirect" in commands[c]) ? commands[c].redirect : c;
  //This assumes the name of the variable inside innerSettings is equal to the command name, minus the dashes
  let variable = c.split("-"); variable = variable[variable.length - 1];

  if (innerSettings[variable] === "") {
    if (a in commands[c].validValues)
      innerSettings[variable] = a;
    else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, commands[c].validValues);
    }
  } else
    currentState.error = errors.errorCodes(-1, c);
}

function featuresCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (a in commands["--features"].validValues)
    innerSettings.features[a] = "";
  else
    currentState.error = errors.errorCodes(3, c, a);
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
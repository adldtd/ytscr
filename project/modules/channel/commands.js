const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));

const subscribeDmodule = require(path.join(__dirname, "..", "..", "common", "subscribe-dmodule")).subscribeDmodule;
const subscribeMeta = require(path.join(__dirname, "..", "..", "common", "subscribe-meta")).subscribeMeta;
const { basicFilterableCli, basicUnfilterableCli } = require("../../common/cli_funcs");

const videos_cmd = require("./videos/commands").cmd;
const shorts_cmd = require("./shorts/commands").cmd;
const live_cmd = require("./live/commands").cmd;
const playlists_cmd = require("./playlists/commands").cmd;
const community_cmd = require("./community/commands").cmd;
const store_cmd = require("./store/commands").cmd;
const channels_cmd = require("./channels/commands").cmd;
const about_cmd = require("./about/commands").cmd;

const videos_scrape = require("./videos/videos-scraper").scrape;
const shorts_scrape = require("./shorts/shorts-scraper").scrape;
const live_scrape = require("./live/live-scraper").scrape;
const playlists_scrape = require("./playlists/playlists-scraper").scrape;
const community_scrape = require("./community/community-scraper").scrape;
const store_scrape = require("./store/store-scraper").scrape;
const channels_scrape = require("./channels/channels-scraper").scrape;


const cmd = {
  
  modules: {

    /*"meta": {
      aliases: ["meta"],
      simpleDescription: "Submodule for channel metadata",
      description: "A submodule that focuses on metadata found in the channel. Distinct from the \"about\" " +
      "submodule.",
      examples: ["meta [argument1] [argument2] ... #"],
      cli: undefined,
      scrape: undefined
    },*/

    /*"about": {
      aliases: ["about"],
      simpleDescription: "Submodule for the channel's about section",
      description: "A submodule that focuses on the About section of the channel.",
      examples: ["about [argument1] [argument2] ... #"],
      cli: undefined,
      scrape: undefined
    },*/

    "videos": {
      aliases: ["videos"],
      simpleDescription: "Submodule for the channel's videos",
      description: "A submodule that focuses on the channel's uploaded videos.",
      examples: ["videos [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(videos_cmd, "channel", "videos", args, currentState, settings),
      scrape: videos_scrape
    },

    "shorts": {
      aliases: ["shorts"],
      simpleDescription: "Submodule for the channel's shorts",
      description: "A submodule that focuses on the channel's uploaded shorts.",
      examples: ["shorts [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(shorts_cmd, "channel", "shorts", args, currentState, settings),
      scrape: shorts_scrape
    },

    "live": {
      aliases: ["live"],
      simpleDescription: "Submodule for the channel's livestreams",
      description: "A submodule that focuses on the channel's past (and present) streams.",
      examples: ["live [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(live_cmd, "channel", "live", args, currentState, settings),
      scrape: live_scrape
    },

    "playlists": {
      aliases: ["playlists"],
      simpleDescription: "Submodule for the channel's playlists",
      description: "A submodule that focuses on the channel's public playlists.",
      examples: ["playlists [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => {
        let result = basicFilterableCli(playlists_cmd, "channel", "playlists", args, currentState, settings);
        if (result === -1 || result === 1) return result;

        if (settings.playlists.focusmode) { //Warns that unfocused or unexcluded sections will be automatically ignored
          for (let section in currentState.playlists.unwarnedSections) {
            let sectionData = currentState.playlists.unwarnedSections[section];
            if (sectionData.focussection === null)
              console.log("WARNING: Section \"" + section + "\" was not specified to be focused, but another was; the section will be automatically excluded.");
            delete currentState.playlists.unwarnedSections[section];
          }
        }
        return 0;
      },
      scrape: playlists_scrape
    },

    "community": {
      aliases: ["community"],
      simpleDescription: "Submodule for the channel's community tab",
      description: "A submodule that focuses on the channel's community posts.",
      examples: ["community [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => {
        let result = basicFilterableCli(community_cmd, "channel", "community", args, currentState, settings);
        if (result === -1 || result === 1) return result;

        if (settings.community.noattach) {
          for (let _ in currentState.community.focusList) {
            currentState.error = errors.errorCodesConflict(0, "--focus", "--noattach");
            return -1;
          }
          for (let _ in currentState.community.modulesCalled) {
            currentState.error = errors.errorCodesConflict(3, "--noattach", "");
            return -1;
          }
        }
        return 0;
      },
      scrape: community_scrape
    },

    "store": {
      aliases: ["store"],
      simpleDescription: "Submodule for the channel's store tab",
      description: "A submodule that focuses on the channel's listed products.",
      examples: ["store [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(store_cmd, "channel", "store", args, currentState, settings),
      scrape: store_scrape
    },

    "channels": {
      aliases: ["channels"],
      simpleDescription: "Submodule for the channel's channels tab",
      description: "A submodule that focuses on the channel's listed channels.",
      examples: ["channels [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => {
        let result = basicFilterableCli(channels_cmd, "channel", "channels", args, currentState, settings);
        if (result === -1 || result === 1) return result;

        if (settings.channels.focusmode) { //Warns that unfocused or unexcluded sections will be automatically ignored
          for (let section in currentState.channels.unwarnedSections) {
            let sectionData = currentState.channels.unwarnedSections[section];
            if (sectionData.focussection === null)
              console.log("WARNING: Section \"" + section + "\" was not specified to be focused, but another was; the section will be automatically excluded.");
            delete currentState.channels.unwarnedSections[section];
          }
        }
        return 0;
      },
      scrape: channels_scrape
    },

    "about": {
      aliases: ["about"],
      simpleDescription: "Submodule for the channel's about tab",
      description: "A submodule that focuses on the channel's \"about\" information.",
      examples: ["about [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) =>
        basicUnfilterableCli(about_cmd, "channel", "about", args, currentState, settings),
      scrape: null
    }

  },

  commands: {

    "-i": {redirect: "--input"},
    "--input": {
      aliases: ["--input", "-i"],
      simpleDescription: "The channel from which to scrape",
      description: "A command which takes in a channel link as input. Required argument for scraping to " +
      "function. Can be either a direct link or a channel handle or channel ID.",
      examples: ["--input <CHANNEL LINK>"],
      call: inputCall,
      numArgs: 1
    }

  }

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;
let validModules = cmd.modules;


var thisSettings = {
  input: ""
}

var thisCurrentState = {

}


subscribeDmodule(validModules, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function inputCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (innerSettings.input === "") {
      
    if (a.substring(0, 32) === "https://www.youtube.com/channel/" || a.substring(0, 24) === "www.youtube.com/channel/" || a.substring(0, 20) === "youtube.com/channel/") {
      innerSettings.input = a;
    } else if (a.substring(0, 25) === "https://www.youtube.com/@" || a.substring(0, 17) === "www.youtube.com/@" || a.substring(0, 13) === "youtube.com/@") {
      innerSettings.input = a;
    } else if (a[0] === "@") { //Channel handle
      innerSettings.input = "https://www.youtube.com/" + a;
    } else if (a.length === 24) { //Valid channel ID
      innerSettings.input = "https://www.youtube.com/channel/" + a;
    } else
      currentState.error = errors.errorCodes(-5, c, a);
        
  } else
    currentState.error = errors.errorCodes(-1, c, a);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
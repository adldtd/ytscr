const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const map = require("../../../common/helpers").map;

const basicFilterableCli = require("../../../common/cli_funcs").basicFilterableCli;
const subscribeDmoduleFilterable = require("../../../common/subscribe-dmodule-filterable").subscribeDmoduleFilterable;
const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;

const videoAttachments_cmd = require("./attachments/commands").cmdVideo;
const pollAttachments_cmd = require("./attachments/commands").cmdPoll;
const imageAttachments_cmd = require("./attachments/commands").cmdImage;


  /*****************************************************************************/
 /* Arguments + commands and corresponding functions for the community module */
/*****************************************************************************/

const attributes = {
  id: {
    type: "str",
    simpleDescription: "The post ID"
  },
  text: {
    type: "str",
    simpleDescription: "The post's text content"
  },
  likes: {
    type: "num",
    simpleDescription: "Num. likes"
  },
  comments: {
    type: "num",
    simpleDescription: "Num. comments"
  },
  posted: {
    type: "str",
    simpleDescription: "When the post was created"
  }
};


const cmd = {

  modules: {

    "video": {
      aliases: ["video"],
      simpleDescription: "Submodule for video attachments",
      description: "A submodule that focuses on videos attached to posts.",
      examples: ["video [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(videoAttachments_cmd, "channel", "videoAttachments", args, currentState, settings),
      scrape: null
    },

    "poll": {
      aliases: ["poll"],
      simpleDescription: "Submodule for poll attachments",
      description: "A submodule that focuses on polls attached to posts.",
      examples: ["poll [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(pollAttachments_cmd, "channel", "pollAttachments", args, currentState, settings),
      scrape: null
    },

    "image": {
      aliases: ["image"],
      simpleDescription: "Submodule for image attachments",
      description: "A submodule that focuses on images attached to posts.",
      examples: ["image [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicFilterableCli(imageAttachments_cmd, "channel", "imageAttachments", args, currentState, settings),
      scrape: null
    }

  },

  commands: {
    "-l": {redirect: "--lim"},
    "--lim": {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of posts scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all community posts are " +
      "retrieved. NOTE: The value entered limits the scraper based on how many posts were checked, " +
      "not how many matched the filters (see limfilter).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    },

    "-noat": {redirect: "--noattach"},
    "--noattach": {
      aliases: ["--noattach", "-noat"],
      simpleDescription: "Stops attachments from being scraped",
      description: "An argument which stops the scraper from collecting any community post attachments. By " +
      "default, unexcluded attachments are scraped; this flag makes it so the attachments attribute is removed " +
      "completely from all post results.",
      call: noattachCall,
      numArgs: 0
    }
  },

  attributes: attributes

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  _helper_modules: map(cmd.modules, ""),

  lim: Number.POSITIVE_INFINITY,
  noattach: false
}

var thisCurrentState = {

}


subscribeDmoduleFilterable(cmd.modules, commands, thisCurrentState, thisSettings);
subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function limCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!innerState.inFilter) {
    if (!isNaN(parseInt(a))) {
      a = parseInt(a);
      if (a > 0)
        innerSettings.lim = a;
      else
        currentState.error = errors.errorCodes(15, c, a);
    } else
      currentState.error = errors.errorCodes(16, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}

function noattachCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command;

  if (!innerState.inFilter)
    innerSettings.noattach = true; //Conflict with module calling and focusing is checked upon CLI exit
  else
    currentState.error = errors.errorCodes(2, c);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const basicUnfilterableCli = require("../../../common/cli_funcs").basicUnfilterableCli;
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
  },
  attachmentType: {
    type: "str",
    simpleDescription: "The type of the post's attachment"
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
        basicUnfilterableCli(videoAttachments_cmd, "channel", "videoAttachments", args, currentState, settings),
      scrape: null
    },

    "poll": {
      aliases: ["poll"],
      simpleDescription: "Submodule for poll attachments",
      description: "A submodule that focuses on polls attached to posts.",
      examples: ["poll [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicUnfilterableCli(pollAttachments_cmd, "channel", "pollAttachments", args, currentState, settings),
      scrape: null
    },

    "image": {
      aliases: ["image"],
      simpleDescription: "Submodule for image attachments",
      description: "A submodule that focuses on images attached to posts.",
      examples: ["image [argument1] [argument2] ... #"],
      cli: (args, currentState, settings) => 
        basicUnfilterableCli(imageAttachments_cmd, "channel", "imageAttachments", args, currentState, settings),
      scrape: null
    }

  },

  commands: {
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
  noattach: false
}

var thisCurrentState = {

}


subscribeDmoduleFilterable(cmd.modules, commands, thisCurrentState, thisSettings);
subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

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
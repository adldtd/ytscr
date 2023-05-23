const path = require("path");
//const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
//const helpers = require("../../../common/helpers");

const subscribeIgnorable = require("../../../common/subscribe-filterable").subscribeIgnorable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /**************************************************************************/
 /* Arguments + commands and corresponding functions for the videos module */
/**************************************************************************/

const attributes =
{
  id: {
    simpleDescription: "The playlist ID"
  },
  title: {
    simpleDescription: "The name of the playlist"
  },
  description: {
    simpleDescription: "The playlist description"
  },
  size: {
    simpleDescription: "Num. videos in the playlist"
  },
  views: {
    simpleDescription: "Num. views"
  },
  updated: {
    simpleDescription: "(Calendar) date of when the playlist was last changed"
  },
  uploader: {
    simpleDescription: "The name of the creator of the playlist"
  },
  handle: {
    simpleDescription: "The creator's channel handle"
  },
  channelId: {
    simpleDescription: "The creator's channel ID"
  }
};


const cmd = {

  commands: {},

  attributes: attributes

}

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {

}

var thisCurrentState = {

}


subscribeIgnorable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
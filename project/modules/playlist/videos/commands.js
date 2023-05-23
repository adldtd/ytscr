const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /**************************************************************************/
 /* Arguments + commands and corresponding functions for the videos module */
/**************************************************************************/

const attributes =
{
  id: {
    type: "str",
    simpleDescription: "The video ID"
  },
  title: {
    type: "str",
    simpleDescription: "The video title"
  },
  views: {
    type: "num",
    simpleDescription: "Num. views"
  },
  duration: {
    type: "num",
    simpleDescription: "Length of the video"
  },
  published: {
    type: "str",
    simpleDescription: "An approximate publish date (distance from the current date)"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Link to the video thumbnail"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the video uploader"
  },
  handle: {
    type: "str",
    simpleDescription: "The uploader's channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The uploader's channel ID"
  }
};


const cmd = {

  commands: {},

  attributes: attributes

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {

}

var thisCurrentState = {
  
}


subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
const path = require("path");
//const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
//const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));

const subscribeIgnorable = require("../../../common/subscribe-filterable").subscribeIgnorable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /******************************************************************************/
 /* Arguments + commands and corresponding functions for the video meta module */
/******************************************************************************/

const attributes =
{
  "id": {
    simpleDescription: "ID of the YouTube video"
  },
  "type": {
    simpleDescription: "The type of the \"video\" entered"
  },
  "title": {
    simpleDescription: "The video title"
  },
  "description": {
    simpleDescription: "The video description"
  },
  "tags": {
    simpleDescription: "An array of video tags"
  },
  "views": {
    simpleDescription: "Num. views"
  },
  "likes": {
    simpleDescription: "Num. likes"
  },
  "published": {
    simpleDescription: "Publish/stream date"
  },
  "durationMs": {
    simpleDescription: "Video duration in ms"
  },
  "comments": {
    simpleDescription: "Num. comments"
  },
  "uploader": {
    simpleDescription: "Name of uploader"
  },
  "subscribers": {
    simpleDescription: "Num. subscribers"
  },
  "handle": {
    simpleDescription: "Uploader's channel handle"
  },
  "channelId": {
    simpleDescription: "Uploader's channel ID"
  },
  "pfp": {
    simpleDescription: "Uploader's profile picture"
  }
}


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
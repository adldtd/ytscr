const path = require("path");
//const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeIgnorable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeIgnorable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /************************************************************************/
 /* Arguments + commands and corresponding functions for the meta module */
/************************************************************************/

const attributes = {
  name: {
    type: "str",
    simpleDescription: "The channel's name"
  },
  shortDescription: {
    type: "str",
    simpleDescription: "A snippet of the channel's description"
  },
  verified: {
    type: "str",
    simpleDescription: "Whether the channel is verified"
  },
  subscribers: {
    type: "num",
    simpleDescription: "Num. subscribers"
  },
  videos: {
    type: "num",
    simpleDescription: "Num. videos uploaded"
  },
  headerLinkNames: {
    type: "str",
    simpleDescription: "Listed header links' names"
  },
  headerLinks: {
    type: "str",
    simpleDescription: "Listed header links"
  },
  headerLinkIcons: {
    type: "str",
    simpleDescription: "Listed header links' icons"
  },
  profilePicture: {
    type: "str",
    simpleDescription: "The channel's profile picture"
  },
  banner: {
    type: "str",
    simpleDescription: "The channel's banner image"
  },
  handle: {
    type: "str",
    simpleDescription: "The channel's handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The channel's ID"
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


subscribeIgnorable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
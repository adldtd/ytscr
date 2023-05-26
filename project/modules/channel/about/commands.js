const path = require("path");
//const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeIgnorable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeIgnorable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /*************************************************************************/
 /* Arguments + commands and corresponding functions for the about module */
/*************************************************************************/

const attributes = {
  description: {
    type: "str",
    simpleDescription: "The channel's description"
  },
  joined: {
    type: "str",
    simpleDescription: "The channel's join date"
  },
  views: {
    type: "num",
    simpleDescription: "The total views the channel has recieved"
  },
  location: {
    type: "str",
    simpleDescription: "The channel owner's location"
  },
  linkNames: {
    type: "str",
    simpleDescription: "The names of the links listed"
  },
  links: {
    type: "str",
    simpleDescription: "The links to which the names point to"
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
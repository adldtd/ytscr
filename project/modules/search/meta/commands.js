const subscribeIgnorable = require("../../../common/subscribe-filterable").subscribeIgnorable;
const { subscribeMeta } = require("../../../common/subscribe-meta")
//const helpers = require("../../../common/helpers");
//const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));


  /*******************************************************************************/
 /* Arguments + commands and corresponding functions for the search meta module */
/*******************************************************************************/

const attributes =
{
  estimatedResults: {
    simpleDescription: "About how many search results are expected"
  },
  predictions: {
    simpleDescription: "Search predictions, given the input"
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
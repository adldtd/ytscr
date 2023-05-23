const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /**************************************************************************/
 /* Arguments + commands and corresponding functions for the shorts module */
/**************************************************************************/

const attributes = {
  id: {
    type: "str",
    simpleDescription: "The video ID"
  },
  title: {
    type: "str",
    simpleDescription: "The title of the short"
  },
  views: {
    type: "num",
    simpleDescription: "Num. views"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Link to the short's thumbnail"
  }
};


const cmd = {

  commands: {
    "-pop": {redirect: "--popular"},
    "--popular": {
      aliases: ["--popular", "-pop"],
      simpleDescription: "Whether to sort by popularity",
      description: "A flag which tells YouTube to sort shorts by views (from highest to lowest). By default, " +
      "the \"sort\" setting is set to \"Latest\", where the latest uploaded shorts are at the top.",
      call: popularCall,
      numArgs: 0
    }
  },

  attributes: attributes

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  popular: false
}

var thisCurrentState = {

}


subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function popularCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command;

  if (!innerState.inFilter)
    innerSettings.popular = true;
  else
    currentState.error = errors.errorCodes(2, c);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
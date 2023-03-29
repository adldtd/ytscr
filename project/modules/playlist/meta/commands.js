const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const map = require("../../../common/helpers").map;

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

  commands: {
    "--ignore": {
      aliases: ["--ignore"],
      simpleDescription: "Specifies an attribute to ignore",
      description: "Removes an attribute from \"consideration\" while scraping. This means that the " +
      "attribute will not be saved, printed, and cannot be filtered during execution. May be defined an " +
      "indefinite amount of times, each with a different attribute.",
      validValues: attributes,
      examples: ["--ignore=\"id\"", "--ignore text"],
      call: ignoreCall,
      numArgs: 1
    }
  },

  attributes: attributes

}

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  ignore: map(attributes, false)
}

var thisCurrentState = {

}


subscribeMeta(commands);

//*************************************************************************** CLI call functions

function ignoreCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (a in commands["--ignore"].validValues)
    innerSettings.ignore[a] = true;
  else {
    currentState.error = errors.errorCodes(3, c, a);
    helpers.outputValidValues(c, commands["--ignore"].validValues);
  }
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
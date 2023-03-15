const path = require("path");
const { subscribeMeta } = require("../../../common/subscribe-meta")
const helpers = require("../../../common/helpers");
const map = helpers.map;
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));


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

};

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
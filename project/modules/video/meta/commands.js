const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));

const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /******************************************************************************/
 /* Arguments + commands and corresponding functions for the video meta module */
/******************************************************************************/

var attributes = {"id": "",
                  "type": "",
                  "title": "",
                  "description": "",
                  "tags": "",
                  "views": "",
                  "likes": "",
                  "published": "",
                  "comments": "",
                  "uploader": "",
                  "subscribers": "",
                  "channelId": "",
                  "pfp": ""};

const cmd = {

  commands: {

    "--ignore":
    {
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

  }
}

let commands = cmd.commands;
subscribeMeta(commands);


function ignoreCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (a in commands["--ignore"].validValues)
    innerSettings.ignore[a] = true;
  else {
    currentState.error = errors.errorCodes(3, c, a);
    helpers.outputValidValues(c, commands["--ignore"].validValues);
  }
}


module.exports.cmd = cmd;
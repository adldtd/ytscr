const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));

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

  },

  attributes: attributes
}

let commands = cmd.commands;
subscribeMeta(commands);


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
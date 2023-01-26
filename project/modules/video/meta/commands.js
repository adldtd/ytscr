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
                  "durationMs": "",
                  "comments": "",
                  "uploader": "",
                  "subscribers": "",
                  "handle": "",
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

  },

  attributes: {
    
    "id": "ID of the YouTube video",
    "type": "The type of the \"video\" entered",
    "title": "The video title",
    "description": "The video description",
    "tags": "An array of video tags",
    "views": "Num. views",
    "likes": "Num. likes",
    "published": "Publish/stream date",
    "durationMs": "Video duration in ms",
    "comments": "Num. comments",
    "uploader": "Name of uploader",
    "subscribers": "Num. subscribers",
    "handle": "Uploader's channel handle",
    "channelId": "Uploader's channel ID",
    "pfp": "Uploader's profile picture"
  }
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
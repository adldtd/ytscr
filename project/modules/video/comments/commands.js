const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /****************************************************************************/
 /* Arguments + commands and corresponding functions for the comments module */
/****************************************************************************/

const attributes =
{
  "author": {
    type: "str",
    simpleDescription: "The comment author's name"
  },
  "text": {
    type: "str",
    simpleDescription: "The comment's contents"
  },
  "id": {
    type: "str",
    simpleDescription: "The ID of the comment"
  },
  "published": {
    type: "str",
    simpleDescription: "When the comment was made"
  },
  "votes": {
    type: "num",
    simpleDescription: "Num. likes"
  },
  "picture": {
    type: "str",
    simpleDescription: "The author's profile picture"
  },
  "channelId": {
    type: "str",
    simpleDescription: "The author's channel ID"
  }
}


const cmd = {

  commands: {
    "-new": {redirect: "--newest"},
    "--newest":
    {
      aliases: ["--newest", "-new"],
      simpleDescription: "Searches newest comments first",
      description: "Sets \"SORT BY\" to \"newest first.\" NOTE: Pinned comments will still appear at the top, " +
      "regardless of date.",
      call: newestCall,
      numArgs: 0
    },

    "-norp": {redirect: "--noreply"},
    "--noreply":
    {
      aliases: ["--noreply", "-norp"],
      simpleDescription: "Stops the program from considering replies",
      description: "When present, the program will not collect/print any replies to a comment.",
      call: noreplyCall,
      numArgs: 0
    },

    "-nrf":
    {
      aliases: ["-nrf"],
      simpleDescription: "Enters a special mode where replies are unfiltered",
      description: "As standard, the scraper applies filters to both comments and replies. When this flag is " +
      "present, however, if the program \"matches\" a comment, it will automatically match all of its replies. " +
      "If the comment fails the filter, it will still try to match its replies, one by one. This flag may " +
      "be useful when searching for questions - as well as answers - on a YouTube video.",
      call: nrfCall,
      numArgs: 0
    }
  },

  attributes: attributes

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  newest: false,
  replies: true,
  nrf: true
}

var thisCurrentState = {

}


subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function newestCall(parsed, currentState, innerState, moduleSettings, innerSettings) {
  let c = parsed.command;
  if (!innerState.inFilter)
    innerSettings.newest = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function noreplyCall(parsed, currentState, innerState, moduleSettings, innerSettings) {
  let c = parsed.command;
  if (!innerState.inFilter)
    innerSettings.replies = false;
  else
    currentState.error = errors.errorCodes(2, c);
}

function nrfCall(parsed, currentState, innerState, moduleSettings, innerSettings) {
  let c = parsed.command;
  if (!innerState.inFilter)
    innerSettings.nrf = false;
  else
    currentState.error = errors.errorCodes(2, c);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
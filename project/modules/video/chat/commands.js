const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /************************************************************************/
 /* Arguments + commands and corresponding functions for the chat module */
/************************************************************************/

const attributes =
{
  "author": {
    type: "str",
    simpleDescription: "The author of the message"
  },
  "text": {
    type: "str",
    simpleDescription: "The message contents"
  },
  "id": {
    type: "str",
    simpleDescription: "The message ID"
  },
  "timestamp": {
    type: "num",
    simpleDescription: "When the message was sent (in ms, from when the stream started)"
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
    "-top": {redirect: "--topchat"},
    "--topchat":
    {
      aliases: ["--topchat", "-top"],
      simpleDescription: "Scrapes \"top chat replay\"",
      description: "When present, the scraper switches the chat to \"top replay\" mode, which means YouTube will " +
      "filter out some potential spam. By default, the chat is on \"live replay\" mode; all messages are sent.",
      call: topchatCall,
      numArgs: 0
    }
  },

  attributes: attributes

}

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  topchat: false
}

var thisCurrentState = {

}


subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function topchatCall(parsed, currentState, innerState, moduleSettings, innerSettings) {
  let c = parsed.command; 
  if (!innerState.inFilter)
    innerSettings.topchat = true;
  else
    currentState.error = errors.errorCodes(2, c);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
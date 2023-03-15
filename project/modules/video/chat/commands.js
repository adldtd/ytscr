const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const map = require("../../../common/helpers").map;

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
    },

    "-l": {redirect: "--lim"},
    "--lim":
    {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of messages scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all messages are " +
      "retrieved. NOTE: The value entered limits the scraper based on how many messages were checked, " +
      "not how many matched the filters (see limfilter).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    }

  },

  attributes: attributes

}

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  topchat: false,

  lim: Number.POSITIVE_INFINITY
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

function limCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!innerState.inFilter) {
    if (!isNaN(parseInt(a))) {
      a = parseInt(a);
      if (a > 0)
        innerSettings.lim = a;
      else
        currentState.error = errors.errorCodes(15, c, a);
    } else
      currentState.error = errors.errorCodes(16, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
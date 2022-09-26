const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /************************************************************************/
 /* Arguments + commands and corresponding functions for the chat module */
/************************************************************************/

const attributes = {"author": "str",
                    "text": "str",
                    "id": "str",
                    "timestamp": "num",
                    "picture": "str",
                    "channel": "str"};

                    
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

  }

}

const commands = cmd.commands;
subscribeFilterable(attributes, commands);
subscribeMeta(commands);


function topchatCall(c, a, currentState, innerState, moduleSettings, innerSettings) {
  if (!innerState.inFilter)
    innerSettings.topchat = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function limCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

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
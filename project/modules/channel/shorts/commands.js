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
    "-l": {redirect: "--lim"},
    "--lim": {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of shorts scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all shorts are " +
      "retrieved. NOTE: The value entered limits the scraper based on how many shorts were checked, " +
      "not how many matched the filters (see limfilter).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    },

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
  lim: Number.POSITIVE_INFINITY,
  popular: false
}

var thisCurrentState = {

}


subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

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
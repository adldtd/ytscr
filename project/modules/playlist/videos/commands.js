const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const map = require("../../../common/helpers").map;

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /**************************************************************************/
 /* Arguments + commands and corresponding functions for the videos module */
/**************************************************************************/

const attributes =
{
  id: {
    type: "str",
    simpleDescription: "The video ID"
  },
  title: {
    type: "str",
    simpleDescription: "The video title"
  },
  views: {
    type: "num",
    simpleDescription: "Num. views"
  },
  duration: {
    type: "num",
    simpleDescription: "Length of the video"
  },
  published: {
    type: "str",
    simpleDescription: "An approximate publish date (distance from the current date)"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Link to the video thumbnail"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the video uploader"
  },
  handle: {
    type: "str",
    simpleDescription: "The uploader's channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The uploader's channel ID"
  }
};


const cmd = {

  commands: {
    "-l": {redirect: "--lim"},
    "--lim": {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of videos scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all videos are " +
      "retrieved. NOTE: The value entered limits the scraper based on how many videos were checked, " +
      "not how many matched the filters (see limfilter).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    }
  },

  attributes: attributes

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  savefilter: false,
  printfilter: false,

  lim: Number.POSITIVE_INFINITY,
  limfilter: Number.POSITIVE_INFINITY,

  filter: [],
  ignore: map(attributes, false)
}

var thisCurrentState = {
  usedFilterCheckValues: {},
  inFilter: false,
  currentFilter: {}
}


subscribeFilterable(attributes, commands);
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


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;
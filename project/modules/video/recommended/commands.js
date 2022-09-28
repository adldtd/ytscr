const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


const attributes = {"id": "str",
                    "title": "str",
                    "views": "num",
                    "duration": "num",
                    "published": "str",
                    "thumbnail": "str",
                    "uploader": "str",
                    "channelId": "str"};

const cmd = {

  commands: {

    "-l": {redirect: "--lim"},
    "--lim":
    {
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

  attributes: {

    "id": {
      simpleDescription: "The video ID"
    },
    "title": {
      simpleDescription: "The video title"
    },
    "views": {
      simpleDescription: "Num. views"
    },
    "duration": {
      simpleDescription: "The length of the video"
    },
    "published": {
      simpleDescription: "An approximate publish date (distance from the current date)"
    },
    "thumbnail": {
      simpleDescription: "The thumbnail for the video"
    },
    "uploader": {
      simpleDescription: "The name of the video uploader"
    },
    "channelId": {
      simpleDescription: "The uploader's channel ID"
    }
  }

};
var commands = cmd.commands;

subscribeFilterable(attributes, commands);
subscribeMeta(commands);


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
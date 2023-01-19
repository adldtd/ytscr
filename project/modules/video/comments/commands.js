const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /****************************************************************************/
 /* Arguments + commands and corresponding functions for the comments module */
/****************************************************************************/

var attributes = {"author": "str", //List of data the module will scrape; reused by different commands
                  "text": "str",
                  "id": "str",
                  "published": "str",
                  "votes": "num",
                  "picture": "str",
                  "channelId": "str"};


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
    },

    "-l": {redirect: "--lim"},
    "--lim":
    {
      aliases: ["--lim", "-l"],
      simpleDescription: "Limits the amount of comments scraped",
      description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
      "as a positive integer. If this argument is not present, the scraper will not stop until all comments are " +
      "retrieved. NOTE: The value entered limits the scraper based on how many comments were checked, " +
      "not how many matched the filters (see limfilter).",
      examples: ["--lim 100", "-l=27"],
      call: limCall,
      numArgs: 1
    }

  },

  attributes: {

    "author": {
      simpleDescription: "The comment author's name"
    },
    "text": {
      simpleDescription: "The comment's contents"
    },
    "id": {
      simpleDescription: "The ID of the comment"
    },
    "published": {
      simpleDescription: "When the comment was made"
    },
    "votes": {
      simpleDescription: "Num. likes"
    },
    "picture": {
      simpleDescription: "The author's profile picture"
    },
    "channelId": {
      simpleDescription: "The author's channel ID"
    }
  }

};

const commands = cmd.commands;
subscribeFilterable(attributes, commands);
subscribeMeta(commands);


function newestCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter)
    innerSettings.newest = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function noreplyCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter)
    innerSettings.replies = false;
  else
    currentState.error = errors.errorCodes(2, c);
}

function nrfCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter)
    innerSettings.nrf = false;
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
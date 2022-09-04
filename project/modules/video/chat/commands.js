const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;


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

    "|":
    {
      aliases: ["|"],
      simpleDescription: "META COMMAND: Exits the \"scope\" of a module",
      description: "When typed, exits a module previously specified. This means that the CLI will go back to " +
      "parsing commands and other submodules inside of the video module. In short, it allows the user to " +
      "enter arguments for more than one submodule. NOTE: As only one module may be specified as the first " +
      "argument to the CLI, the video module cannot be exited.",
      examples: ["[module 1] [argument 1] [argument 2] ... | [module 2] ..."],
      numArgs: 0
    },

    "-h": {redirect: "--help"},
    "--help":
    {
      aliases: ["--help", "-h"],
      simpleDescription: "Displays command information",
      description: "A command which takes in a command/module as the next input. By specifiying a valid " +
      "command, the program will print some info as well as the usability of that cmd. All modules have their " +
      "own help commands, which can be accessed by typing \"ytscr [module] [module] --help\".",
      examples: ["--help --newest"],
      numArgs: 1
    },

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
const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));

const cmd = require(__dirname + "/commands").cmd;


//*********************************************************************************
//Video module CLI; passes currentState onward to other CLIs
//*********************************************************************************
function cli(args, index) {

  //Setup settings for both this module and others
  let settings = {

    video: {
      input: "",
      prettyprint: true,

      focus: {
        comments: true,
        chat: true
      },

      output: "",
      timeout: 1000
    },

    comments: {
      saveOnlyMatch: false,
      newestFirst: false,
      useReplies: true,
      replyFiltering: true,

      logMatch: false,
      limit: Number.POSITIVE_INFINITY,
      limitMatch: Number.POSITIVE_INFINITY,

      selectors: [],
      include: {
        author: true,
        text: true,
        id: true,
        published: true,
        votes: true,
        picture: true,
        channel: true
      }
    },

    chat: {
      topchat: false,

      savefilter: false,
      printfilter: false,

      lim: Number.POSITIVE_INFINITY,
      limfilter: Number.POSITIVE_INFINITY,

      filter: [],
      ignore: {
        author: false,
        text: false,
        id: false,
        timestamp: false,
        picture: false,
        channel: false
      }
    }

  }

  //Set up currentState for this module, and other submodules
  let currentState = {

    error: false, //Used by all modules/submodules
    index: index,

    video: {
      focusList: {}, //Used to keep track of and deal with focus + exclude collisions
      excludeList: {},
      modulesCalled: {},
      firstFocusCalled: false
    },

    comments: {
      usedFilterCheckValues: {}, //Used to track collisions with ignore
      inFilter: false,
      currentFilter: {}
    },

    chat: {
      usedFilterCheckValues: {},
      inFilter: false,
      currentFilter: {}
    }

  };
  
  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.isModule) {
    
      parsed.commandBox.cli(args, currentState, settings);
      
    } else {

      if (parsed.command === ";")
        currentState.error = errors.errorCodesScope(0, "video"); //To help avoid user confusion
      else if (parsed.command === "--help" || parsed.command === "-h") {
        
        if (parsed.args.length === 0) {
          helpers.outputHelpAll(cmd);
          return 1;
        } else {
          let result = helpers.parseHelp(cmd, currentState, parsed);
          return result;
        }

      } else //Default; non-meta commands
        parsed.commandBox.call(parsed, currentState, settings);
    }

    if (currentState.error)
      return -1;
  }

  //Check for required inputs/errors after the fact
  if (settings.video.input === "")
    currentState.error = errors.errorCodesNums(4, "--input", 1, 0);

  if (currentState.error)
    return -1;

  return settings;
}


module.exports.cli = cli;
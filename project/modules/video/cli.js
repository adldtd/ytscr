const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));

const cmd = require(__dirname + "/commands").cmd;
const verifyDmodule = require(path.join(__dirname, "..", "..", "common", "subscribe-dmodule")).verifyDmodule;
const verifyFilterable = require(path.join(__dirname, "..", "..", "common", "subscribe-filterable")).verifyFilterable;

const THIS_MODULE = "video";


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
        meta: true,
        comments: true,
        chat: true,
        recommended: true
      },

      output: "",
      verbose: 4,
      timeout: 1000
    },

    meta: {
      ignore: {
        id: false,
        type: false,
        title: false,
        description: false,
        tags: false,
        views: false,
        likes: false,
        published: false,
        durationMs: false,
        comments: false,
        uploader: false,
        subscribers: false,
        channelId: false,
        pfp: false
      }
    },

    comments: {
      savefilter: false,
      newest: false,
      replies: true,
      nrf: true,

      printfilter: false,
      lim: Number.POSITIVE_INFINITY,
      limfilter: Number.POSITIVE_INFINITY,

      filter: [],
      ignore: {
        author: false,
        text: false,
        id: false,
        published: false,
        votes: false,
        picture: false,
        channel: false
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
    },

    recommended: {
      savefilter: false,
      printfilter: false,

      lim: Number.POSITIVE_INFINITY,
      limfilter: Number.POSITIVE_INFINITY,

      filter: [],
      ignore: {
        id: false,
        title: false,
        views: false,
        duration: false,
        published: false,
        thumbnail: false,
        uploader: false,
        channelId: false
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

    meta: {

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
    },

    recommended: {
      usedFilterCheckValues: {},
      inFilter: false,
      currentFilter: {}
    }

  };


  verifyDmodule(currentState[THIS_MODULE], settings[THIS_MODULE]); /////////////////////Debugging
  verifyFilterable(currentState.comments, settings.comments); /////////////////////Debugging
  verifyFilterable(currentState.chat, settings.chat); /////////////////////Debugging
  verifyFilterable(currentState.recommended, settings.recommended); /////////////////////Debugging
  

  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.isModule) {
    
      currentState[THIS_MODULE].modulesCalled[parsed.command] = "";
      let result = parsed.commandBox.cli(args, currentState, settings);
      if (result === -1 || result === 1) return result;
      
    } else {

      if (parsed.command === "#")
        currentState.error = errors.errorCodesScope(0, THIS_MODULE); //To help avoid user confusion
      else if (parsed.command === "--help" || parsed.command === "-h") {
        
        if (parsed.args.length === 0) {
          helpers.outputHelpAll(cmd);
          return 1;
        } else {
          let result = helpers.parseHelp(cmd, currentState, parsed);
          return result;
        }

      } else //Default; non-meta commands
        parsed.commandBox.call(parsed, currentState, currentState[THIS_MODULE], settings, settings[THIS_MODULE]);
    }

    if (currentState.error)
      return -1;
  }

  //Check for required inputs/errors after the fact
  if (settings[THIS_MODULE].input === "")
    currentState.error = errors.errorCodesNums(4, "--input", 1, 0);
  else {

    for (md in currentState[THIS_MODULE].modulesCalled) { //Catches an error where a module is called but not focused
      if (!settings[THIS_MODULE].focus[md]) {
        console.log("Error: Module \"" + md + "\" is modified, but is either ignored or not focused");
        currentState.error = true;
        break;
      }
    }
  }

  if (currentState.error)
    return -1;

  if (settings[THIS_MODULE].output === "") { //Default destination
    let filename = THIS_MODULE + "_" + settings[THIS_MODULE].input.split("?v=", 2)[1] + ".json";
    settings[THIS_MODULE].output = path.join(__dirname, "..", "..", "SAVES", filename);
  }

  return settings;
}


module.exports.cli = cli;
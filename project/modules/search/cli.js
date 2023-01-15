const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));

const cmd = require(__dirname + "/commands").cmd;
const verifyDmodule = require(path.join(__dirname, "..", "..", "common", "subscribe-dmodule")).verifyDmodule;
const verifyFilterable = require(path.join(__dirname, "..", "..", "common", "subscribe-filterable")).verifyFilterable;

const THIS_MODULE = "search";


//*********************************************************************************
//Search module CLI; passes currentState onward to other CLIs
//*********************************************************************************
function cli(args, index) {

    //Setup settings for both this module and others
    let settings = {
  
      search: {
        input: "",
        prettyprint: true,

        seperate: false,
        savesections: false,
  
        focus: {
          videos: true,
          shorts: true,
          channels: true,
          playlists: true,
          movies: true
        },

        lim: Number.POSITIVE_INFINITY,
        tframe: "",
        type: "",
        duration: "",
        features: {},
        sort: "",

        output: "",
        verbose: 4,
        timeout: 1000
      },

      videos: {
        savefilter: false,
        printfilter: false,

        lim: Number.POSITIVE_INFINITY,
        limfilter: Number.POSITIVE_INFINITY,

        filter: [],
        ignore: {id: false,
                 title: false,
                 shortDescription: false,
                 badges: false,
                 views: false,
                 duration: false,
                 published: false,
                 thumbnail: false,
                 uploader: false,
                 verified: false,
                 profilePicture: false,
                 channelId: false}
      },

      shorts: {
        savefilter: false,
        printfilter: false,

        lim: Number.POSITIVE_INFINITY,
        limfilter: Number.POSITIVE_INFINITY,

        filter: [],
        ignore: {id: false,
                 title: false,
                 views: false,
                 thumbnail: false}
      },

      channels: {
        savefilter: false,
        printfilter: false,

        lim: Number.POSITIVE_INFINITY,
        limfilter: Number.POSITIVE_INFINITY,

        filter: [],
        ignore: {name: false,
                  verified: false,
                  subscribers: false,
                  shortDescription: false,
                  picture: false,
                  channelId: false}
      },

      playlists: {
        savefilter: false,
        printfilter: false,

        lim: Number.POSITIVE_INFINITY,
        limfilter: Number.POSITIVE_INFINITY,

        filter: [],
        ignore: {id: false,
                  title: false,
                  size: false,
                  shortVideos: false,
                  updated: false,
                  thumbnail: false,
                  uploader: false,
                  verified: false,
                  channelId: false}
      },

      movies: {
        savefilter: false,
        printfilter: false,

        lim: Number.POSITIVE_INFINITY,
        limfilter: Number.POSITIVE_INFINITY,

        filter: [],
        ignore: {id: false,
                  title: false,
                  shortDescription: false,
                  duration: false,
                  year: false,
                  category: false,
                  contentHeaders: false,
                  uploader: false,
                  verified: false,
                  channelId: false}
      }
      
    }
  
    //Set up currentState for this module, and other submodules
    let currentState = {
  
      error: false, //Used by all modules/submodules
      index: index,
  
      search: {
        focusList: {}, //Used to keep track of and deal with focus + exclude collisions
        excludeList: {},
        modulesCalled: {},
        firstFocusCalled: false
      },

      videos: {
        usedFilterCheckValues: {},
        inFilter: false,
        currentFilter: {}
      },

      shorts: {
        usedFilterCheckValues: {},
        inFilter: false,
        currentFilter: {}
      },

      channels: {
        usedFilterCheckValues: {},
        inFilter: false,
        currentFilter: {}
      },

      playlists: {
        usedFilterCheckValues: {},
        inFilter: false,
        currentFilter: {}
      },

      movies: {
        usedFilterCheckValues: {},
        inFilter: false,
        currentFilter: {}
      }
  
    };
  
  
    verifyDmodule(currentState[THIS_MODULE], settings[THIS_MODULE]); /////////////////////Debugging
    verifyFilterable(currentState.videos, settings.videos); /////////////////////Debugging
    verifyFilterable(currentState.shorts, settings.shorts); /////////////////////Debugging
    verifyFilterable(currentState.channels, settings.channels); /////////////////////Debugging
    verifyFilterable(currentState.playlists, settings.playlists); /////////////////////Debugging
    verifyFilterable(currentState.movies, settings.movies); /////////////////////Debugging
    
  
    //Loop through the CLI
    while (currentState.index < args.length) {
  
      let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
      if (currentState.error) return -1;
      currentState.index = parsed.currentIndex;
  
      if (parsed.isModule) {
      
        currentState.search.modulesCalled[parsed.command] = "";
        let result = parsed.commandBox.cli(args, currentState, settings, parsed.command); //Results CLI needs a specific module name
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
    if (settings.search.input === "")
      currentState.error = errors.errorCodesNums(4, "--input", 1, 0);
    else {
  
      for (md in currentState.search.modulesCalled) { //Catches an error where a module is called but not focused
        if (!settings.search.focus[md]) {
          console.log("Error: Module \"" + md + "\" is modified, but is either ignored or not focused");
          currentState.error = true;
          break;
        }
      }
    }
  
    if (currentState.error)
      return -1;
  
    if (settings.search.output === "") { //Default destination
      let filename = THIS_MODULE + "_" + settings.search.input + ".json";
      settings.search.output = path.join(__dirname, "..", "..", "SAVES", filename);
    }
  
    return settings;
  }


  module.exports.cli = cli;
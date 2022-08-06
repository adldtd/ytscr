const path = require("path");
const helpers = require(path.join(__dirname, "..", "helpers"));
const commands = require(__dirname + "/commands");

const cmd = commands.cmd;
const errorCodes = commands.errorCodes;


//*********************************************************************************
//Parser for the comments module
//*********************************************************************************
function cli(args) {

  let settings = {url: "", destination: "", timeout: 1000, selectors: [], include: {}};

  let currentState = //Used to pass CLI tracking variables to individual CLI functions
  {
    usedFilterCheckValues: {}, //Used to track collisions with ignore
    inFilter: false,
    currentFilter: {},
    helpCMD: false,
    err: false //Stops the CLI if made true
  };

  for (let i = 3; i < args.length; i++) {

    let a = ""; let v = "";
    let ind = args[i].indexOf("=");
    
    if (ind !== -1) {
      a = args[i].slice(0, ind);
      v = args[i].slice(ind + 1, args[i].length);
    } else
      a = args[i];

    if (a in cmd) {
      let commandObject = cmd[a]
      if ("redirect" in commandObject)
        commandObject = cmd[commandObject.redirect];

      if (currentState.helpCMD) {

        if (i === args.length - 1) { //Expected for there to be either 0 or 1 inputs to the help command
          if ("description" in commandObject) {
            helpers.outputHelp(a, commandObject);
            currentState.helpCMD = false;
            return -1;
          } else
            currentState.err = errorCodes(99, a);
        } else
          currentState.err = errorCodes(51, "help");

      } else {
        if (a !== "help")
          commandObject.call(a, v, settings, currentState);
        else
          commandObject.call(a, v, settings, currentState, i);
      }

    } else
      currentState.err = errorCodes(99, a);

    if (currentState.err)
      return -1;

  }

  if (currentState.helpCMD) {
    helpers.outputHelpAll(cmd);
    return -1;
  }

  if (settings.url === "")
    currentState.err = errorCodes(100, "");
  if (currentState.inFilter)
    currentState.err = errorCodes(101, "");

  if (currentState.err)
    return -1;


  if (!("newestFirst" in settings)) settings.newestFirst = false; //Default values
  if (!("save" in settings)) settings.save = true;
  if (!("saveOnlyMatch" in settings)) settings.saveOnlyMatch = false;
  if (!("prettyPrint" in settings)) settings.prettyPrint = true;
  if (!("useReplies" in settings)) settings.useReplies = true;
  if (!("replyFiltering" in settings)) settings.replyFiltering = true;
  if (!("logMatch" in settings)) settings.logMatch = false;
  if (!("limit" in settings)) settings.limit = Number.POSITIVE_INFINITY;
  if (!("limitMatch" in settings)) settings.limitMatch = Number.POSITIVE_INFINITY;

  if (settings.save === false && settings.saveOnlyMatch === true) {
    settings.saveOnlyMatch = false;
    console.log("WARNING: Argument -savefilter conflicts with -nosave; no information will be saved.");
  }
  if (settings.save === false && settings.destination !== "") {
    settings.destination = "";
    console.log("WARNING: A destination is given but -nosave is present; no information will be saved.");
  }
  if ((settings.limit !== Number.POSITIVE_INFINITY && settings.limitMatch !== Number.POSITIVE_INFINITY) && settings.limit < settings.limitMatch) {
    settings.limitMatch = settings.limit;
    console.log("WARNING: Limit is lower than limitfilter; scraping will end before the filter limit can be reached.");
  }

  if (settings.save === false && settings.prettyPrint === false)
    console.log("WARNING: Argument -nopretty conflicts with -nosave; no information will be saved.");
  if (!settings.logMatch && !settings.save)
    console.log("WARNING: Scraped information will neither be saved nor displayed on-screen.");
  if (settings.logMatch && settings.selectors.length === 0)
    console.log("WARNING: Argument -printfilter is given, but no filters are applied; all comments will be printed on-screen.");
  if (settings.limitMatch !== Number.POSITIVE_INFINITY && settings.selectors.length === 0)
    console.log("WARNING: Argument limfilter is given, but no filters are applied; limitfilter will be treated as the normal filter.");
  if (!settings.useReplies && !settings.replyFiltering)
    console.log("WARNING: Argument -noreply conflicts with -nrf; no replies will be scraped.");
  if (!settings.replyFiltering && settings.selectors.length === 0 && settings.limitMatch !== Number.POSITIVE_INFINITY)
    console.log("WARNING: -nrf mode enabled, but no filters set; thus all replies will not be counted up to limitfilter.");

  return settings;
}


module.exports.cli = cli;
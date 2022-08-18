const path = require("path");
const helpers = require(path.join(__dirname, "..", "helpers"));
const cmd = require(__dirname + "/commands").cmd;
const errorCodes = require(path.join(__dirname, "..", "errors")).errorCodes;


function cli(args) {

  //Initialize default values
  let settings =
  {
    search: "", //A url is later created using this term

    save: true,
    prettyprint: true,

    savefilter: false,
    printfilter: false,

    lim: Number.POSITIVE_INFINITY,
    limfilter: Number.POSITIVE_INFINITY,

    filter: [],
    ignore:
    {
      author: false,
      name: false,
      snippet: false,
      duration: false,
      views: false,
      published: false,
      thumbnail: false,
      id: false,
      picture: false,
      channel: false
    },

    destination: "",
    timeout: 1000
  }

  let currentState = //Used to pass CLI tracking variables to individual CLI functions
  {
    usedFilterCheckValues: {}, //Used to track collisions with ignore
    inFilter: false,
    currentFilter: {},
    helpCMD: false,
    err: false //Stops the CLI if made true
  };

  //Iterate through arguments passed
  for (let i = 3; i < args.length; i++) {

    let a = ""; let v = "";
    let ind = args[i].indexOf("=");
    
    if (ind !== -1) {
      a = args[i].slice(0, ind);
      v = args[i].slice(ind + 1, args[i].length);
    } else
      a = args[i];

    //Argument exists; now work with special cases
    if (a in cmd) {
      let commandObject = cmd[a]
      if ("redirect" in commandObject)
        commandObject = cmd[commandObject.redirect];

      if (currentState.helpCMD) {

        if (i === args.length - 1) {
          if ("description" in commandObject) {
            helpers.outputHelp(a, commandObject);
            currentState.helpCMD = false;
            return 1;
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
    return 1;
  }

  if (settings.search === "")
    currentState.err = errorCodes(102, "");
  if (currentState.inFilter)
    currentState.err = errorCodes(101, "");

  if (currentState.err)
    return -1;

  //Print all warnings
  if (settings.save === false && settings.savefilter === true) {
    settings.savefilter = false;
    console.log("WARNING: Argument -savefilter conflicts with -nosave; no information will be saved.");
  }
  if (settings.save === false && settings.destination !== "") {
    settings.destination = "";
    console.log("WARNING: A destination is given but -nosave is present; no information will be saved.");
  }
  if ((settings.lim !== Number.POSITIVE_INFINITY && settings.limfilter !== Number.POSITIVE_INFINITY) && settings.lim < settings.limfilter) {
    settings.limfilter = settings.lim;
    console.log("WARNING: Limit is lower than limfilter; scraping will end before the filter limit can be reached.");
  }

  if (settings.save === false && settings.prettyprint === false)
    console.log("WARNING: Argument -nopretty conflicts with -nosave; no information will be saved.");
  if (!settings.printfilter && !settings.save)
    console.log("WARNING: Scraped information will neither be saved nor displayed on-screen.");
  if (settings.printfilter && settings.filter.length === 0)
    console.log("WARNING: Argument -printfilter is given, but no filters are applied; all videos will be printed on-screen.");
  if (settings.limfilter !== Number.POSITIVE_INFINITY && settings.filter.length === 0)
    console.log("WARNING: Argument limfilter is given, but no filters are applied; limfilter will be treated like the normal limit.");

  return settings;
}


module.exports.cli = cli;
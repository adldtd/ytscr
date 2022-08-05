const fs = require("fs");
const commands = require(__dirname + "/commands");

const cmd = commands.cmd;
const errorCodes = commands.errorCodes;



function cli (args) {

  let settings = {url: "", destination: "", selectors: [], include: {}};

  let currentState = //Used to pass CLI tracking variables to individual CLI functions
  {
    usedFilterCheckValues: {}, //Used to track collisions with ignore
    inFilter: false,
    currentFilter: {},
    helpCMD: false,
    err: false //Stops the CLI if made true
  };

  for (let i = 2; i < args.length; i++) {

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
            outputHelp(a, commandObject);
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
    outputHelpAll();
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

  return [settings.url, settings.destination, settings];
}


function outputValidValues(arg, values = {}, ignore = {}) { //Gives the end user more information in case of an error
  console.log("The valid values for argument \"" + arg + "\" are:");
  for (valid in values) {
    if (!(valid in ignore)) {
      if (values[valid] === "")
        console.log("\t\"" + valid + "\"");
      else
        console.log("\t\"" + valid + "\" (" + values[valid] + ")");
    }
  }
}


function outputHelp(arg, commandObject) {

  let ali = "NAMES: " + commandObject.aliases[0];
  for (let i = 1; i < commandObject.aliases.length; i++)
    ali += ", " + commandObject.aliases[i];
  console.log(ali);
  
  console.log(commandObject.description);

  if ("validValues" in commandObject) {
    if (commandObject.aliases[0] !== "compare") { //Special case
      console.log("");
      outputValidValues(commandObject.aliases[0], commandObject.validValues);
    } else {
      console.log("\nThe valid values for argument \"compare\" (str) are:");
      for (valid in {"":"", "=":""})
        console.log("\t\"" + valid + "\"");

      console.log("\nThe valid values for argument \"compare\" (num) are:");
      for (valid in commandObject.validValues) {
        if (valid !== "")
          console.log("\t\"" + valid + "\"");
      }
    }
  }

  if ("examples" in commandObject) {
    console.log("\nExamples:");
    for (e in commandObject.examples)
      console.log(commandObject.examples[e]);
  }
}


function outputHelpAll() {
  let buffer_space = 25; //The buffer space "names" get before the simple description is printer

  for (c in cmd) {
    if ("simpleDescription" in cmd[c]) {
      
      let names = cmd[c].aliases[0];
      for (let i = 1; i < cmd[c].aliases.length; i++)
        names += ", " + cmd[c].aliases[i];

      let spaces = "";
      let numSpaces = buffer_space - names.length;
      if (numSpaces > 0)
        spaces = " ".repeat(numSpaces);
      else
        spaces = " ";

      console.log(names + spaces + cmd[c].simpleDescription); //One tab is about 8 spaces

    }
  }
}



module.exports.cli = cli;
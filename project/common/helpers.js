const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const process = require("node:process");

const errorCodesNums = require(__dirname + "/errors").errorCodesNums;


  /************************************************************/
 /* Helper functions for different command CLIs and scrapers */
/************************************************************/


//*********************************************************************************
//Parses an argument as a command; returns an object with details on the command
//itself, its arguments, and its validity; does not check for modules/submodules
//*********************************************************************************
function parseArgs(args, index, cmd, currentState) {

  let returnVal = {command: "", commandBox: {}, args: [], currentIndex: index + 1, isModule: false};

  if ("modules" in cmd && args[index] in cmd.modules) {
    returnVal.command = args[index];
    returnVal.isModule = true;
    returnVal.currentIndex++;
    returnVal.commandBox = cmd.modules[returnVal.command];
    return returnVal;
  }

  //Check for the first argument in an equals sign
  let equalInd = args[index].indexOf("=");
    
  if (equalInd !== -1) {
    returnVal.command = args[index].slice(0, equalInd);
    let v1 = args[index].slice(equalInd + 1, args[index].length);
    returnVal.args.push(v1);
  } else
    returnVal.command = args[index];

  if (!(returnVal.command in cmd.commands)) {
    currentState.error = errorCodesNums(3, returnVal.command, 0, 0);
    return returnVal;
  }

  //Work with redirects/aliases
  if ("redirect" in cmd.commands[ returnVal.command ])
    returnVal.commandBox = cmd.commands[ cmd.commands[returnVal.command].redirect ];
  else
    returnVal.commandBox = cmd.commands[returnVal.command];

  if (!("numArgs" in returnVal.commandBox)) //Solely for debugging purposes
    throw "ERR! Command " + returnVal.command + " defined improperly: missing numArgs";

  //Collect needed arguments for a command; iterate until you either reach the end of all arguments or collect enough
  let limit = returnVal.commandBox.numArgs;
  while (returnVal.currentIndex < args.length && returnVal.args.length < limit) {

    returnVal.args.push(args[ returnVal.currentIndex ]);
    returnVal.currentIndex++;
  }

  //Hard coding for --help meta command
  if ((returnVal.command === "-h" || returnVal.command === "--help")) {

    if (returnVal.args.length === 0) //Avoids an error
      return returnVal;
    else if (returnVal.currentIndex < args.length) { //Still more to go; should not be valid for --help
      currentState.error = errorCodesNums(1, returnVal.command, returnVal.commandBox.numArgs, 0);
      return -1;
    }

  }

  if (returnVal.args.length < limit)
    currentState.error = errorCodesNums(0, returnVal.command, limit, returnVal.args.length);
  else if (returnVal.args.length > limit)
    currentState.error = errorCodesNums(1, returnVal.command, limit, returnVal.args.length);

  return returnVal;
    
}


//*********************************************************************************
//Taking a command as input, output the restricted values to enter (to be located
//in the "validValues" section of cmd)
//*********************************************************************************
function outputValidValues(arg, values = {}, ignore = {}) { //Gives the end user more information in case of an error
  console.log("The valid values for command \"" + arg + "\" are:");
  for (valid in values) {
    if (!(valid in ignore)) {
      if (values[valid] === "")
        console.log("\t\"" + valid + "\"");
      else
        console.log("\t\"" + valid + "\" (" + values[valid] + ")");
    }
  }
}


//*********************************************************************************
//Print an argument/command's aliases, its description, and other info
//*********************************************************************************
function outputHelp(commandObject) {

  let ali = "NAMES: " + commandObject.aliases[0];
  for (let i = 1; i < commandObject.aliases.length; i++)
    ali += ", " + commandObject.aliases[i];
  console.log(ali);
  
  console.log(commandObject.description);

  if ("validValues" in commandObject) {
    if (commandObject.aliases[0] !== "compare") { //Special case; hardcoded
      console.log("");
      outputValidValues(commandObject.aliases[0], commandObject.validValues);
    } else {
      console.log("\nThe valid values for argument \"compare\" (str) are:");
      for (valid in {"in":"", "eq":""})
        console.log("\t\"" + valid + "\" (" + commandObject.validValues[valid] + ")");

      console.log("\nThe valid values for argument \"compare\" (num) are:");
      for (valid in commandObject.validValues) {
        if (valid !== "in")
          console.log("\t\"" + valid + "\" (" + commandObject.validValues[valid] + ")");
      }
    }
  }

  if ("examples" in commandObject) {
    console.log("\nExamples:");
    for (e in commandObject.examples)
      console.log(commandObject.examples[e]);
  }
}


//*********************************************************************************
//Print a list of arguments/commands alongside their simple descriptions
//*********************************************************************************
function outputHelpAll(cmd) {
  let buffer_space = 25; //The buffer space "names" get before the simple description is printed

  for (s in cmd) {

    if (s === "modules")
      console.log("MODULES:");
    else
      console.log("COMMANDS/FLAGS:");

    let section = cmd[s];
    
    for (c in section) {
      if ("simpleDescription" in section[c]) {
        
        let names = section[c].aliases[0];
        for (let i = 1; i < section[c].aliases.length; i++)
          names += ", " + section[c].aliases[i];

        let spaces = "";
        let numSpaces = buffer_space - names.length;
        if (numSpaces > 0)
          spaces = " ".repeat(numSpaces);
        else
          spaces = " ";

        console.log(names + spaces + section[c].simpleDescription);
      }
    }

    console.log(""); //New line

  }

}


//*********************************************************************************
//Wrapper function for creating requests; returns the request upon success or -1
//upon faliure
//*********************************************************************************
async function makeRequest(config, timeout, retry = 0) {
  
  let resp;
  let attempts = -1;

  do {
    attempts++;

    await new Promise((resolve) => setTimeout(resolve, timeout));
    resp = await axios(config);

    if (resp.status >= 200 && resp.status < 300)
      return resp;
    else if (resp.status >= 500)
      return -1;
    
  } while (attempts < retry)

  console.log("\nUnexpected status code: " + resp.status + " " + resp.statusText);
  return -1;
}


//*********************************************************************************
//Determines what filepath to save to; avoids existing filepath conflicts
//*********************************************************************************
function handleSaveJSON(name, savedInformation, settings) {
  
  let filepath = "";
  if (settings.destination === "")
    filepath = __dirname + "\\SAVES\\" + name; //Default directory
  else
    filepath = settings.destination + "/" + name;

  //Avoid filepath conflict and overwriting
  let probes = 1;
  let probepath = filepath + ".json";
  while (fs.existsSync(probepath))
    probepath = filepath + " (" + probes++ + ").json";
  filepath = probepath;

  if (settings.prettyprint)
    fs.writeFileSync(filepath, JSON.stringify(savedInformation, null, 2));
  else
    fs.writeFileSync(filepath, JSON.stringify(savedInformation));

  return filepath;
}


//*********************************************************************************
//Splits a string without removing the delimiter all throughout; only splits a
//specified amount of times
//*********************************************************************************
function safeSplit(str, find, times, backwards = false) {

  let returnArray = [];
  for (let splits = 0; splits < times; splits++) {

    ind = backwards ? str.lastIndexOf(find) : str.indexOf(find);
    if (ind === -1) break;

    let part1 = str.substring(0, ind);
    let part2 = str.substring(ind + find.length);

    if (backwards) {
      returnArray.push(part2); str = part1;
    } else {
      returnArray.push(part1); str = part2;
    }
  }

  returnArray.push(str);
  if (backwards) returnArray.reverse();
  return returnArray;

}


function validFileName(filename) { //https://stackoverflow.com/a/53635003
  let re = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"\/\\|?*])|(\.|\s)$/;
  return !(filename === "" || re.test(filename));
}


function clearLastLine() {
  readline.moveCursor(process.stdout, 0, -1); //https://stackoverflow.com/a/65863081
  readline.clearLine(process.stdout, 1); //Only works if cursor was on a newline before the function
}


module.exports.parseArgs = parseArgs;
module.exports.outputValidValues = outputValidValues;
module.exports.outputHelp = outputHelp;
module.exports.outputHelpAll = outputHelpAll;
module.exports.makeRequest = makeRequest;
module.exports.handleSaveJSON = handleSaveJSON;
module.exports.safeSplit = safeSplit;
module.exports.validFileName = validFileName;
module.exports.clearLastLine = clearLastLine;
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const process = require("node:process");

const errors = require(__dirname + "/errors");


  /************************************************************/
 /* Helper functions for different command CLIs and scrapers */
/************************************************************/


//*********************************************************************************
//Parses an argument as a command; returns an object with details on the command
//itself, its arguments, and its validity; checks for modules/submodules
//*********************************************************************************
function parseArgs(args, index, cmd, currentState) {

  let returnVal = {command: "", commandBox: {}, args: [], currentIndex: index + 1, isModule: false};

  if ("modules" in cmd && args[index] in cmd.modules) {
    returnVal.command = args[index];
    returnVal.isModule = true;
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
    currentState.error = errors.errorCodesNums(3, returnVal.command, 0, 0);
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
    
    if (returnVal.currentIndex < args.length) { //Still more to go; should not be valid for --help
      currentState.error = errors.errorCodesNums(1, returnVal.command, returnVal.commandBox.numArgs, 0);
      return returnVal;
    }

  }

  if (returnVal.args.length < limit)
    currentState.error = errors.errorCodesNums(0, returnVal.command, limit, returnVal.args.length);
  else if (returnVal.args.length > limit)
    currentState.error = errors.errorCodesNums(1, returnVal.command, limit, returnVal.args.length);

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
    if (commandObject.aliases[0] !== "--compare") { //Special case; hardcoded
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
//Determines whether the argument given to the help command is valid; returns 1 on
//success and -1 on faliure
//*********************************************************************************
function parseHelp(cmd, currentState, parsed) {

  let c = parsed.command; let a = parsed.args[0];

  if ("modules" in cmd && a in cmd.modules) {

    let argumentBox = cmd.modules[a];
    outputHelp(argumentBox);

  } else if ("commands" in cmd && a in cmd.commands) {

    let argumentBox = cmd.commands[a];
    if ("redirect" in argumentBox)
      argumentBox = cmd.commands[ argumentBox.redirect ];
    outputHelp(argumentBox);

  } else {
    currentState.error = errors.errorCodes(3, c, a);
    return -1;
  }

  return 1;
}


//*********************************************************************************
//Print a list of arguments/commands alongside their simple descriptions
//*********************************************************************************
function outputHelpAll(cmd) {
  let buffer_space = 25; //The buffer space "names" get before the simple description is printed
  let attrMode = false;

  for (s in cmd) {

    if (s === "modules")
      console.log("MODULES:");
    else if (s === "commands")
      console.log("COMMANDS/FLAGS:");
    else {
      console.log("\nScraped Attributes:");
      attrMode = true;
    }

    let section = cmd[s];
    
    for (c in section) {
      let text = "";
      if (typeof(section[c]) === "string")
        text = section[c];
      else if ("simpleDescription" in section[c])
        text = section[c].simpleDescription;
      else
        continue;

      let names;
      if (!attrMode) {
        names = section[c].aliases[0];
        for (let i = 1; i < section[c].aliases.length; i++)
          names += ", " + section[c].aliases[i];
      } else
        names = c;

      let spaces = "";
      let numSpaces = buffer_space - names.length;
      if (numSpaces > 0)
        spaces = " ".repeat(numSpaces);
      else
        spaces = " ";

      console.log(names + spaces + text);
    }

    console.log(""); //New line
    attrMode = false;

  }

}


//*********************************************************************************
//Wrapper function for creating requests; returns the request upon success or -1
//upon faliure
//*********************************************************************************
async function makeRequest(config, timeout, retry = 0, verbosityLevel = 4) {

  let storeData = undefined;
  if ("data" in config && config.method == "GET") {
    storeData = config.data;
    delete config.data;
  }
  
  let resp;
  let attempts = -1;
  let result = -1;

  do {
    attempts++;

    await new Promise((resolve) => setTimeout(resolve, timeout));
    resp = await axios(config);

    if (resp.status >= 200 && resp.status < 300)
      result = 1;
    
  } while (attempts < retry && result === -1)

  if (storeData !== undefined)
    config.data = storeData;

  if (result === 1)
    return resp;

  global.sendvb(verbosityLevel, "\nUnexpected status code: " + resp.status + " " + resp.statusText);
  return -1;
}


//*********************************************************************************
//Saves a JSON; avoids overwriting existing files
//*********************************************************************************
function handleSaveJSON(file, information, prettyprint) {

  file = safeSplit(file, ".json", 1, true)[0];

  //Keep probing until it is safe to save
  let probes = 1;
  let probingFile = file + ".json";
  while (fs.existsSync(probingFile))
    probingFile = file + " (" + probes++ + ").json";
  file = probingFile;

  if (prettyprint)
    fs.writeFileSync(file, JSON.stringify(information, null, 2));
  else
    fs.writeFileSync(file, JSON.stringify(information));

  return file;
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

//*********************************************************************************
//Gets an embedded JSON string and converts it to an object; expects the start to
//be the character "{" and ends when its appropriate "}" is reached
//*********************************************************************************
function retrieveJSON(str) {

  let bracketStack = 1; //Starts with the first character
  let quoteStack = 0;
  let quoteType = null;
  let lastBackslash = false;
  let i = 1;

  while (i < str.length) {
    let chara = str[i++];

    if (chara === "{" || chara === "}") {
      if (quoteStack === 0) {
        bracketStack += (chara === "{") ? 1 : -1;
        if (bracketStack === 0) break; //Finished parsing
      }
    } else if (chara === '"' && !lastBackslash) {
      if (quoteType === null) {
        quoteStack += 1;
        quoteType = '"';
      } else if (quoteType === '"') { //Quote type aligns; means we can exit
        quoteStack -= 1;
        quoteType = null;
      }
    } else if (chara === "'" && !lastBackslash) {
      if (quoteType === null) {
        quoteStack += 1;
        quoteType = "'";
      } else if (quoteType === "'") { //Quote type aligns; means we can exit
        quoteStack -= 1;
        quoteType = null;
      }
    } else if (chara === "\\") {
      lastBackslash = true;
      continue;
    }

    lastBackslash = false;
  }

  let object = JSON.parse(str.substring(0, i));
  return object;
}

//*********************************************************************************
//Converts the % encoded characters in a URL to normal chars
//*********************************************************************************
function unencodeURL(link) {

  for (let i = 0; i < link.length; i++) {
    if (link.charAt(i) === "%") { //Escape character
      if (i < link.length - 2) {
        let val = link.substring(i + 1, i + 3);
        val = parseInt(val, 16);
        link = link.substring(0, i) + String.fromCharCode(val) + link.substring(i + 3);
      }
    }
  }

  return link;
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
module.exports.parseHelp = parseHelp;
module.exports.outputHelpAll = outputHelpAll;
module.exports.makeRequest = makeRequest;
module.exports.handleSaveJSON = handleSaveJSON;
module.exports.safeSplit = safeSplit;
module.exports.retrieveJSON = retrieveJSON;
module.exports.unencodeURL = unencodeURL;
module.exports.validFileName = validFileName;
module.exports.clearLastLine = clearLastLine;
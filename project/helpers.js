const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const process = require("node:process");


  /************************************************************/
 /* Helper functions for different command CLIs and scrapers */
/************************************************************/


//*********************************************************************************
//Taking an argument as input, output the restricted values to enter (to be located
//in the "validValues" section of cmd)
//*********************************************************************************
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


//*********************************************************************************
//Print an argument/command's aliases, its description, and other info
//*********************************************************************************
function outputHelp(arg, commandObject) {

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


function clearLastLine() {
  readline.moveCursor(process.stdout, 0, -1); //https://stackoverflow.com/a/65863081
  readline.clearLine(process.stdout, 1); //Only works if cursor was on a newline before the function
}


module.exports.outputValidValues = outputValidValues;
module.exports.outputHelp = outputHelp;
module.exports.outputHelpAll = outputHelpAll;
module.exports.makeRequest = makeRequest;
module.exports.handleSaveJSON = handleSaveJSON;
module.exports.clearLastLine = clearLastLine;
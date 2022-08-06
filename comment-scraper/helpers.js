
  /**************************************************/
 /* Helper functions for all of the different CLIs */
/**************************************************/


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


//*********************************************************************************
//Print a list of arguments/commands alongside their simple descriptions
//*********************************************************************************
function outputHelpAll(cmd) {
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


module.exports.outputValidValues = outputValidValues;
module.exports.outputHelp = outputHelp;
module.exports.outputHelpAll = outputHelpAll;
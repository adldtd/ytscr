
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



module.exports.outputHelp = outputHelp;
module.exports.outputHelpAll = outputHelpAll;


  /********************************************************************************************************/
 /* Code block consisting of "meta" functions, each implemented in a CLI; used to reduce some redundancy */
/********************************************************************************************************/


const commands = {

  ".": {redirect: "#"},
  "#": {
    aliases: ["#", "."],
    simpleDescription: "META COMMAND: Exits the \"scope\" of a module",
    description: "When typed, exits a module previously specified. By default, the user must specify a module " +
    "to scrape as the first argument to the command line. This module cannot be exited; however, a module's " +
    "\"submodules\" may be (see \"--help [module]\" for a detailed list.) IN SHORT, this command allows users " +
    "to enter commands and arguments for more than one submodule.",
    examples: ["[module 1] [argument 1] [argument 2] ... # [module 2] ..."],
    numArgs: 0
  },

  "-h": {redirect: "--help"},
  "--help": {
    aliases: ["--help", "-h"],
    simpleDescription: "Displays command information",
    description: "A command which takes in a command/module as the next input. By specifiying a valid " +
    "command, the program will print some info as well as the usability of that cmd. All modules (and " +
    "submodules) have their own help commands, which can be accessed by typing \"[module] --help\".",
    examples: ["--help video"],
    numArgs: 1
  }
}


/**
 * Registers a group of commands into the command section of a cmd object. Made to be used by commands.js files to reduce code bloat.
 * @param {Object} cmdCommands The "command" section of a cmd object
 */
function subscribeMeta(cmdCommands) {

  for (c in commands)
    cmdCommands[c] = commands[c];
}


module.exports.subscribeMeta = subscribeMeta;
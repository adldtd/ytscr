const path = require("path");
const helpers = require(path.join(__dirname, "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "common", "errors"));

const cmd = require(__dirname + "/commands").cmd;


//*********************************************************************************
//Entry level CLI; retrieves the first module and calls the cli appropriate for
//that module
//*********************************************************************************
function cli(args) {

  let currentState = {
    error: false
  };
  
  if (args.length > 2) {

    //The current index for the entry CLI is always 2
    let parsed = helpers.parseArgs(args, 2, cmd, currentState);
    if (currentState.error) return -1;

    //Call designated CLI command for a module
    if (parsed.isModule) {

      let scrapeCommand = parsed.commandBox.scrape;
      let settings = parsed.commandBox.cli(args, 3);
      if (settings === -1 || settings === 1) return settings;
      return [scrapeCommand, settings];

    } else {

      if (parsed.command === "--help" || parsed.command === "-h") { //Super special meta command

        if (parsed.args.length === 0) {
          helpers.outputHelpAll(cmd);
          return 1;
        } else {
          let result = helpers.parseHelp(cmd, currentState, parsed);
          return result;
        }

      }

    }

  } else {
    console.log("Error: No modules/commands provided")
    return -1;
  }

  return -1;
}


module.exports.cli = cli;
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

      let scrapeCommand = parse.commandBox.scrape;
      let settings = parse.commandBox.cli(args, 3);
      return [scrapeCommand, settings];

    } else {

      if (parsed.command === "--help" || parsed.command === "-h") { //Super special meta command

        if (parsed.args.length === 0) {
          helpers.outputHelpAll(cmd);
          return 1;
        } else {

          //Still more to go; this should not be the case whenever --help is called
          if (parsed.currentIndex < args.length) {
            errors.errorCodesNums(1, parsed.command, parsed.commandBox.numArgs, parsed.args.length + (args.length - parsed.currentIndex));
            return -1;
          } else {
            helpers.outputHelp(parsed.commandBox);
            return 1;
          }
        }

      }

    }

  } else {
    console.log("Error: No modules/commands provided")
    return -1;
  }
}


module.exports.cli = cli;
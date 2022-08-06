const path = require("path");
const helpers = require(path.join(__dirname, "..", "helpers"));
const commands = require(__dirname + "/commands");

const cmd = commands.cmd;


//*********************************************************************************
//Entry level CLI; retrieves the first command and calls another CLI parser
//appropriate to that command
//*********************************************************************************
function cli(args) {
  
  if (args.length > 2) {

    let a = args[2];
    if (a === "help") { //Special meta command

      if (args.length > 3) {
        
        let a2 = args[3];
        if (a2 in cmd) {
          if (args.length === 4)
            helpers.outputHelp(a2, cmd[a2]);
          else
            console.log("Error: Extraneous arguments for command \"help\"");
        } else
          console.log("Error: Invalid command \"" + a2 + "\"");
        
        return -1;

      } else {
        helpers.outputHelpAll(cmd);
        return -1;
      }
      
    } else if (a in cmd) {
      return [cmd[a].scrape, cmd[a].cli(args)]; //Enters the appropriate call function and parser
    } else {
      console.log("Error: Invalid command \"" + a + "\"; see \"help\" for all valid cmds");
      return -1;
    }

  } else {
    console.log("Error: No commands provided")
    return -1;
  }
}


module.exports.cli = cli;
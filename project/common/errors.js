
  /**********************************************************/
 /* List of error codes for different command CLIs to call */
/**********************************************************/


//*********************************************************************************
//Focuses specifically on errors found while processing a command and its arguments
//*********************************************************************************
function errorCodesNums(code, command, expected, recieved) {

  switch (code) {
    
    case 0: //Not enough args
      console.log("Error: Command \"" + command + "\" requires at least " + expected + " arguments; recieved " + recieved);
      break;
    case 1: //Too many args; mainly to be used for --help
      console.log("Error: Extraneous arguments for command \"" + command + "\"; only expected " + expected + " leading args");
      break;
    case 2: //Command given too many times
      console.log("Error: Command \"" + command + "\" called " + recieved + " times; only expected " + expected);
      break;
    case 3: //Command (or module) does not exist
      console.log("Error: Invalid command/module \"" + command + "\"");
      break;
    case 4: //Command required
      console.log("Error: Command \"" + command + "\" is required");
      break;
  }

  return true;
}


//*********************************************************************************
//Focuses on errors involving command/module conflicts
//*********************************************************************************
function errorCodesConflict(code, command1, command2, value = "") {

  switch (code) {

    case 0: //Simple conflict between flags or between a flag and a command
      console.log("Error: Command \"" + command1 + "\" is mutually exclusive with \"" + command2 + "\"");
      break;
    case 1: //Conflict between commands, based on a common value
      console.log("Error: Argument \"" + value + "\" cannot be specified for both commands \"" + command1 + "\" and \"" + command2 + "\"");
      break;
    case 2: //Conflict when a command (command1) is called, and a module (value) is called
      console.log("Error: Module \"" + value + "\" cannot be both specified as an argument for command \"" + command1 + "\" and be called");
      break;
  }

  return true;
}


function errorCodesOutput(code, command, value) {

  switch (code) {

    case 0: //Invalid filename
      console.log("Error: Invalid filename \"" + value + "\" for command \"" + command + "\"");
      break;
    case 1: //Invalid filepath
      console.log("Error: Invalid destination \"" + value + "\" for command \"" + command + "\"");
      break;
  }

  return true;
}


//*********************************************************************************
//Focuses on errors involving user defined "scope", either with modules or commands
//*********************************************************************************
function errorCodesScope(code, moduleOrCommand) {

  switch (code) {

    case 0: //Module cannot be exited
      console.log("Error: Extraneous closing marker; module \"" + moduleOrCommand + "\" cannot be exited");
      break;
    case 1: //Extra closing bracket
      console.log("Error: Extraneous closing bracket \"}\"");
      break;
    case 2: //Scope not closed
      console.log("Error: Command \"" + moduleOrCommand + "\" requires a closing bracket \"}\"");
      break;
    case 3: //Filter unclosed but scope closed
      console.log("Error: Attempt to exit module \"" + moduleOrCommand + "\" while filter is still open");
      break;
  }

  return true;
}


//*********************************************************************************
//More general error code list; mostly for values and value conflicts
//*********************************************************************************
function errorCodes(code, arg, value = "") {
  
  switch (code) {

    case -4:
      console.log("Error: Invalid playlist link \"" + value + "\"");
      break;
    case -3: //Bad search query
      console.log("Error: Bad search query \"" + value + "\"");
      break;
    case -2: //Bad link
      console.log("Error: Invalid YouTube link \"" + value + "\"");
      break;
    case -1: //Multiple inputs
      console.log("Error: Must specify only one value for command \"" + arg + "\"");
      break;
    
    case 2: //Non-filter command
      console.log("Error: Command \"" + arg + "\" is invalid inside of a filter");
      break;
    case 3: //Invalid value
      console.log("Error: Argument \"" + value + "\" is invalid for command \"" + arg + "\"");
      break;
    case 4: //Filter command misplaced
      console.log("Error: Command \"" + arg + "\" is invalid outside of a filter");
      break;
    case 5: //Multiple in filter
      console.log("Error: Multiple occurences of command \"" + arg + "\" not allowed inside of a filter");
      break;
    case 6: //Misplaced bracket
      console.log("Error: Extraneous filter ending bracket \"}\"");
      break;
    case 7: //Check and match required
      console.log("Error: Commands \"--check\" and \"--match\" required in a filter");
      break;
    case 8: //Compare required for numerical
      console.log("Error: Command \"--compare\" required for numerical checker \"" + value + "\"");
      break;
    case 9: //Invalid compare value for numerical
      console.log("Error: Value \"" + value + "\" for --compare incompatible with a numerical checker");
      break;
    case 10: //Non-numerical match value
      console.log("Error: Value \"" + value + "\" cannot be evaluated as an integer for a numerical checker");
      break;
    case 11: //Invalid compare value for string
      console.log("Error: Value \"" + value + "\" for --compare incompatible with a string checker");
      break;
    case 12: //Filter ignore conflict
      console.log("Error: Check value \"" + value + "\" cannot be used in a filter and also be ignored");
      break;
    case 13: //Multiple output destinations
      console.log("Error: Must specify only one output");
      break;
    case 14: //Invalid destination
      console.log("Error: Folder/file destination not found");
      break;
    case 15: //Value has to be non-zero natural
      console.log("Error: Value \"" + value + "\" is required to be positive by command \"" + arg + "\"");
      break;
    case 16: //Not a number
      console.log("Error: Value \"" + value + "\" cannot be evaluated as an integer for command \"" + arg + "\"");
      break;

    case 50: //Starting command
      console.log("Error: Command \"" + arg + "\" must be specified at the start of the call");
      break;
    case 51: //Extra args
      console.log("Error: Extraneous arguments for command \"" + arg + "\"");
      break;

    case 99: //Bad arg
      console.log("Error: Invalid argument \"" + arg + "\"");
      break;

    case 100: //No video specified
      console.log("Error: No video link specified");
      break;
    case 101: //Bracket unclosed
      console.log("Error: Filter unclosed; needs an ending bracket \"}\"");
      break;
    case 102: //No search specified
      console.log("Error: No search query specified");
  }

  return true;
}


module.exports.errorCodesNums = errorCodesNums;
module.exports.errorCodesConflict = errorCodesConflict;
module.exports.errorCodesOutput = errorCodesOutput;
module.exports.errorCodesScope = errorCodesScope;
module.exports.errorCodes = errorCodes;

  /**********************************************************/
 /* List of error codes for different command CLIs to call */
/**********************************************************/


function errorCodes(code, arg, value = "") {
  
  switch(code) {

    case -2: //Bad link
      console.log("Error: Invalid youtube link \"" + value + "\"");
      break;
    case -1: //Multiple inputs
      console.log("Error: Must specify only one input link");
      break;
    
    case 2: //Non-filter argument
      console.log("Error: Argument \"" + arg + "\" is invalid inside of a filter");
      break;
    case 3: //Invalid value
      console.log("Error: Value \"" + value + "\" is invalid for argument \"" + arg + "\"");
      break;
    case 4: //Filter argument misplaced
      console.log("Error: Argument \"" + arg + "\" is invalid outside of a filter");
      break;
    case 5: //Multiple in filter
      console.log("Error: Multiple occurences of argument \"" + arg + "\" not allowed inside of a filter");
      break;
    case 6: //Misplaced bracket
      console.log("Error: Extraneous filter ending bracket \"}\"");
      break;
    case 7: //Check and match required
      console.log("Error: Arguments \"check\" and \"match\" required in a filter");
      break;
    case 8: //Compare required for numerical
      console.log("Error: Argument \"compare\" required for numerical checker \"" + value + "\"");
      break;
    case 9: //Invalid compare value for numerical
      console.log("Error: Value \"" + value + "\" for compare incompatible with a numerical checker");
      break;
    case 10: //Non-numerical match value
      console.log("Error: Value \"" + value + "\" cannot be evaluated as an integer for a numerical checker");
      break;
    case 11: //Invalid compare value for string
      console.log("Error: Value \"" + value + "\" for compare incompatible with a string checker");
      break;
    case 12: //Filter ignore conflict
      console.log("Error: Check value \"" + value + "\" cannot be used in a filter and also be ignored");
      break;
    case 13: //Multiple output destinations
      console.log("Error: Must specify only one output destination");
      break;
    case 14: //Invalid destination
      console.log("Error: Folder/file destination not found");
      break;
    case 15: //Value has to be non-zero natural
      console.log("Error: Value \"" + value + "\" is required to be positive by argument \"" + arg + "\"");
      break;
    case 16: //Not a number
      console.log("Error: Value \"" + value + "\" cannot be evaluated as an integer for argument \"" + arg + "\"");
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

    case 100: //No input specified
      console.log("Error: No input link specified");
      break;
    case 101: //Bracket unclosed
      console.log("Error: Filter unclosed; needs an ending bracket \"}\"");
      break;
  }

  return true;
}


module.exports.errorCodes = errorCodes;

global.verbose = 4; //Default verbosity level

function custom_logging(verbosity, msg) { //Simple function to save some space with verbosity level checking
    if (verbosity <= global.verbose)
        console.log(msg);
}

global.sendvb = custom_logging;
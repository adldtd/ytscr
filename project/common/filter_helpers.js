const helpers = require("./helpers");


  /****************************************************************************************/
 /* Helper functions for filtering and conversion inside of different scraping functions */
/****************************************************************************************/


//*********************************************************************************
//Condense a view count into a pure number
//*********************************************************************************
function crunchViewCount(views) {
  views = views.split(" ", 1)[0];
  if (isNaN(parseInt(views))) //"No views," should work for different languages
    return 0;

  let num = 0;
  let places = views.split(",");
  let modifier = 1;

  for (let i = places.length - 1; i >= 0; i--) {
    num += parseInt(places[i]) * modifier;
    modifier *= Math.pow(10, places[i].length);
  }

  return num;
}

//*********************************************************************************
//Converts abbreviated views into numerical form; only works with english results
//*********************************************************************************
function crunchSimpleViews(views) {
  views = helpers.safeSplit(views, " ", 1)[0];
  if (views === "No")
    return 0;

  let lastChar = views[views.length - 1];
  if (lastChar === "K")
    return (Number(views) * 1000);
  if (lastChar === "M")
    return (Number(views) * 1000000);
  if (lastChar === "B")
    return (Number(views) * 1000000000);
  
  return Number(views);
}

//*********************************************************************************
//Converts video runtime into seconds
//*********************************************************************************
function durationToSec(duration) {
  
  let time = 0;
  let divisions = duration.split(":");

  for (let i = 0; i < divisions.length; i++)
    divisions[i] = parseInt(divisions[i]);

  if (divisions.length === 3) //hh:mm::ss
    time = (divisions[0] * 3600) + (divisions[1] * 60) + divisions[2];
  else if (divisions.length === 2) //mm:ss
    time = (divisions[0] * 60) + divisions[1];
  
  return time;
}


module.exports.crunchViewCount = crunchViewCount;
module.exports.crunchSimpleViews = crunchSimpleViews;
module.exports.durationToSec = durationToSec;
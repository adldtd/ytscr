const axios = require("axios").default;
const fs = require("fs");
const process = require("node:process");
const readline = require("readline");

var get_video = { //These two configurations are to be changed around throughout the program's lifetime
  method: "GET",
  url: "__________",
  authority: "www.youtube.com",
  validateStatus: () => true
};

var config = {
    method: "POST",
    url: "__________",
    authority: "www.youtube.com",
    validateStatus: () => true
};
config.data = JSON.parse(fs.readFileSync("config_data.json")); //*****************USER AGENT COULD BE REMOVED


/*
* Settings:
*   save: boolean - whether to keep updating saved comments
*   saveOnlyMatch: boolean - whether to save if element matches selectors; should be false if save is false
*   logMatch: boolean - print out comment information if matched
*   limitMatch: number - **********************************************************************************
*   selectors: []
*     : {}
*       check: "author", "text", "published", "votes" - what element to check
*       match: string - the string to compare to check's value
*       compare: "", "=", "<", ">", "<=", ">=" - for author, text, published, only the former two are valid; for votes the latter five
*       caseSensitive: bool - whether case matters; only valid for string cases
*   include: {}
*     author: boolean
*     text: boolean
*     id: boolean
*     published: boolean
*     votes: boolean
*/


//https://stackoverflow.com/a/65863081
function clearLastLine() {
  readline.moveCursor(process.stdout, 0, -1);
  readline.clearLine(process.stdout, 1); //Only works if cursor was on a newline before the function
}


//*********************************************************************************
//Fills in any incomplete/blank settings with their default values for the scraper
//to work with
//*********************************************************************************
function initSettings(settings) {

  if (!("save" in settings)) settings.save = true;
  if (!("saveOnlyMatch" in settings)) settings.saveOnlyMatch = false;
  if (!("logMatch" in settings)) settings.logMatch = false;
  if (!("selectors" in settings)) settings.selectors = [];
  if (!("include" in settings)) settings.include = {};
}


//*********************************************************************************
//Scrapes Youtube comments using a "chain" of continuation ids provided by each
//response
//*********************************************************************************
async function scrapeComments(continuation_id, config, timeout = 1000, scrapeRep = false, limit = Number.POSITIVE_INFINITY, settings = {}) {

  initSettings(settings);

  let savedComments = [];
  let counter = 0;
  let hasContinuation = true;

  while (hasContinuation) {
    
    hasContinuation = false;
    config.data.continuation = continuation_id; //Chaining requests

    await new Promise((resolve) => setTimeout(resolve, timeout));
    let resp = await axios(config);

    if (resp.status != 200) {
      console.log(resp.status + " " + resp.statusText);
      return [];
    }


    let comments = resp.data.onResponseReceivedEndpoints;
    if (comments.length > 1) //First batch of comments recieved
      comments = comments[1].reloadContinuationItemsCommand.continuationItems;
    else
      comments = comments[0].appendContinuationItemsAction.continuationItems;


    for (c in comments) {

      if (!(counter < limit)) {
        hasContinuation = false;
        break;
      }

      if ("continuationItemRenderer" in comments[c]) {
        continuation_id = comments[c].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }
        
      let innerComment;
      if ("commentThreadRenderer" in comments[c])
        innerComment = comments[c].commentThreadRenderer.comment.commentRenderer;
      else
        continue;


      let singleComment = getCommentData(innerComment, settings.include);
      let match = commentMatches(singleComment, settings.selectors);
      if (settings.saveOnlyMatch && !match)
        singleComment = {};

      if (scrapeRep && "replies" in comments[c].commentThreadRenderer) {
        let replies_continuation_id = comments[c].commentThreadRenderer.replies.commentRepliesRenderer.contents[0].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        let pack = await scrapeReplies(replies_continuation_id, config, timeout, counter, limit, settings);
        singleComment.replies = pack[1];
        counter = pack[0];
      }

      if (settings.saveOnlyMatch) {
        if (match)
          savedComments.push(singleComment);
        else if ("replies" in singleComment && singleComment.replies.length > 0)
          savedComments.push(singleComment);
      } else if (settings.save)
        savedComments.push(singleComment);

      if (settings.logMatch && match)
        printComment(singleComment, config);
      counter += 1;
    }

    clearLastLine();
    console.log("Comments scraped: " + counter);
  }

  return savedComments;

}


//*********************************************************************************
//Very similar to scrapeComments, but deals specifically with replies (which have
//slightly different structures compared to comments)
//*********************************************************************************
async function scrapeReplies(continuation_id, config, timeout, counter, limit, settings) {

  let savedComments = [];
  let hasContinuation = true;

  while (hasContinuation) {
    
    hasContinuation = false;
    config.data.continuation = continuation_id; //Chaining requests

    await new Promise((resolve) => setTimeout(resolve, timeout));
    let resp = await axios(config);

    if (resp.status != 200) {
      console.log(resp.status + " " + resp.statusText);
      return [counter, []];
    }


    let comments = resp.data.onResponseReceivedEndpoints;
    if (comments.length > 1)
      comments = comments[1].reloadContinuationItemsCommand.continuationItems;
    else
      comments = comments[0].appendContinuationItemsAction.continuationItems;


    for (c in comments) {

      if (!(counter < limit)) {
        hasContinuation = false;
        break;
      }

      if ("continuationItemRenderer" in comments[c]) {
        continuation_id = comments[c].continuationItemRenderer.button.buttonRenderer.command.continuationCommand.token;
        hasContinuation = true;
        continue;
      }
        
      let innerComment;
      if ("commentRenderer" in comments[c])
        innerComment = comments[c].commentRenderer;
      else
        continue;

      let singleComment = getCommentData(innerComment);
      let match = commentMatches(singleComment, settings.selectors);
      
      if (settings.save) {
        if (!settings.saveOnlyMatch || match)
          savedComments.push(singleComment);
      }
      if (settings.logMatch && match)
        printComment(singleComment, config);
      counter += 1;
    }

    clearLastLine();
    console.log("Comments scraped: " + counter);
  }

  return [counter, savedComments];

}


//*********************************************************************************
//Crunch a comment and return a simplified form
//*********************************************************************************
function getCommentData(innerComment, options = {}) { //Condenses a retrieved comment

  let singleComment = {};

  if ("author" in options ? options.author : true)
    singleComment.author = innerComment.authorText.simpleText;

  if ("text" in options ? options.text : true) {
    singleComment.text = "";
    for (run in innerComment.contentText.runs)
    singleComment.text += innerComment.contentText.runs[run].text;
  }

  if ("id" in options ? options.id : true)
    singleComment.id = innerComment.commentId;

  if ("published" in options ? options.published : true) {
    singleComment.published = "";
    for (run in innerComment.publishedTimeText.runs)
    singleComment.published += innerComment.publishedTimeText.runs[run].text;
  }

  if ("votes" in options ? options.votes : true) {
    if (innerComment.isLiked)
      singleComment.votes = innerComment.voteCount.simpleText;
    else
      singleComment.votes = "0";
  }

  return singleComment;
}


//*********************************************************************************
//Checks if a comment matches by looking at an array of guidelines
//*********************************************************************************
function commentMatches(singleComment, selectors) {

  let returnMatch = true;

  for (s in selectors) {

    let condition = selectors[s];
    if (condition.check !== "votes") {

      if (condition.compare === "=") //Exact match needed
        returnMatch = singleComment[condition.check] === condition.match;
      else
        returnMatch = singleComment[condition.check].includes(condition.match);
    }
    else {
      
      let commentCheck = parseInt(singleComment[condition.check]);
      switch (condition.compare) {
        case "<":
          returnMatch = commentCheck < condition.match;
          break;
        case ">":
          returnMatch = commentCheck > condition.match;
          break;
        case "<=":
          returnMatch = commentCheck <= condition.match;
          break;
        case ">=":
          returnMatch = commentCheck >= condition.match;
          break;
        default:
          returnMatch = commentCheck === condition.match;
      }
    }

    if (!returnMatch)
      break;
  }

  return returnMatch;
}


//*********************************************************************************
//Outputs a certain comment's data
//*********************************************************************************
function printComment(singleComment, config) {

  clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleComment) {
    if (att === "id")
      console.log("link: " + config.data.context.client.originalUrl + "&lc=" + singleComment[att]);
    else
      console.log(att + ": " + singleComment[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}



//*********************************************************************************
//Main entry function; retrieves a video and then scrapes it
//*********************************************************************************
async function collectComments(url, get_video, config, timeout = 1000, scrapeRep = false, limit = Number.POSITIVE_INFINITY, settings = {}) {

  get_video.url = url;
  config.data.context.client.originalUrl = url;
  config.data.context.client.mainAppWebInfo.graftUrl = url;

  let resp = await axios(get_video);

  if (resp.status !== 200) {
    console.log(resp.status + " " + resp.statusText);
    return;
  }
  if (resp.data.includes("Comments are turned off.")) {
    console.log("Comments are turned off.");
    return;
  }

  let inner_api_key = resp.data.split('"INNERTUBE_API_KEY":"', 2)[1].split('"')[0];
  let continuation_id = resp.data.split('"continuationCommand":{"token":"', 2)[1].split('"')[0];

  let commentUrl = "https://www.youtube.com/youtubei/v1/next?key=" + inner_api_key + "&prettyPrint=false";
  config.url = commentUrl;
  config.data.continuation = continuation_id;
  
  let savedComments = await scrapeComments(continuation_id, config, timeout, scrapeRep, limit, settings);
  if (savedComments.length > 0)
    fs.writeFileSync("comments_" + url.split("v=", 2)[1] + ".json", JSON.stringify(savedComments, null, 2));
}


(async () => { //Main

  console.log("\n");

  let settings = {
    save: false,
      saveOnlyMatch: false,
    logMatch: true,
    selectors: [
      {
        check: "author",
        match: "Z",
        compare: ""
      }
    ]
  };
  let url = "https://www.youtube.com/watch?v=3fmzvB-Kq0s";
  await collectComments(url, get_video, config, 1000, true, Infinity, settings);
  
})();
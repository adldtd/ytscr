//const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "helpers")).makeRequest;
const handleSaveJSON = require(path.join(__dirname, "..", "helpers")).handleSaveJSON;
const clearLastLine = require(path.join(__dirname, "..", "helpers")).clearLastLine;


  /*************************************************/
 /* The scraping function for the comments module */
/*************************************************/


/*
* Settings:
*   save: boolean - whether to keep updating saved comments
*   saveOnlyMatch: boolean - whether to save if element matches selectors; should be false if save is false
*   logMatch: boolean - print out comment information if matched
*   limitMatch: number - how many matches to take before stopping
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


//*********************************************************************************
//Scrapes Youtube comments using a "chain" of continuation ids provided by each
//response
//*********************************************************************************
async function scrapeComments(continuation_id, config, timeout = 1000, settings = {}) {

  let savedComments = [];
  let counter = 0;
  let matchCounter = 0;
  let hasContinuation = true;

  while (hasContinuation) {
    
    hasContinuation = false;
    config.data.continuation = continuation_id; //Chaining requests

    let resp = await makeRequest(config, timeout, 1)
    if (resp === -1) return savedComments;

    //Parse recieved data
    let comments = resp.data.onResponseReceivedEndpoints;
    if (comments.length > 1) { //First batch of comments recieved

      if (settings.newestFirst) {

        let newestSection = comments[0].reloadContinuationItemsCommand.continuationItems[0].commentsHeaderRenderer.sortMenu.sortFilterSubMenuRenderer.subMenuItems[1];
        continuation_id = newestSection.serviceEndpoint.continuationCommand.token;
        config.data.continuation = continuation_id;

        resp = await makeRequest(config, timeout, 1);
        if (resp === -1) return savedComments;

        comments = resp.data.onResponseReceivedEndpoints[1].reloadContinuationItemsCommand.continuationItems;

      } else
        comments = comments[1].reloadContinuationItemsCommand.continuationItems;

    } else
      comments = comments[0].appendContinuationItemsAction.continuationItems;


    for (c in comments) {

      if (counter >= settings.limit || matchCounter >= settings.limitMatch) {
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
      if (match) matchCounter++;

      if (settings.saveOnlyMatch && !match)
        singleComment = {};

      if (settings.logMatch && match)
        printComment(singleComment, config);
      
      counter++;

      if (settings.useReplies && "replies" in comments[c].commentThreadRenderer) {

        let oldSelectors = settings.selectors; let oldMatchCounter = matchCounter;
        if (!settings.replyFiltering && match) {
          settings.selectors = [];
          matchCounter = Number.NEGATIVE_INFINITY;
        }

        let replies_continuation_id = comments[c].commentThreadRenderer.replies.commentRepliesRenderer.contents[0].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        let pack = await scrapeReplies(replies_continuation_id, config, timeout, counter, matchCounter, settings);
        
        counter = pack[0];
        matchCounter = pack[1];
        singleComment.replies = pack[2];

        if (!settings.replyFiltering && match) {
          settings.selectors = oldSelectors;
          matchCounter = oldMatchCounter; //Any matches made in replies are ignored in NRF mode
        }
      }

      if (settings.saveOnlyMatch) {
        if (match)
          savedComments.push(singleComment);
        else if (settings.useReplies && "replies" in singleComment && singleComment.replies.length > 0)
          savedComments.push(singleComment);
      } else if (settings.save)
        savedComments.push(singleComment);
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
async function scrapeReplies(continuation_id, config, timeout, counter, matchCounter, settings) {

  let savedComments = [];
  let hasContinuation = true;

  while (hasContinuation) {
    
    hasContinuation = false;
    config.data.continuation = continuation_id; //Chaining requests

    let resp = await makeRequest(config, timeout, 1);
    if (resp === -1) return [counter, matchCounter, savedComments];


    let comments = resp.data.onResponseReceivedEndpoints;
    if (comments.length > 1)
      comments = comments[1].reloadContinuationItemsCommand.continuationItems;
    else
      comments = comments[0].appendContinuationItemsAction.continuationItems;


    for (c in comments) {

      if (counter >= settings.limit || matchCounter >= settings.limitMatch) {
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

      let singleComment = getCommentData(innerComment, settings.include);
      let match = commentMatches(singleComment, settings.selectors);
      if (match) matchCounter++;
      
      if (settings.save) {
        if (!settings.saveOnlyMatch || match)
          savedComments.push(singleComment);
      }
      if (settings.logMatch && match)
        printReply(singleComment, config);

      counter++;
    }

    clearLastLine();
    console.log("Comments scraped: " + counter);
  }

  return [counter, matchCounter, savedComments];

}


//*********************************************************************************
//Crunch a comment and return a simplified form
//*********************************************************************************
function getCommentData(innerComment, include = {}) { //Condenses a retrieved comment

  let singleComment = {};

  if ("author" in include ? include.author : true)
    singleComment.author = innerComment.authorText.simpleText;

  if ("text" in include ? include.text : true) {
    singleComment.text = "";
    for (run in innerComment.contentText.runs)
      singleComment.text += innerComment.contentText.runs[run].text;
  }

  if ("id" in include ? include.id : true)
    singleComment.id = innerComment.commentId;

  if ("published" in include ? include.published : true) {
    singleComment.published = "";
    for (run in innerComment.publishedTimeText.runs)
    singleComment.published += innerComment.publishedTimeText.runs[run].text;
  }

  if ("votes" in include ? include.votes : true) {
    if ("voteCount" in innerComment)
      singleComment.votes = innerComment.voteCount.simpleText;
    else
      singleComment.votes = "0";
  }

  if ("picture" in include ? include.picture : true) {
    let thumbnails = innerComment.authorThumbnail.thumbnails;
    singleComment.picture = thumbnails[thumbnails.length - 1.].url; //Always goes for the biggest thumbnail
  }

  if ("channel" in include ? include.channel : true)
    singleComment.channel = innerComment.authorEndpoint.browseEndpoint.browseId;

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

      let commentCheck = singleComment[condition.check];
      let conditionMatch = condition.match;
      if ("caseSensitive" in condition ? !condition.caseSensitive : true) {
        commentCheck = commentCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "=") //Exact match needed
        returnMatch = commentCheck === conditionMatch;
      else if (condition.compare === "")
        returnMatch = commentCheck.includes(conditionMatch);
    }
    else {
      
      let commentCheck = votesToNum(singleComment["votes"]);
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
        case "=":
          returnMatch = commentCheck === condition.match;
          break;
      }
    }

    if (!returnMatch)
      break;
  }

  return returnMatch;
}


//*********************************************************************************
//Converts a votes string into a numerical value
//*********************************************************************************
function votesToNum(voteCount) {
  
  let chr = voteCount.charAt(voteCount.length - 1);

  if (chr === "B")
    return parseFloat(voteCount.substring(0, voteCount.length - 1)) * 1000000000;
  if (chr === "M")
    return parseFloat(voteCount.substring(0, voteCount.length - 1)) * 1000000;
  if (chr === "K")
    return parseFloat(voteCount.substring(0, voteCount.length - 1)) * 1000;
  
  return parseInt(voteCount);
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
    else if (att === "channel")
      console.log("channel: " + "https://youtube.com/channel/" + singleComment[att]);
    else
      console.log(att + ": " + singleComment[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


function printReply(singleComment, config) {

  clearLastLine();
  console.log("\t-------------------------------------------------------------------");
  for (att in singleComment) {
    if (att === "id")
      console.log("\tlink: " + config.data.context.client.originalUrl + "&lc=" + singleComment[att]);
    else if (att === "channel")
      console.log("\tchannel: " + "https://youtube.com/channel/" + singleComment[att]);
    else
      console.log("\t" + att + ": " + singleComment[att]);
  }
  console.log("\t-------------------------------------------------------------------\n\n");
}



//*********************************************************************************
//Main entry function; retrieves a video and then scrapes it
//*********************************************************************************
async function collectComments(settings) {

  let url = settings.url;
  let destination = settings.destination;
  let timeout = settings.timeout;

  let get_video = {
    method: "GET",
    url: "__________",
    authority: "www.youtube.com",
    validateStatus: () => true
  };
  
  let config = {
    method: "POST",
    url: "__________",
    authority: "www.youtube.com",
    validateStatus: () => true
  };
  config.data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config_data.json")));

  //Set up data and make the initial video request
  get_video.url = url;
  config.data.context.client.originalUrl = url;
  config.data.context.client.mainAppWebInfo.graftUrl = url;

  let resp = await makeRequest(get_video, timeout, 1);
  if (resp === -1) {
    if (settings.save)
      console.log("No comments found. No save made.");
    else
      console.log("No comments found.");
    return;
  }

  let location = resp.data.indexOf("var ytInitialData = ");
  if (location === -1) {
    console.log("\nAn unexpected error occurred.");
    if (settings.save)
      console.log("No comments found. No save made.");
    else
      console.log("No comments found.");
    return;
  }

  let initialData = JSON.parse(resp.data.substring(location + 20).split(";</script><script nonce", 1)[0]);
  if ("conversationBar" in initialData.contents.twoColumnWatchNextResults) { //Indicates the chat bar
    
    let bar = initialData.contents.twoColumnWatchNextResults.conversationBar;
    let live = ("isReplay" in bar.liveChatRenderer) ? !bar.liveChatRenderer.isReplay : true;
    if (live) {
      console.log("\nLivestream ongoing.");
      if (settings.save)
        console.log("No comments found. No save made.");
      else
        console.log("No comments found.");
      return;
    }
  }
  
  
  initialData = initialData.contents.twoColumnWatchNextResults.results.results.contents;

  if ("videoPrimaryInfoRenderer" in initialData[0]) {
    let runs = initialData[0].videoPrimaryInfoRenderer.title.runs;
    let title = "";
    for (run in runs)
      title += runs[run].text;
    console.log("\n\"" + title + "\"");
    console.log(initialData[0].videoPrimaryInfoRenderer.dateText.simpleText);
  }
  
  //Determine the video type, as well as any video errors encountered
  let contents = initialData[initialData.length - 1].itemSectionRenderer.contents;
  let requestError = false;
  for (c in contents) {

    if ("backgroundPromoRenderer" in contents[c]) {
      console.log("\n" + contents[c].backgroundPromoRenderer.title.runs[0].text);
      requestError = true;
      break;
    } else if ("messageRenderer" in contents[c]) {
      console.log("\n" + contents[c].messageRenderer.text.runs[0].text);
      requestError = true;
      break;
    } else if ("continuationItemRenderer" in contents[c])
      continue;
    else {
      console.log(contents[c]);
      console.log("\nAn unexpected error occurred.");
      requestError = true;
      break;
    }
  }

  if (requestError) {
    if (settings.save)
      console.log("No comments found. No save made.");
    else
      console.log("No comments found.");
    return;
  }
  
  //Start scraping
  let inner_api_key = resp.data.split('"INNERTUBE_API_KEY":"', 2)[1].split('"')[0];
  let continuation_id = resp.data.split('"continuationCommand":{"token":"', 2)[1].split('"')[0];

  let commentUrl = "https://www.youtube.com/youtubei/v1/next?key=" + inner_api_key + "&prettyPrint=false";
  config.url = commentUrl;
  config.data.continuation = continuation_id;
  
  console.log("\n");
  let savedComments = await scrapeComments(continuation_id, config, timeout, settings);
  console.log("Complete");

  if (!settings.save)
    return;

  if (savedComments.length === 0) {
    console.log("No comments found. No save made.");
    return;
  }

  let filename = "comments_" + settings.url.split("v=", 2)[1];
  let filepath = handleSaveJSON(filename, savedComments, settings);
  console.log("Saved as " + filepath);
  
}


module.exports.scrape = collectComments;
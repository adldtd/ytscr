const fs = require("fs");
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).makeRequest;
const clearLastLine = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).clearLastLine;
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));


  /*************************************************/
 /* The scraping function for the comments module */
/*************************************************/


//*********************************************************************************
//Changes config to be used for continous post requests
//*********************************************************************************
function reformatConfig(inner_api_key, continuation_id, config) {

  config.method = "POST";
  let commentUrl = "https://www.youtube.com/youtubei/v1/next?key=" + inner_api_key + "&prettyPrint=false";
  config.url = commentUrl;
  config.data.continuation = continuation_id;
}


//*********************************************************************************
//Sees if the video data given can be scraped
//*********************************************************************************
function verifyResponse(resp) {

  let initialData = helpers.safeSplit(resp.data, "var ytInitialData = ", 1);
  if (initialData.length < 2) {
    global.sendvb(2, "\nAn unexpected error occurred.\nNo comments found.");
    return -1;
  }

  initialData = JSON.parse(helpers.safeSplit(initialData[1], ";</script><script nonce", 1)[0]);
  if ("conversationBar" in initialData.contents.twoColumnWatchNextResults) { //Indicates the chat bar
    
    let bar = initialData.contents.twoColumnWatchNextResults.conversationBar;
    let live;
    if ("liveChatRenderer" in bar)
      live = ("isReplay" in bar.liveChatRenderer) ? !bar.liveChatRenderer.isReplay : true;
    else {
      let text = bar.conversationBarRenderer.availabilityMessage.messageRenderer.text.runs[0].text;
      if (text.toLowerCase().includes("replay")) //Chat replay
        live = false;
      else
        live = true;
    }

    if (live) {
      global.sendvb(2, "\nLivestream ongoing.\nNo comments found.");
      return -1;
    }
  }
  
  initialData = initialData.contents.twoColumnWatchNextResults.results.results.contents; //Deeper
  
  //Determine the video type, as well as any video errors encountered
  let contents = initialData[initialData.length - 1].itemSectionRenderer.contents;
  let requestError = false;
  for (c in contents) {

    if ("messageRenderer" in contents[c]) { //Background promo renderer is handled by video scraper
      global.sendvb(2, "\nError: " + contents[c].messageRenderer.text.runs[0].text);
      requestError = true;
      break;
    } else if ("continuationItemRenderer" in contents[c])
      continue;
  }

  if (requestError) {
    global.sendvb(2, "No comments found.");
    return -1;
  }

  return 0;
}


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

    let resp = await makeRequest(config, timeout, 1, 2)
    if (resp === -1) return savedComments;

    //Parse recieved data
    let comments = resp.data.onResponseReceivedEndpoints;
    if (comments.length > 1) { //First batch of comments recieved

      if (settings.newest) {

        let newestSection = comments[0].reloadContinuationItemsCommand.continuationItems[0].commentsHeaderRenderer.sortMenu.sortFilterSubMenuRenderer.subMenuItems[1];
        continuation_id = newestSection.serviceEndpoint.continuationCommand.token;
        config.data.continuation = continuation_id;

        resp = await makeRequest(config, timeout, 1, 2);
        if (resp === -1) return savedComments;

        comments = resp.data.onResponseReceivedEndpoints[1].reloadContinuationItemsCommand.continuationItems;

      } else
        comments = comments[1].reloadContinuationItemsCommand.continuationItems;

    } else
      comments = comments[0].appendContinuationItemsAction.continuationItems;


    for (c in comments) {

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
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


      let singleComment = getCommentData(innerComment, settings.ignore);
      let match = commentMatches(singleComment, settings.filter);
      if (match) matchCounter++;

      if (settings.savefilter && !match)
        singleComment = {};

      if (settings.printfilter && match)
        printComment(singleComment, config);
      
      counter++;

      if (settings.replies && "replies" in comments[c].commentThreadRenderer) {

        let oldSelectors = settings.filter; let oldMatchCounter = matchCounter;
        if (!settings.nrf && match) {
          settings.filter = [];
          matchCounter = Number.NEGATIVE_INFINITY;
        }

        let replies_continuation_id = comments[c].commentThreadRenderer.replies.commentRepliesRenderer.contents[0].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        let pack = await scrapeReplies(replies_continuation_id, config, timeout, counter, matchCounter, settings);
        
        counter = pack[0];
        matchCounter = pack[1];
        singleComment.replies = pack[2];

        if (!settings.nrf && match) {
          settings.filter = oldSelectors;
          matchCounter = oldMatchCounter; //Any matches made in replies are ignored in NRF mode
        }
      }

      if (settings.savefilter) {
        if (match)
          savedComments.push(singleComment);
        else if (settings.replies && "replies" in singleComment && singleComment.replies.length > 0)
          savedComments.push(singleComment);
      } else
        savedComments.push(singleComment);
    }

    if (global.verbose >= 3) clearLastLine();
    global.sendvb(3, "Comments scraped: " + counter);
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

    let resp = await makeRequest(config, timeout, 1, 2);
    if (resp === -1) return [counter, matchCounter, savedComments];


    let comments = resp.data.onResponseReceivedEndpoints;
    if (comments.length > 1)
      comments = comments[1].reloadContinuationItemsCommand.continuationItems;
    else
      comments = comments[0].appendContinuationItemsAction.continuationItems;


    for (c in comments) {

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
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

      let singleComment = getCommentData(innerComment, settings.ignore);
      let match = commentMatches(singleComment, settings.filter);
      if (match) matchCounter++;
      
      if (!settings.savefilter || match)
        savedComments.push(singleComment);
      if (settings.printfilter && match)
        printReply(singleComment, config);

      counter++;
    }

    if (global.verbose >= 3) clearLastLine();
    global.sendvb(3, "Comments scraped: " + counter);
  }

  return [counter, matchCounter, savedComments];

}


//*********************************************************************************
//Crunch a comment and return a simplified form
//*********************************************************************************
function getCommentData(innerComment, ignore = {}) { //Condenses a retrieved comment

  let singleComment = {};

  if (!ignore.author)
    singleComment.author = innerComment.authorText.simpleText;

  if (!ignore.text) {
    singleComment.text = "";
    for (run in innerComment.contentText.runs)
      singleComment.text += innerComment.contentText.runs[run].text;
  }

  if (!ignore.id)
    singleComment.id = innerComment.commentId;

  if (!ignore.published) {
    singleComment.published = "";
    for (run in innerComment.publishedTimeText.runs)
    singleComment.published += innerComment.publishedTimeText.runs[run].text;
  }

  if (!ignore.votes) {
    if ("voteCount" in innerComment)
      singleComment.votes = innerComment.voteCount.simpleText;
    else
      singleComment.votes = "0";
  }

  if (!ignore.picture) {
    let thumbnails = innerComment.authorThumbnail.thumbnails;
    singleComment.picture = thumbnails[thumbnails.length - 1.].url; //Always goes for the biggest thumbnail
  }

  if (!ignore.channelId)
    singleComment.channelId = innerComment.authorEndpoint.browseEndpoint.browseId;

  return singleComment;
}


//*********************************************************************************
//Checks if a comment matches by looking at an array of guidelines
//*********************************************************************************
function commentMatches(singleComment, filter) {

  let returnMatch = true;

  for (s in filter) {

    let condition = filter[s];
    if (condition.check !== "votes") {

      let commentCheck = singleComment[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        commentCheck = commentCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = commentCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = commentCheck.includes(conditionMatch);
    }
    else {
      
      let commentCheck = votesToNum(singleComment["votes"]);
      switch (condition.compare) {
        case "less":
          returnMatch = commentCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = commentCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = commentCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = commentCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = commentCheck === parseInt(condition.match);
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
    else if (att === "channelId")
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
    else if (att === "channelId")
      console.log("\tchannel: " + "https://youtube.com/channel/" + singleComment[att]);
    else
      console.log("\t" + att + ": " + singleComment[att]);
  }
  console.log("\t-------------------------------------------------------------------\n\n");
}



//*********************************************************************************
//Main entry function; retrieves a video and then scrapes it
//*********************************************************************************
async function collectComments(settings, config, timeout, videoResponse) {

  let result = verifyResponse(videoResponse);
  if (result === -1) return [];
  
  //Start scraping
  let inner_api_key = helpers.safeSplit(videoResponse.data, '"INNERTUBE_API_KEY":"', 1)[1];
  inner_api_key = helpers.safeSplit(inner_api_key, '"', 1)[0];
  
  let continuation_id = helpers.safeSplit(videoResponse.data, '"continuationCommand":{"token":"', 1)[1];
  continuation_id = helpers.safeSplit(continuation_id, '"', 1)[0];

  reformatConfig(inner_api_key, continuation_id, config);
  
  global.sendvb(2, "\n");
  let savedComments = await scrapeComments(continuation_id, config, timeout, settings);
  global.sendvb(2, "Complete");

  if (savedComments.length === 0) {
    global.sendvb(2, "No comments found.");
  }

  return savedComments;
  
}


module.exports.scraper = collectComments;
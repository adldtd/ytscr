const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {getTabData} = require("../channel_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function scrapeStore(settings, config, timeout, innerData) {

  let savedStore = [];
  let counter = 0;
  let matchCounter = 0;

  let tabs = innerData.contents.twoColumnBrowseResultsRenderer.tabs;
  innerData = null;
  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;
    if (tab.selected) {
      innerData = tab.content.sectionListRenderer.contents;
      innerData = innerData[0].itemSectionRenderer.contents;
      innerData = innerData[0].shelfRenderer.content.gridRenderer.items;
      break;
    }
  }
  if (innerData === null) return savedStore;

  let hasContinuation = true;
  while (hasContinuation) {
    hasContinuation = false;
    let contents = innerData;

    for (let item in contents) {
      item = contents[item];

      if ("continuationItemRenderer" in item) {
        config.data.continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }

      let innerStore = null;
      if ("verticalProductCardRenderer" in item)
        innerStore = item.verticalProductCardRenderer;
      else
        continue;

      let singleStore = retrieveStore(innerStore, settings.ignore);
      let match = storeMatches(singleStore, settings.filter);
      if (match) ++matchCounter;

      if (!settings.savefilter || match)
        savedStore.push(singleStore);
      if (settings.printfilter && match)
        printStore(singleStore);

      ++counter;

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
        hasContinuation = false;
        break;
      }
    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Products scraped: " + counter);

    if (hasContinuation) {
      innerData = await helpers.makeRequest(config, timeout, 1, INFO);
      if (innerData === -1) break;
      innerData = innerData.data;

      contents = null;
      let actions = innerData.onResponseReceivedEndpoints;
      for (let action in actions) {
        action = actions[action];
        if ("appendContinuationItemsAction" in action) {
          contents = action.appendContinuationItemsAction.continuationItems;
          break;
        }
      }
      if (contents === null) break;
      innerData = contents;
    }
  }

  return savedStore;

}


function retrieveStore(innerStore, ignore) {
  let singleStore = {};

  if (!ignore.title)
    singleStore.title = innerStore.title;

  if (!ignore.price)
    singleStore.price = innerStore.price;

  if (!ignore.seller)
    singleStore.seller = innerStore.merchantName;

  if (!ignore.link)
    singleStore.link = innerStore.navigationEndpoint.urlEndpoint.url;

  if (!ignore.thumbnail) {
    let thumbnails = innerStore.thumbnail.thumbnails;
    singleStore.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  return singleStore;
}


function storeMatches(singleStore, filter) {

  let returnMatch = true;

  for (let s in filter) {

    let condition = filter[s];
    if (condition.check !== "price") { //String checker

      let storeCheck = singleStore[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        storeCheck = storeCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq")
        returnMatch = storeCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = storeCheck.includes(conditionMatch);

    } else { //Num checker

      if (singleStore[condition.check] === "") continue; //NULL; matches instantly
      let storeCheck = filterHelpers.priceToNum(singleStore[condition.check]);

      switch (condition.compare) {
        case "less":
          returnMatch = storeCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = storeCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = storeCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = storeCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = storeCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch) break;
  }

  return returnMatch;
}


function printStore(singleStore) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleStore) {
    console.log(att + ": " + singleStore[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectStore(settings, config, timeout, initialData) {
  
  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "Store");
  if (tabData === -1) {
    global.sendvb(HEADER, "No products found.");
    return [];
  }

  let savedStore = await scrapeStore(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  if (savedStore.length === 0)
    global.sendvb(HEADER, "No products found.");

  return savedStore;
}


module.exports.scrape = collectStore;
const makeRequest = require("../../common/helpers").makeRequest;
const {INFO, HEADER, PROG} = require("../../common/verbosity_vars");


async function getTabData(config, timeout, initialData, tabName) {

  let tabs = initialData.contents.twoColumnBrowseResultsRenderer.tabs;
  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;

    if (tab.title === tabName) {

      config.data.browseId = tab.endpoint.browseEndpoint.browseId;
      config.data.params = tab.endpoint.browseEndpoint.params;
      delete config.data.continuation;
      let tabData = await makeRequest(config, timeout, 1, INFO);
      if (tabData == -1) return -1;
      tabData = tabData.data;

      delete config.data.browseId;
      delete config.data.params;

      return tabData;
    }
  }

  global.sendvb(HEADER, `Tab "${tabName}" could not be found.`);
  return -1;
}

async function getPopularTab(tab, config, timeout) {

  let buttons = tab.content.richGridRenderer;
  if (!("header" in buttons)) return -1;
  buttons = buttons.header.feedFilterChipBarRenderer.contents;

  for (let button in buttons) {
    button = buttons[button].chipCloudChipRenderer;
    if (button.isSelected === false) { //Should be the popular tab

      config.data.continuation = button.navigationEndpoint.continuationCommand.token;
      let innerData = await makeRequest(config, timeout, 1, INFO);
      if (innerData === -1) return -1;
      innerData = innerData.data;

      let actions = innerData.onResponseReceivedActions;
      for (let action in actions) {
        action = actions[action];
        if ("reloadContinuationItemsCommand" in action && action.reloadContinuationItemsCommand.slot === "RELOAD_CONTINUATION_SLOT_BODY") {
          return action.reloadContinuationItemsCommand.continuationItems;
        }
      }
      break;
    }
  }

  return -1;
}


module.exports.getTabData = getTabData;
module.exports.getPopularTab = getPopularTab;
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).makeRequest;
const clearLastLine = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).clearLastLine;
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));

const results_scraper = require("./results/results-scraper").scraper;


//*********************************************************************************
//The main scraping function
//*********************************************************************************
async function collectRecommended(settings, config, timeout, videoResponse) {
  
  return await results_scraper(settings, config, timeout, videoResponse);
}


module.exports.scraper = collectRecommended;
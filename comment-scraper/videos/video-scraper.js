const collectVideosSearch = require("./video-scraper-search").collectVideosSearch;
const collectVideosVideo = require("./video-scraper-video").collectVideosVideo;


  /*************************************************************************************************/
 /* The scraping function for the video module; relies on subfunctions for different entry points */
/*************************************************************************************************/


async function collectVideos(settings) {
  
  //Setup needed configurations
  let config = { //Needs to be configured as a GET request at the start; later changed to be POST
    url: "__________",
    authority: "www.youtube.com",
    method: "GET",
    headers:
    {
      "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    },
    validateStatus: () => true
  };

  let isVideo; //The URL is either a video or a search term
  if (settings.video !== "") {
    config.headers.referer = settings.video;
    isVideo = true;
  } else if (settings.search !== "") {
    config.headers.referer = settings.search;
    isVideo = false;
  }
  config.url = config.headers.referer;

  //Entry into subfunctions
  if (isVideo)
    await collectVideosVideo(config, settings);
  else
    await collectVideosSearch(config, settings);
}


(async () => { //Main; testing

  let settings =
  {
    video: "",
    search: "https://www.youtube.com/results?search_query=hi",

    save: true,
    prettyprint: true,

    ignore:
    {
      author: false,
      name: false,
      snippet: false,
      time: false,
      views: false,
      published: false,
      thumbnail: false,
      id: false,
      picture: false,
      channel: false
    },
    lim: 50,
    limfilter: Number.POSITIVE_INFINITY,

    destination: "",
    timeout: 1000
  };
  await collectVideos(settings);

})();
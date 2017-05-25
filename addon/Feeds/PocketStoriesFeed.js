const {Cu} = require("chrome");
const PocketFeed = require("./PocketFeed");
const am = require("common/action-manager");
const {pocket_story_endpoint, pocket_consumer_key} = require("../../pocket.json");
const {PlacesProvider} = require("addon/PlacesProvider");

Cu.import("resource://gre/modules/Task.jsm");

const UPDATE_TIME = 30 * 60 * 1000; // 30 minutes

module.exports = class PocketStoriesFeed extends PocketFeed {
  constructor(options) {
    super(options, UPDATE_TIME);
  }

  _fetchStories() {
    if (!pocket_story_endpoint || !pocket_consumer_key) {
      let err = "Pocket story endpoint not configured: Make sure to add endpoint URL and " +
        "API key to pocket.json (see pocket-example.json)";
      console.log(err); // eslint-disable-line no-console
      throw new Error(err);
    }

    let pocketUrl = `${pocket_story_endpoint}`;
    return this.fetch(pocketUrl).then(r => {
      let content = JSON.parse(r);
      return content.list ? content.list : content;
    });
  }

  // XXX Need to remove parenthesis from image URLs as React will otherwise
  // fail to render them properly as part of the SpotlightItem template.
  // This is temporary until Pocket provides alternative image links (e.g. data URIs)
  _normalizeUrl(url) {
    if (url) {
      return url.replace(/\(/g, "%28").replace(/\)/g, "%29");
    }
    return url;
  }

  /**
   * getData
   *
   * @return Promise  A promise that resolves with the "POCKET_STORIES_RESPONSE" action
   */
  getData() {
    return Task.spawn(function*() {
      let stories = yield this._fetchStories();
      stories = stories
      .filter(s => !PlacesProvider.links.blockedURLs.has(s.dedupe_url ? s.dedupe_url : s.url))
      .map(s => ({
        "guid": s.id,
        "recommended": true,
        "title": s.title,
        "description": s.excerpt ? s.excerpt : s.summary,
        "bestImage": {"url": this._normalizeUrl(s.image_src ? s.image_src : s.image)},
        "url": s.dedupe_url ? s.dedupe_url : s.url,
        "lastVisitDate": s.published_timestamp ? s.published_timestamp : s.published,
        "pocket": true
      }));

      return am.actions.Response("POCKET_STORIES_RESPONSE", stories);
    }.bind(this));
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

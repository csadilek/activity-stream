/* globals Task */
const {Cu} = require("chrome");
const PocketFeed = require("./PocketFeed");
const {POCKET_STORIES_LENGTH} = require("common/constants");
const am = require("common/action-manager");

Cu.import("resource://gre/modules/Task.jsm");

const UPDATE_TIME = 30 * 60 * 1000; // 30 minutes

module.exports = class PocketStoriesFeed extends PocketFeed {
  constructor(options) {
    super(options, UPDATE_TIME);
  }

  _fetchStories() {
    let pocketUrl = `${this.getEndpoint("pocket.stories.endpoint")}?count=${POCKET_STORIES_LENGTH}`;
    return this.fetch(pocketUrl).then(r => JSON.parse(r).list);
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
      const experiments = this.store.getState().Experiments.values;
      let stories = [];
      if (experiments.pocket) {
        stories = yield this._fetchStories();
      }
      stories = stories.map(s => ({
        "recommended": true,
        "title": s.title,
        "description": s.excerpt,
        "bestImage": {"url": this._normalizeUrl(s.image_src)},
        "url": s.dedupe_url,
        "lastVisitDate": s.published_timestamp
      }));
      return am.actions.Response("POCKET_STORIES_RESPONSE", stories);
    }.bind(this));
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

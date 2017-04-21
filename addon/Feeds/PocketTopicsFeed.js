/* globals Task */
const {Cu} = require("chrome");
const PocketFeed = require("./PocketFeed");
const {POCKET_TOPICS_LENGTH} = require("common/constants");
const am = require("common/action-manager");

Cu.import("resource://gre/modules/Task.jsm");

const UPDATE_TIME = 3 * 60 * 60 * 1000; // 3 hours

module.exports = class PocketTopicsFeed extends PocketFeed {
  constructor(options) {
    super(options, UPDATE_TIME);
  }

  _fetchTopics() {
    return this
      .fetch(this.getEndpoint("pocket.topics.endpoint"))
      .then(r => JSON.parse(r).topics.slice(0, POCKET_TOPICS_LENGTH));
  }

  /**
   * getData
   *
   * @return Promise  A promise that resolves with the "POCKET_TOPICS_RESPONSE" action
   */
  getData() {
    return Task.spawn(function*() {
      const experiments = this.store.getState().Experiments.values;
      let topics = [];
      if (experiments.pocket) {
        topics = yield this._fetchTopics();
      }
      return am.actions.Response("POCKET_TOPICS_RESPONSE", topics);
    }.bind(this));
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

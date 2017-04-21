/* globals Task */
const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");
const Request = require("sdk/request").Request;
const simplePrefs = require("sdk/simple-prefs");

module.exports = class PocketFeed extends Feed {

  constructor(options, updateTime) {
    super(options);
    this.updateTime = updateTime;
  }

  getEndpoint(prop) {
    let pocketEndpoint = simplePrefs.prefs[prop];
    if (!pocketEndpoint) {
      let err = `Pocket stories endpoint not configured (missing value for ${prop})`;
      console.log(err); // eslint-disable-line no-console
      throw new Error(err);
    }

    return pocketEndpoint;
  }

  fetch(from) {
    return new Promise((resolve, reject) => {
      Request({
        url: from,
        onComplete: response => {
          if (response.status !== 200) {
            reject(Error(response.statusText));
            return;
          }
          resolve(response.text);
        }
      }).get();
    });
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.refresh();
        break;

      case am.type("SYSTEM_TICK"):
        if (Date.now() - this.state.lastUpdated >= this.updateTime) {
          this.refresh();
        }
        break;
    }
  }
};

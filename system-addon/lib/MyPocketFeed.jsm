/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NewTabUtils.jsm");
Cu.importGlobalProperties(["fetch"]);

const {actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});
const {Prefs} = Cu.import("resource://activity-stream/lib/ActivityStreamPrefs.jsm", {});
const {shortURL} = Cu.import("resource://activity-stream/lib/ShortURL.jsm", {});
const {SectionsManager} = Cu.import("resource://activity-stream/lib/SectionsManager.jsm", {});

XPCOMUtils.defineLazyModuleGetter(this, "pktApi", "chrome://pocket/content/pktApi.jsm");

const STORIES_UPDATE_TIME = 30 * 60 * 1000; // 30 minutes
const SECTION_ID = "mypocket";

this.MyPocketFeed = class MyPocketFeed {

  init() {
    const initFeed = () => {
      SectionsManager.enableSection(SECTION_ID);
      try {
        const options = SectionsManager.sections.get(SECTION_ID).options;
        this.api_endpoint = this.produceFinalEndpointUrl(options);

        this.fetchStories();
      } catch (e) {
        Cu.reportError(`Problem initializing mypocket feed: ${e.message}`);
      }
    };
    SectionsManager.onceInitialized(initFeed);
  }

  uninit() {
    SectionsManager.disableSection(SECTION_ID);
  }

  async fetchStories() {
    if (!this.api_endpoint) {
      return;
    }
    try {
      const response = await fetch(this.api_endpoint);
      if (!response.ok) {
        throw new Error(`Stories endpoint returned unexpected status: ${response.status}`);
      }

      const body = await response.json();
      this.stories = this.transform(body.list);

      this.dispatchUpdateEvent(this.storiesLastUpdated, {rows: this.stories});
      this.storiesLastUpdated = Date.now();
    } catch (error) {
      Cu.reportError(`Failed to fetch content: ${error.message}`);
    }
  }

  transform(list) {
    const items = Object.keys(list).map(k => list[k]);
    if (!items) {
      return [];
    }

    return items
      .map(s => ({
        "guid": s.item_id,
        "hostname": shortURL(Object.assign({}, s, {url: s.given_url})),
        "type": "bookmarked",
        "title": s.given_title,
        "description": s.excerpt,
        "image": s.image ? s.image.src : undefined,
        "url": s.given_url
      }));
  }

  dispatchUpdateEvent(lastUpdated, data) {
    SectionsManager.updateSection(SECTION_ID, data, true);
  }

  getApiKeyFromPref(apiKeyPref) {
    if (!apiKeyPref) {
      return apiKeyPref;
    }

    return new Prefs().get(apiKeyPref) || Services.prefs.getCharPref(apiKeyPref);
  }

  produceFinalEndpointUrl(options) {
    const url = options.api_endpoint;
    if (!url) {
      return url;
    }

    const apiKey = this.getApiKeyFromPref(options.api_key_pref);
    if (url.includes("$apiKey") && !apiKey) {
      throw new Error(`An API key was specified but none configured: ${url}`);
    }
    const accessToken = pktApi.getAccessToken();
    if (url.includes("$accessToken") && !accessToken) {
      throw new Error(`An accesstoken was specified but none configured: ${url}`);
    }

    return url.replace("$apiKey", apiKey).replace("$accessToken", accessToken);
  }

  onAction(action) {
    switch (action.type) {
      case at.INIT:
        this.init();
        break;
      case at.SYSTEM_TICK:
        if (Date.now() - this.storiesLastUpdated >= STORIES_UPDATE_TIME) {
          this.fetchStories();
        }
        break;
      case at.UNINIT:
        this.uninit();
        break;
      case at.SECTION_OPTIONS_CHANGED:
        if (action.data === SECTION_ID) {
          this.uninit();
          this.init();
        }
        break;
      case at.SAVE_TO_POCKET:
        pktApi.addLink(action.data.site.url, {success: (resp, req) => this.fetchStories()});
        break;
      case at.REMOVE_FROM_POCKET:
        pktApi.deleteItem(action.data.site.guid, {success: (resp, req) => this.fetchStories()});
        break;
    }
  }
};

this.EXPORTED_SYMBOLS = ["MyPocketFeed"];

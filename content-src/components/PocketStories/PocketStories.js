const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {FormattedMessage} = require("react-intl");
const {SpotlightItem, renderPlaceholderList} = require("components/Spotlight/Spotlight");
const {actions} = require("common/action-manager");
const {pocket_read_more_endpoint} = require("../../../pocket.json");

const PocketStories = React.createClass({
  onClickFactory(index, story) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "RECOMMENDED",
        action_position: index
      };
      this.props.dispatch(actions.NotifyEvent(payload));

      this.props.dispatch(actions.NotifyImpressionStats({
        source: "pocket",
        click: 0,
        tiles: [{id: story.guid, pos: index + 1}]
      }));
    };
  },

  renderStories() {
    const stories = this.props.stories.slice(0, this.props.length);

    this.props.dispatch(actions.NotifyImpressionStats({
      source: "pocket",
      tiles: stories.map(story => ({id: story.guid}))
    }));

    return stories.map((story, i) =>
        <SpotlightItem
          index={i}
          key={story.url || i}
          page={this.props.page}
          source="RECOMMENDED"
          onClick={this.onClickFactory(i, story)}
          dispatch={this.props.dispatch}
          {...story}
          prefs={this.props.prefs} />
      );
  },

  renderReadMoreTopic(topic, url) {
    return (<li><a key={topic} className="pocket-read-more-link" href={url}>{topic}</a></li>);
  },

  renderReadMoreTopics() {
    return (
      <div className="pocket-read-more">
        <span><FormattedMessage id="pocket_read_more" /></span>
        <ul>{this.props.topics.map(t => this.renderReadMoreTopic(t.name, t.url))}</ul>
        <a className="pocket-read-even-more" href={pocket_read_more_endpoint}>
          <FormattedMessage id="pocket_read_even_more" />
          <span className="pocket-read-even-more-logo" />
        </a>
      </div>
    );
  },

  render() {
    if (this.props.stories.length < 1) {
      console.log("No Pocket stories available."); // eslint-disable-line no-console
      return null;
    }

    return (<section className="pocket-stories spotlight">
      <h3 className="section-title">
        <FormattedMessage id="header_stories" />
        <span className="section-title-logo" >
          <span className="pocket-logo-text">
              <FormattedMessage id="header_stories_by" />
          </span>
          <span className="pocket-logo">
            <span className="sr-only">Pocket</span>
          </span>
        </span>
      </h3>

      <ul className="spotlight-list">
        {this.props.placeholder ? renderPlaceholderList() : this.renderStories()}
      </ul>

      {this.renderReadMoreTopics()}
    </section>);
  }
});

PocketStories.propTypes = {
  page: React.PropTypes.string.isRequired,
  stories: React.PropTypes.array.isRequired,
  topics: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  prefs: React.PropTypes.object
};

module.exports = connect(justDispatch)(PocketStories);
module.exports.PocketStories = PocketStories;

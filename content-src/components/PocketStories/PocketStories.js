const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {FormattedMessage} = require("react-intl");
const {SpotlightItem, renderPlaceholderList} = require("components/Spotlight/Spotlight");
const {actions} = require("common/action-manager");

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
        tiles: [{id: story.guid, pos: index}]
      }));
    };
  },

  onTopicClick(index, topic, topic_url) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "RECOMMENDED",
        action_position: index,
        recommender_type: topic,
        url: topic_url
      };
      this.props.dispatch(actions.NotifyEvent(payload));
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

  render() {
    if (this.props.stories.length < 1) {
      console.log("No Pocket stories available."); // eslint-disable-line no-console
      return null;
    }

    return (<section className="pocket-stories spotlight">
      <h3 className="section-title">
        <FormattedMessage id="header_stories" />
      </h3>

      <ul className="spotlight-list">
        {this.props.placeholder ? renderPlaceholderList() : this.renderStories()}
      </ul>
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

const React = require("react");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const DEFAULT_LENGTH = 6;

const TopSites = React.createClass({
  getDefaultProps() {
    return {length: DEFAULT_LENGTH};
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);

    return (<section className="top-sites">
      <h3 className="section-title">Top Sites</h3>
      <div className="tiles-wrapper">
        {sites.map((site) => (<a key={site.url} className="tile" href={site.url}>
          <div className="tile-img-container">
            <SiteIcon site={site} width={100} height={100} />
          </div>
          <div className="tile-title">
            {site.provider_name}
          </div>
        </a>))}
      </div>
    </section>);
  }
});

TopSites.propTypes = {
  length: React.PropTypes.number,
  sites: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      images: React.PropTypes.array,
      icons: React.PropTypes.array,
      url: React.PropTypes.string.isRequired,
      type: React.PropTypes.string,
      description: React.PropTypes.string,
      provider_name: React.PropTypes.string
    })
  ).isRequired
};

module.exports = TopSites;

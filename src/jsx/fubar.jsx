var React = require("react"),
  ReactDOM = require("react-dom"),
  _ = require("underscore");

import { DatamonkeyTable } from "./components/tables.jsx";
import { DatamonkeyLine } from "./components/graphs.jsx";
import { NavBar } from "./components/navbar.jsx";
import { ScrollSpy } from "./components/scrollspy.jsx";
import { DatamonkeySurfacePlot } from "./components/surfaceplot.jsx";

class FUBAR extends React.Component {
  constructor(props) {
    super(props);

    var mcmc = _.map(this.props.mcmc["mcmc"], Math.abs);

    var x = _.map(this.props.fubar_results, d => {
      return parseFloat(d.alpha);
    });

    var z = _.map(this.props.fubar_results, d => {
      return parseFloat(d.beta);
    });

    var y = _.map(this.props.fubar_results, d => {
      return parseFloat(d.post_pos_sel);
    });

		var coords = _.zip(x, y, z);

    // Get plot width according to bootstrap conventions
    var plot_width = 960;

    switch (true) {
      case window.innerWidth >= 992:
        plot_width = 960;
        break;
      case window.innerWidth >= 768:
        plot_width = 460;
        break;
      case window.innerWidth <= 576:
        plot_width = 460;
        break;
      default:
        plot_width = 0;
    }

    this.state = {
      mcmc: mcmc,
      plot_width: plot_width,
      coords : coords
    };
  }

  updatePvalThreshold(e) {
    var pvalue_threshold = parseFloat(e.target.value);

    this.setState({
      pvalue_threshold: pvalue_threshold
    });
  }

  getSummary() {
    var self = this;

    return (
      <div>
        <div className="main-result">
          <p>
            <p>
              FUBAR {" "}
              <strong className="hyphy-highlight"> found evidence </strong> of{" "}
            </p>
            <div
              className="row"
              style={{
                marginTop: "20px"
              }}
            >
              <div className="col-md-3">With p-value threshold of</div>
              <div
                className="col-md-2"
                style={{
                  top: "-5px"
                }}
              >
                <input
                  className="form-control"
                  type="number"
                  defaultValue="0.1"
                  step="0.01"
                  min="0"
                  max="1"
                  onChange={self.updatePvalThreshold.bind(this)}
                />
              </div>
            </div>
          </p>
          <hr />
          <p>
            <small>
              See {" "}
              <a href="//hyphy.org/methods/selection-methods/#fubar">
                here{" "}
              </a>{" "}
              for more information about the FUBAR method <br />
              Please cite PMID{" "}
              <a href="//www.ncbi.nlm.nih.gov/pubmed/23420840">23420840</a> if
              you use this result in a publication, presentation, or other
              scientific work
            </small>
          </p>
        </div>
      </div>
    );
  }

  componentWillMount() {}

  componentDidMount() {}

  componentDidUpdate(prevProps) {
    $("body").scrollspy({
      target: ".bs-docs-sidebar",
      offset: 50
    });
  }

  render() {
    var scrollspy_info = [
      {
        label: "summary",
        href: "summary-tab"
      },
      {
        label: "plots",
        href: "plot-tab"
      },
      {
        label: "table",
        href: "table-tab"
      }
    ];

    return (
      <div>
        <NavBar />

        <div className="container">
          <div className="row">
            <ScrollSpy info={scrollspy_info} />

            <div className="col-sm-10">
              <div id="results">
                <h3 className="list-group-item-heading">
                  <span id="summary-method-name">
                    FUBAR - A Fast, Unconstrained Bayesian AppRoximation for
                    Inferring Selection{" "}
                  </span>
                  <br />
                  <span className="results-summary"> results summary </span>
                </h3>
                {this.getSummary()}
              </div>

              <div id="fubar-rate-class-plot" className="row hyphy-row">
                <h3 className="dm-table-header">Rate class weight</h3>
								<div id="surface-plot" style={{minHeight:"500px", maxHeight:"750px", height: "700px", overflow:"hidden"}}>
									<DatamonkeySurfacePlot
										coords={this.state.coords}
										title={"hi"}
									/>
								</div>
              </div>

              <div id="fubar-mcmc-trace-tab" className="row hyphy-row">
                <h3 className="dm-table-header">MCMC Trace</h3>
                <DatamonkeyLine
                  x={_.range(this.state.mcmc.length)}
                  y={[this.state.mcmc]}
                  x_label={"Sample"}
                  y_label={"LogL"}
                  marginLeft={50}
                  width={this.state.plot_width}
                  transitions={true}
                  doDots={true}
                />
              </div>

              <div id="table-tab" className="row hyphy-row">
                <h3 className="dm-table-header">Table Summary</h3>

                <div className="col-md-6 alert alert-danger" role="alert">
                  Conserved properties with evidence are highlighted in red.
                </div>

                <div className="col-md-6 alert alert-success" role="alert">
                  Changing properties with evidence are highlighted in green.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Will need to make a call to this
// omega distributions
function fubar(fubar_results, mcmc, element) {
  ReactDOM.render(
    <FUBAR fubar_results={fubar_results} mcmc={mcmc} />,
    document.getElementById(element)
  );
}

module.exports = fubar;

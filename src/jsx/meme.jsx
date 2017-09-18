var React = require("react"),
  ReactDOM = require("react-dom"),
  d3 = require("d3"),
  _ = require("underscore");

import { InputInfo } from "./components/input_info.jsx";
import { DatamonkeyTable, DatamonkeyModelTable } from "./components/tables.jsx";
import { DatamonkeySiteGraph } from "./components/graphs.jsx";
import { NavBar } from "./components/navbar.jsx";
import { ScrollSpy } from "./components/scrollspy.jsx";


function MEMESummary(props) {
  var number_of_sites = 0;
  if (props.json) {
    number_of_sites = _.flatten(_.values(props.json.MLE.content), true)
      .filter(row=>row[3]/(row[0] || 1e-10) > 1 && row[6] < props.pValue).length;
  }

  return (
    <div className="row" id="summary-tab">
      <div className="clearance" id="summary-div"></div>
      <div className="col-md-12">
        <h3 className="list-group-item-heading">
          <span id="summary-method-name">
            Mixed Effects Model of Evolution
          </span>
          <br />
          <span className="results-summary">results summary</span>
        </h3>
      </div>
      <div className="col-md-12">
        <InputInfo input_data={props.json ? props.json.input : null} />
      </div>
      <div className="col-md-12">
        <div className="main-result">
          <p>MEME found evidence of</p>
          <p>
            <i className="fa fa-plus-circle" aria-hidden="true">
              {" "}
            </i>{" "}
            episodic positive/diversifying selection at
            <span className="hyphy-highlight">
              {" "}{number_of_sites}{" "}
            </span>
            sites
          </p>
          <p>
            with p-value threshold of
            <input
              style={{display: "inline-block", marginLeft: "5px", width: "100px"}}
              className="form-control"
              type="number"
              defaultValue="0.1"
              step="0.01"
              min="0"
              max="1"
              onChange={props.updatePValue}
            />.
          </p>
          <hr />
          <p>
            <small>
              See{" "}
              <a href="http://www.hyphy.org/methods/selection-methods/#meme">
                here
              </a>{" "}
              for more information about the MEME method.
              <br />Please cite{" "}
              <a
                href="http://www.ncbi.nlm.nih.gov/pubmed/22807683"
                id="summary-pmid"
                target="_blank"
              >
                PMID 22807683
              </a>{" "}
              if you use this result in a publication, presentation, or other
              scientific work.
            </small>
          </p>
        </div>
      </div>
    </div>
  );
}

function MEMETable(props) {
  var flattened = _.flatten(_.values(props.body_data), true),
    partition_column = d3.range(flattened.length).map(d=>0);
  _.each(props.partitions, (val, key)=>{
    val.coverage[0].forEach(d=>{
      partition_column[d] = key;
    });
  });
  var formatter = d3.format(".2f"),
    new_rows = flattened.map((row, index) => {
      var alpha = row[0] ? row[0] : 1e-10,
        beta_minus = row[1],
        beta_plus = row[3];
      var selection = beta_plus/alpha > 1 && row[6] < props.pValue ? "positive-selection-row" : '';
      var site = {value: index+1, classes: selection},
        partition = {value: +partition_column[index]+1, classes:selection};
      return [site, partition].concat(
        row.map(entry => {
          return {value: formatter(entry), classes: selection};
        })
      )
    });
  if (props.header) {
    var headerData = [{value:'Site', sortable:true}, {value:'Partition', sortable:true}].concat(
      props.header.map(pair => {
        return {
          value: pair[0] == 'alpha;' ? '&alpha; ' : pair[0],
          abbr: pair[1],
          sortable: true
        };
      })
    );
  }
  
  return (<div className="row">
    <div className="col-md-12" id="table-tab">
      <h4 className="dm-table-header">
        MEME Parameter Table 
        <span
          className="glyphicon glyphicon-info-sign"
          style={{ verticalAlign: "middle", float: "right" }}
          aria-hidden="true"
          data-toggle="popover"
          data-trigger="hover"
          title="Actions"
          data-html="true"
          data-content="<ul><li>Hover over a column header for a description of its content.</li></ul>"
          data-placement="bottom"
        />
      </h4>
      <div className="col-md-12" role="alert">
        <p className="description">Sites that yielded a statistically significant result are highlighted in green.</p>
      </div>
      <DatamonkeyTable
        headerData={headerData}
        bodyData={new_rows}
        paginate={20}
        classes={"table table-condensed table-striped"}
        export_csv
      />
    </div>
  </div>);
}

class MEME extends React.Component {
  constructor(props) {
    super(props);
    this.updatePValue = this.updatePValue.bind(this); 
    this.onFileChange = this.onFileChange.bind(this); 
    this.state = {
      input_data: null,
      data: null,
      fits: null,
      header: null,
      bodyData: null,
      partitions: null,
      pValue: .1
    };
  }

  processData(data){
    data['trees'] = _.map(data['input']['trees'], (val, key) => {
      var branchLengths = {
        'Global MG94xREV': _.mapObject(data['branch attributes'][key], val1 => val1['Global MG94xREV'])
      };
      return {newickString: val, branchLengths: branchLengths};
    });

    this.setState({
      input_data: data["input_data"],
      data: data,
      fits: data["fits"],
      header: data["MLE"]["headers"],
      bodyData: data["MLE"]["content"],
      partitions: data["data partitions"]
    });
  }

  loadFromServer() {
    var self = this;
    d3.json(this.props.url, function(data) {
      self.processData(data);
    });
  }

  onFileChange(e) {
    var self = this;
    var files = e.target.files; // FileList object

    if (files.length == 1) {
      var f = files[0];
      var reader = new FileReader();

      reader.onload = (function(theFile) {
        return function(e) {
          var data = JSON.parse(this.result);
          self.processData(data);
        };
      })(f);
      reader.readAsText(f);
    }
    e.preventDefault();
  }

  componentWillMount() {
    this.loadFromServer();
  }

  componentDidUpdate(prevProps, prevState) {
    $("body").scrollspy({
      target: ".bs-docs-sidebar",
      offset: 50
    });
  }

  updatePValue(e) {
    this.setState({pValue: e.target.value});
  }

  render() {
    var self = this,
      site_graph,
      scrollspy_info = [
        { label: "summary", href: "summary-tab" },
        { label: "table", href: "table-tab" },
        { label: "fits", href: "fit-tab" },
        { label: "plot", href: "plot-tab" }
      ];
    
    if(this.state.data){
      var columns = _.pluck(self.state.header, 0);
      columns[0] = '&alpha;';
      site_graph = <DatamonkeySiteGraph 
        columns={columns}
        rows={_.flatten(_.values(self.state.bodyData), true)}
      />;
    }

    var models = {};
    if (!_.isNull(self.state.data)) {
      models = self.state.data.fits;
    }

    return (
      <div>
        {this.props.hyphy_vision ? <NavBar onFileChange={this.onFileChange} /> : ''}
        <div className="container">
          <div className="row">
            <ScrollSpy info={scrollspy_info} />
            <div className="col-sm-10" id="results">
              <MEMESummary json={self.state.data} updatePValue={self.updatePValue} pValue={self.state.pValue}/>
              <MEMETable
                header={self.state.header}
                body_data={self.state.bodyData}
                partitions={self.state.partitions}
                pValue={self.state.pValue}
              />
              <div className="row">
                <div className="col-md-12" id="fit-tab">
                  <DatamonkeyModelTable fits={self.state.fits} />
                  <p className="description">
                    This table reports a statistical summary of the models fit
                    to the data. Here, <strong>MG94</strong> refers to the
                    MG94xREV baseline model that infers a single &omega; rate
                    category per branch.
                  </p>
                </div>
              </div>

              <div id="plot-tab" className="row hyphy-row">
                <div className="col-md-12">
                  <h4 className="dm-table-header">Plot Summary</h4>
                  {site_graph}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

function render_meme(url, element) {
  ReactDOM.render(<MEME url={url} />, document.getElementById(element));
}

function render_hv_meme(url, element) {
  ReactDOM.render(<MEME url={url} hyphy_vision />, document.getElementById(element));
}

module.exports = render_meme;
module.exports.hv = render_hv_meme;


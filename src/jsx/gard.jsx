var React = require('react'),
  ReactDOM = require("react-dom"),
  d3 = require("d3"),
  _ = require("underscore");

import { Tree } from "./components/tree.jsx";
import { ScrollSpy } from "./components/scrollspy.jsx";
import { InputInfo } from "./components/input_info.jsx";
import { ErrorMessage } from "./components/error_message.jsx";
import { Header } from "./components/header.jsx";
import { RateMatrix } from "./components/rate_matrix.jsx";
import { DatamonkeySiteGraph } from "./components/graphs.jsx";


function binomial(n, k) {
     if ((typeof n !== 'number') || (typeof k !== 'number'))
  return false;
    var coeff = 1;
    for (var x = n-k+1; x <= n; x++) coeff *= x;
    for (x = 1; x <= k; x++) coeff /= x;
    return coeff;
}

function GARDResults(props){
  if(!props.data) return <div></div>;

  var days = Math.floor(props.data.timeElapsed/(24*60*60));
  var delta = props.data.timeElapsed-days*24*60*60;
  var hours = Math.floor(delta/(60*60));
  delta -= 60*60*hours;
  var minutes = Math.floor(delta/60),
      seconds = delta-60*minutes,
      timeString = '';
  timeString += days > 0 ? days + ':' : '';
  timeString += hours > 0 ? hours + ':' : '';
  timeString += minutes + ':' + String(seconds).padStart(2, '0');

  var totalPossibleModels = _.range(props.data.numberOfFrags)
    .map(k=>binomial(props.data.totalBP, k+1))
    .reduce((a,b)=>a+b,0);

  var percentageExplored = (100*props.data.totalModelCount/totalPossibleModels).toFixed(2);
  var evidence_statement = props.data.lastImprovedBPC ?
    <span><strong className="hyphy-highlight">found evidence</strong> of {props.data.lastImprovedBPC} recombination breakpoint{props.data.lastImprovedBPC == 1 ? '' : 's'}</span> :
    <span><strong>found no evidence</strong> of recombination</span>;
  return (<div className="row" id="summary-tab">
    <div className="clearance" id="summary-div"></div>
    <div className="col-md-12">
      <h3 className="list-group-item-heading">
        <span className="summary-method-name">
          Genetic Algorithm Recombination Detection
        </span>
        <br />
        <span className="results-summary">results summary</span>
      </h3>
    </div>
    <div className="col-md-12">
      <InputInfo input_data={props.data.input_data} />
    </div>
    <div className="col-md-12">
      <div className="main-result">
        <p>
          GARD {evidence_statement}.
          GARD examined {props.data.totalModelCount} models in {timeString} wallclock time, at a rate of {(props.data.totalModelCount/props.data.timeElapsed).toFixed(2)} models
          per second. The alignment contained {props.data.totalBP} potential breakpoints, translating into a search space of {totalPossibleModels} models
          with up to {props.data.numberOfFrags} breakpoints, of which {percentageExplored}% was explored by the genetic algorithm.
        </p>
        <hr />
        <p>
          <small>
            See{" "}
            <a href="http://hyphy.org/methods/selection-methods/#gard">
              here
            </a>{" "}
            for more information about this method.
            <br />Please cite{" "}
            <a
              href="http://www.ncbi.nlm.nih.gov/pubmed/16818476"
              id="summary-pmid"
              target="_blank"
            >
              PMID 16818476
            </a>{" "}
            if you use this result in a publication, presentation, or other
            scientific work.
          </small>
        </p>
      </div>
    </div>

  </div>);
}

function GARDRecombinationReport(props){
  if(!props.data) return <div></div>;
  if(!props.data.improvements) {
    return (<div className="row" id="report-tab">
      <div className="col-md-12">
        <Header title="Recombination report" />
        <p className="description">GARD found no evidence of recombination.</p>
      </div>
    </div>);
  }
    
  var colors = ["black", "#00a99d"],
    width = 700,
    height = 20,
    scale = d3.scale.linear()
      .domain([1, props.data.input_data.sites])
      .range([0, width]);
  var segments = [{breakpoints: []}].concat(props.data.improvements).map(function(d){
    var bp = [0].concat(d.breakpoints).concat([props.data.input_data.sites]),
      individual_segments = [];
    for(var i=0; i<bp.length-1; i++){
      var bp_delta = bp[i+1]-bp[i];
      individual_segments.push(<g transform={"translate(" + scale(bp[i])  + ",0)"}>
        <rect x={0} y={0} width={scale(bp_delta)} height={height} style={{fill: colors[i % colors.length]}} />
        <text x={scale(bp_delta/2)} y={2*height/3} fill={"white"} textAnchor={'middle'}>
          {bp[i]+1} - {bp[i+1]}
        </text>
      </g>);
    }
    return (<svg width={width} height={height}>
      {individual_segments}
    </svg>);
  });
  var rows = [{breakpoints: []}].concat(props.data.improvements).map((row, index) => <tr>
    <td>{row.breakpoints.length}</td>
    <td>{(props.data.baselineScore-_.first(_.pluck(props.data.improvements, "deltaAICc"), index).reduce((t,n)=>t+n,0)).toFixed(2)}</td>
    <td>{row.deltaAICc ? row.deltaAICc.toFixed(2) : ''}</td>
    <td>{segments[index]}</td>
  </tr>);
  return (<div className="row" id="report-tab">
    <div className="col-md-12">
      <Header title="Recombination report" />
      <table className="table table-condensed tabled-striped">
        <thead>
          <tr>
            <th>BPs</th>
            <th>AIC<sub>c</sub></th>
            <th>&Delta; AIC<sub>c</sub></th>
            <th>Segments</th>
          </tr>
        </thead>
        <tbody>
          {rows} 
        </tbody>
      </table>
    </div>
  </div>);
}

function GARDSiteGraph(props){
  if(!props.data) return <div></div>;
  var bestScore = props.data.baselineScore,
    number_of_sites = props.data.input_data.sites,
    bp_support = d3.range(number_of_sites).map(d=>0*d),
    tree_length = d3.range(number_of_sites).map(d=>0*d),
    normalizer = 0,
    model,
    modelScore,
    fromSite,
    toSite;
  for(var i=0; i<props.data.models.length; i++){
    model = props.data.models[i];
    modelScore = Math.exp(.5*(props.data.baselineScore-model.aicc));
    if (modelScore > .00001){
      for(var j=0; j<model.breakpoints.length; j++){
        fromSite = model.breakpoints[j][0];
        toSite = model.breakpoints[j][1];
        if(j>0) bp_support[fromSite] += modelScore;
        for(var k=fromSite; k<toSite; k++){
          tree_length[k] += model.tree_lengths[j]*modelScore;
        }
      }
      normalizer += modelScore;
    }
  }
  bp_support = bp_support.map(d=>d/normalizer);
  tree_length = tree_length.map(d=>d/normalizer);
  return(<div className="row" id="graph-tab">
    <div className="col-md-12">
      <Header title="GARD Site Graph" />
      <DatamonkeySiteGraph 
        columns={["Breakpoint support", "Tree length"]}
        rows={_.zip(bp_support, tree_length)}
      />
    </div>
  </div>);
}

function GARDTopologyReport(props){
  if(!props.data) return <div></div>;
  if(!props.data.lastImprovedBPC) return <div></div>;
  var readPCount = props.data.pairwisePValues.length,
    totalComparisons = (readPCount-1)*2,
    threshP = 0.01/totalComparisons,
    bypvalue = [[.01, 0], [.05, 0], [0.1, 0]].map(row=>row.map(entry=>entry/totalComparisons)),
    rows = [];
  for (var pcounter = 1; pcounter < readPCount; pcounter++){
    var lhs = props.data.pairwisePValues[pcounter][pcounter-1],
      rhs = props.data.pairwisePValues[pcounter-1][pcounter],
      sig = 0;
    for(var k=0; k<bypvalue.length; k++){
      threshP = bypvalue[k][0];
      if(lhs <= threshP && rhs <= threshP){
        if(sig == 0){
          sig = readPCount - k;
        }
        bypvalue[k][1] += 1;
      }
    }
    var sigCell = d3.range(sig).map(d=><i className="fa fa-circle"></i>);
    rows.push((<tr>
      <td>{_.last(props.data.improvements).breakpoints[pcounter-1]+1}</td>
      <td>{Math.min(1, lhs*totalComparisons)}</td>
      <td>{Math.min(1, rhs*totalComparisons)}</td>
      <td>{sigCell}</td>
    </tr>));
  }
  var statements = _.range(3).map(k=><p className="description">At p = {bypvalue[k][0]*totalComparisons}, there are {bypvalue[k][1]} breakpoints with significant topological incongruence.</p>),
    currentAIC = props.data.baselineScore-_.pluck(props.data.improvements, "deltaAICc").reduce((t,n)=>t+n),
    w = Math.exp(0.5*(currentAIC-props.data.singleTreeAICc)),
    conclusion = w > 0.01 ?
      <i>some or all of the breakpoints may reflect rate variation instead of topological incongruence</i> :
      <i>at least of one of the breakpoints reflects a true topological incongruence</i>
  return (<div className="row">
    <div className="col-md-12">
      <Header title="Topological incongruence report" />
      <table className="table table-condensed tabled-striped">
        <thead>
          <tr>
            <th>Breakpoints</th>
            <th>LHS p-value</th>
            <th>RHS p-value</th>
            <th>Significance</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
      <p className="description">Comparing the AIC<sub>c</sub> score of the best fitting GARD model, that allows for different topologies between segments ({currentAIC.toFixed(1)}), and that of the model that
      assumes the same tree for all the partitions inferred by GARD the same tree, but allows different branch lengths between partitions ({props.data.singleTreeAICc.toFixed(1)}) suggests that because
      the multiple tree model { w > 0.01 ? 'cannot' : 'can' } be preferred over the single tree model by an evidence ratio of 100 or greater, {conclusion}.</p>
      <p className="description">Please consult the above Kishino Hasegawa topological incongruence table for more details.</p>
      {statements}
    </div>
  </div>);
}

class GARD extends React.Component {
  constructor(props){
    super(props);
    this.state = {data: null};
    this.onFileChange = this.onFileChange.bind(this);
  }
  componentDidMount(){
    var self = this;
    d3.json(this.props.url, function(data){
      data.trees = data.breakpointData.map(row => {
        return {newickString: row.tree};
      }); 
      self.setState({
        data: data
      });
    });
  }
  componentDidUpdate(prevProps, prevState) {
    $("body").scrollspy({
      target: ".bs-docs-sidebar",
      offset: 50
    });
    $('[data-toggle="popover"]').popover();
  }
  onFileChange(e){
    var self = this,
      files = e.target.files; // FileList object

    if (files.length == 1) {
      var f = files[0],
        reader = new FileReader();

      reader.onload = (function(theFile) {
        return function(e) {
          var data = JSON.parse(this.result);
          data.trees = data.breakpointData.map(row => {
            return {newickString: row.tree};
          }); 
          self.setState({data: data});
        };
      })(f);
      reader.readAsText(f);
    }
    e.preventDefault();

  }
  render(){
    var self = this,
      scrollspy_info = [
        { label: "summary", href: "summary-tab" },
        { label: "report", href: "report-tab" },
        { label: "graph", href: "graph-tab" },
        { label: "matrix", href: "matrix-tab" },
        { label: "tree", href: "tree-tab" },
      ];
    var tree_settings = {
      omegaPlot: {},
      "tree-options": {
        /* value arrays have the following meaning
                [0] - the value of the attribute
                [1] - does the change in attribute value trigger tree re-layout?
            */
        "hyphy-tree-model": ["Unconstrained model", true],
        "hyphy-tree-highlight": ["RELAX.test", false],
        "hyphy-tree-branch-lengths": [false, true],
        "hyphy-tree-hide-legend": [true, false],
        "hyphy-tree-fill-color": [true, false]
      },
      "hyphy-tree-legend-type": "discrete",
      "suppress-tree-render": false,
      "chart-append-html": true,
      edgeColorizer: function(e,d){return 0} 
    };

    return (<div>
      <div className="container">
        <div className="row">
          <ScrollSpy info={scrollspy_info} />
          <div className="col-sm-10" id="results">
            <ErrorMessage />
            <GARDResults data={this.state.data} />
            <GARDRecombinationReport data={this.state.data} />
            <GARDTopologyReport data={this.state.data} />
            <GARDSiteGraph data={this.state.data} />
            <RateMatrix rate_matrix={this.state.data ? this.state.data.rateMatrix : undefined} />

            <div className="row">
              <div id="tree-tab" className="col-md-12">
                <Tree
                  models={{}}
                  json={this.state.data}
                  settings={tree_settings}
                  multitree
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>);
  }
}

function render_gard(url, element) {
  ReactDOM.render(<GARD url={url} />, document.getElementById(element));
}

module.exports = render_gard


var React = require("react"),
  _ = require("underscore");

var createScene       = require('gl-plot3d');
var createSurfacePlot = require('gl-surface3d');
var ndarray           = require('ndarray');
var fill              = require('ndarray-fill');
var diric             = require('dirichlet');

class SurfacePlot extends React.Component {

  constructor(props) {
    super(props);

		var z1 = [
    [8.83,8.89,8.81,8.87,8.9,8.87],
    [8.89,8.94,8.85,8.94,8.96,8.92],
    [8.84,8.9,8.82,8.92,8.93,8.91],
    [8.79,8.85,8.79,8.9,8.94,8.92],
    [8.79,8.88,8.81,8.9,8.95,8.92],
    [8.8,8.82,8.78,8.91,8.94,8.92],
    [8.75,8.78,8.77,8.91,8.95,8.92],
    [8.8,8.8,8.77,8.91,8.95,8.94],
    [8.74,8.81,8.76,8.93,8.98,8.99],
    [8.89,8.99,8.92,9.1,9.13,9.11],
    [8.97,8.97,8.91,9.09,9.11,9.11],
    [9.04,9.08,9.05,9.25,9.28,9.27],
    [9,9.01,9,9.2,9.23,9.2],
    [8.99,8.99,8.98,9.18,9.2,9.19],
    [8.93,8.97,8.97,9.18,9.2,9.18]
		];

    var data = [
      {
        z: z1,
        type: "surface"
      }
    ];

    var layout = {
      title: this.props.title,
      autosize: false,
      width: this.props.width,
      height: this.props.height,
      margin: {
        l: this.props.marginLeft,
        r: this.props.marginRight,
        b: this.props.marginBottom,
        t: this.props.marginTop
      }
    };

    this.state = { data: data, layout: layout };

  }

  renderPlot(canvas) {

		var scene = createScene({canvas: canvas});

		var field = ndarray(new Float32Array(512*512), [512,512]);
		fill(field, function(x,y) {
			return 128 * diric(10, 10.0*(x-256)/512) * diric(10, 10.0*(y-256)/512);
		});
		
		var surface = createSurfacePlot({
					gl: scene.gl,
					field: field,
					contourProject: true
				});

		scene.add(surface);

  }

	componentDidMount() {
		d3.selectAll('canvas').style({position:'relative'});
	}

  render() {
    return (<canvas id="surface" style={{width:this.props.width, height:this.props.height}} ref={this.renderPlot.bind(this)}></canvas>);
  }

}

SurfacePlot.defaultProps = {
  width: 500,
  height: 500,
  marginLeft: 65,
  marginRight: 50,
  marginTop: 90,
  marginBottom: 65
};

module.exports.DatamonkeySurfacePlot = SurfacePlot;

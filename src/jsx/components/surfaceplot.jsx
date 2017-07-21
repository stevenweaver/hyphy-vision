var React = require("react"),
  _ = require("underscore"),
  THREE = require("three");

class SurfacePlot extends React.Component {
  constructor(props) {
    super(props);
    this.animate = this.animate.bind(this);
    this.props.renderer.setSize(960, 840);
    this.props.renderer.setClearColor("white", 1);

    this.state = {};
  }

  animate() {
    requestAnimationFrame(this.animate);
		this.mesh.rotation.y += 0.01;
		this.mesh.rotation.x += 0.01;
    this.props.renderer.render(this.props.scene, this.props.camera);
  }

  renderPlot(canvas) {

		var getColor = function(max,min,val){
				var MIN_L=40,MAX_L=100;
				var color = new THREE.Color();
				var h = 0/240;
				var s = 80/240;
				var l = (((MAX_L-MIN_L)/(max-min))*5)/240;
				color.setHSL(h,s,l);
				return color;
		};

    canvas.appendChild(this.props.renderer.domElement);

    var begin = 0;
    var end = 20;
    var width = end - begin;
		var height = width;

    var plane_geometry = new THREE.PlaneGeometry(20, 20);
    var plane_material = new THREE.MeshLambertMaterial({
      color: 0xf0f0f0,
      shading: THREE.FlatShading,
      overdraw: 0.5,
      side: THREE.DoubleSide
    });

    this.plane = new THREE.Mesh(plane_geometry, plane_material);
    //this.props.scene.add(this.plane);

    var geometry = new THREE.Geometry();
    var colors = [];

    _.each(this.props.coords, (d, i) => {
      var vector = new THREE.Vector3(d[0], d[1], d[2]);
      geometry.vertices.push(vector);
			colors.push(getColor(2.5,0,d[2]));
    });

    var offset = function(x, y) {
      return x * width + y;
    };

    for (var x = 0; x < width - 1; x++) {
      for (var y = 0; y < height - 1; y++) {
        var vec0 = new THREE.Vector3(),
          vec1 = new THREE.Vector3(),
          n_vec = new THREE.Vector3();
        // one of two triangle polygons in one rectangle
        vec0.subVectors(
          geometry.vertices[offset(x, y)],
          geometry.vertices[offset(x + 1, y)]
        );
        vec1.subVectors(
          geometry.vertices[offset(x, y)],
          geometry.vertices[offset(x, y + 1)]
        );
        n_vec.crossVectors(vec0, vec1).normalize();
        geometry.faces.push(
          new THREE.Face3(
            offset(x, y),
            offset(x + 1, y),
            offset(x, y + 1),
            n_vec,
            [
              colors[offset(x, y)],
              colors[offset(x + 1, y)],
              colors[offset(x, y + 1)]
            ]
          )
        );
        geometry.faces.push(
          new THREE.Face3(
            offset(x, y),
            offset(x, y + 1),
            offset(x + 1, y),
            n_vec.negate(),
            [
              colors[offset(x, y)],
              colors[offset(x, y + 1)],
              colors[offset(x + 1, y)]
            ]
          )
        );
        // the other one
        vec0.subVectors(
          geometry.vertices[offset(x + 1, y)],
          geometry.vertices[offset(x + 1, y + 1)]
        );
        vec1.subVectors(
          geometry.vertices[offset(x, y + 1)],
          geometry.vertices[offset(x + 1, y + 1)]
        );
        n_vec.crossVectors(vec0, vec1).normalize();
        geometry.faces.push(
          new THREE.Face3(
            offset(x + 1, y),
            offset(x + 1, y + 1),
            offset(x, y + 1),
            n_vec,
            [
              colors[offset(x + 1, y)],
              colors[offset(x + 1, y + 1)],
              colors[offset(x, y + 1)]
            ]
          )
        );
        geometry.faces.push(
          new THREE.Face3(
            offset(x + 1, y),
            offset(x, y + 1),
            offset(x + 1, y + 1),
            n_vec.negate(),
            [
              colors[offset(x + 1, y)],
              colors[offset(x, y + 1)],
              colors[offset(x + 1, y + 1)]
            ]
          )
        );
      }
    }

 		var material = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors});
		this.mesh = new THREE.Mesh(geometry, material);
		this.props.scene.add(this.mesh);

    this.props.camera.position.z = 35;
    this.animate();
  }

  render() {
    return <div ref={this.renderPlot.bind(this)} />;
  }
}

SurfacePlot.defaultProps = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(75, 960 / 840, 0.1, 1000),
  renderer: new THREE.WebGLRenderer()
};

module.exports.DatamonkeySurfacePlot = SurfacePlot;

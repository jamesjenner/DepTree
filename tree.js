var nodes = null;
var edges = null;
var network = null;

var exportArea;
var importButton;
var exportButton;
var container;


function draw() {
  nodes = [
    {
      id: 1,
      label: "Alpha",
      shapeProperties: { borderDashes: false },
      icon: { code: "\uf160"},
      color: {
        border: "#6E8097",
      },
      font: { color: "#6E8097"},
    },
    {
      id: 2,
      label: "Bravo",
      icon: { code: "\uf164"},
    },
    {
      id: 3,
      label: "Charli",
      shapeProperties: { borderDashes: false },
    },
    {
      id: 4,
      label: "Fred",
    },
  ];

  edges = [
    { from: 1, to: 2, arrows: { to: { enabled: false } } },
    { from: 1, to: 3, arrows: { to: { enabled: false } } },
    { from: 3, to: 4, arrows: { to: { enabled: false } } },
  ];

  // create a network
  var container = document.getElementById("mynetwork");
  var data = {
    nodes: nodes,
    edges: edges,
  };
  var options = { 
    manipulation: { 
      // enabled: true }, 
      addNode: function (data, callback) {
        // filling in the popup DOM elements
        document.getElementById("node-operation").innerHTML = "Add Node";
        editNode(data, clearNodePopUp, callback);
      },
      editNode: function (data, callback) {
        // filling in the popup DOM elements
        document.getElementById("node-operation").innerHTML = "Edit Node";
        editNode(data, cancelNodeEdit, callback);
      }
    },
    layout: {
      hierarchical: {
        sortMethod: "directed",
        shakeTowards: "roots",
      }
    },
    nodes: {
      borderWidth: 2,
      font: { size: 22, color: "#EB8243", background: "#15181C" },
      size: 30,
      shape: "dot",
      shapeProperties: { borderDashes: [5, 5] },
      chosen: { label: false, node: changeChosenNodeBorderColor },
      color: {
        background: "#15181C",
        border: "#EB8243",
        highlight: {
          background: "#5c5c5c",
          border: "red"
        }
      },
      icon: { code: "\uf0c2", color: '#ffffffdf' },
    },
    edges: {
      smooth: false,
      arrows: { to: false, from: false },
      width: 2,
      chosen: false,
    },   
    physics: false, // barnesHut: { gravitationalConstant: -4000 } 
    interaction: {
      hover: true,
    }
    
  };
  network = new vis.Network(container, data, options);
}

window.addEventListener("load", () => {
  container = document.getElementById("mynetwork");
  exportArea = document.getElementById("input_output");
  importButton = document.getElementById("import_button");
  exportButton = document.getElementById("export_button");

  draw();
});

var changeChosenNodeBorderColor = function (values, id, selected, hovering) {
  values.borderColor = "#5599ff";
  // values.icon.color = "#ff0000";
};

function editNode(data, cancelAction, callback) {
  document.getElementById("node-label").value = data.label;
  document.getElementById("node-saveButton").onclick = saveNodeData.bind(
    this,
    data,
    callback
  );
  document.getElementById("node-cancelButton").onclick = cancelAction.bind(
    this,
    callback
  );
  document.getElementById("node-popUp").style.display = "block";
}

// Callback passed as parameter is ignored
function clearNodePopUp() {
  document.getElementById("node-saveButton").onclick = null;
  document.getElementById("node-cancelButton").onclick = null;
  document.getElementById("node-popUp").style.display = "none";
}

function cancelNodeEdit(callback) {
  clearNodePopUp();
  callback(null);
}

function saveNodeData(data, callback) {
  data.label = document.getElementById("node-label").value;
  clearNodePopUp();
  callback(data);
}

function exportNetwork() {
  clearOutputArea();

  var nodes = objectToArray(network.getPositions());

  nodes.forEach(addConnections);

  // pretty print node data
  var exportValue = JSON.stringify(nodes, undefined, 2);

  exportArea.value = exportValue;

  resizeExportArea();
}

function destroyNetwork() {
  network.destroy();
}

function addConnections(elem, index) {
  // need to replace this with a tree of the network, then get child direct children of the element
  elem.connections = network.getConnectedNodes(index);
}

function resizeExportArea() {
  exportArea.style.height = 1 + exportArea.scrollHeight + "px";
}

function clearOutputArea() {
  exportArea.value = "";
}

function objectToArray(obj) {
  console.log(JSON.stringify(obj));
  return Object.keys(obj).map(function (key) {
    obj[key].id = key;
    return obj[key];
  });
}

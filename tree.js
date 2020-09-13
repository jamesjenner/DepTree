
var changeChosenNodeBorderColor = function (values, id, selected, hovering) {
  values.borderColor = "#5599ff";
  // values.icon.color = "#ff0000";
};

const nodeStates = {
  WIP: 'Wip',
  DONE: 'Done',
  PLANNED: 'Planned'
}

const nodes = [
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
    state: nodeStates.WIP,
  },
];

const edges = [
  { from: 1, to: 2, arrows: { to: { enabled: false } } },
  { from: 1, to: 3, arrows: { to: { enabled: false } } },
  { from: 3, to: 4, arrows: { to: { enabled: false } } },
];

const extended = [
  {
    id: 1,
    state: nodeStates.PLANNED,
  },
  {
    id: 2,
    state: nodeStates.WIP,
  },
  {
    id: 3,
    state: nodeStates.DONE,
  },
  {
    id: 4,
    state: nodeStates.WIP,
  },
]

const data = {
  nodes: new vis.DataSet(nodes),
  edges: new vis.DataSet(edges),
}

const options =  { 
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

var network = null;

var exportArea;
var importButton;
var exportButton;
var container;

function draw() {
  // get network container
  var container = document.getElementById("mynetwork");
  
  // create a network
  network = new vis.Network(container, data, options);
}

window.addEventListener("load", () => {
  container = document.getElementById("mynetwork");
  exportArea = document.getElementById("input_output");
  importButton = document.getElementById("import_button");
  exportButton = document.getElementById("export_button");

  draw();
});

/*
 * editNode(data, cancelAction, callback) - setup form when edit requested
 *
 *   data - the data for the node to be edited
 *   cancelAction - function called if cancel is selected
 *   callback - function called when processing is complete (I think)
 *
 */
function editNode(data, cancelAction, callback) {
  document.getElementById("node-label").value = data.label;
  document.getElementById("node-state").value = getNodeState(data);
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

/*
 * saveNodeData(data, callback) - retreive data from form and apply to node data before processing by visjs
 *
 *   data - the data for the node that is being created/edited
 *   callback - visjs callback to process node data
 *
 */
function saveNodeData(data, callback) {
  // retreive data from the form
  data.label = document.getElementById("node-label").value;
  var state = document.getElementById("node-state").value;
  
  switch(state) {
    case nodeStates.DONE:
      data = setToDone(data);
      break;
      
    case nodeStates.WIP:
      data = setToWip(data);
      break;
      
    case nodeStates.PLANNED:
    default:
      data = setToPlanned(data);
  }
  
  // clear the web form for next time
  clearNodePopUp();
  
  // let visjs apply the data to the network graph
  callback(data);
}

function exportNetwork() {
  clearOutputArea();
 
  network.storePositions(); // why do we need to do this?

  var treeData = new TreeData(
    data.nodes.get(data.nodes.getIds()),
    data.edges.get(data.edges.getIds()),
    extended
  );
  exportArea.value = JSON.stringify(treeData, null, 2);
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

function TreeData(nodes, edges, extended) {
  var that=this;
  
  this.nodes = nodes;
  this.edges = edges;
  this.extended = extended;
}

function getNodeState(data) {
  if(data.shapeProperties.borderDashes != false) {
    return nodeStates.WIP;
  } else if(data.color.border == "#6E8097") {
    return nodeStates.PLANNED;
  }
  
  return nodeStates.DONE;
}

function setToDone(data) {
  data.shapeProperties = { borderDashes: false };
  data.color = { border: "#EB8243" };
  data.font = { color: "#EB8243"};
  return data;
}

function setToWip(data) {
  data.shapeProperties = { borderDashes: [5, 5] };
  data.color = { border: "#EB8243" };
  data.font = { color: "#EB8243"};
  return data;
}

function setToPlanned(data) {
  data.shapeProperties = { borderDashes: false };
  data.color = { border: "#6E8097" };
  data.font = { color: "#6E8097"};
  
  return data;
}


      

var setNodeSelected = function (values, id, selected, hovering) {
  if(hovering) {
    values.borderColor = BORDER_COLOR_HOVER;
  }
  
  if(selected) {
    values.color = NODE_BACKGROUND_COLOR_SELECTED;
    values.bordercolor = BORDER_COLOR_SELECTED;
  }
};

const nodeStates = {
  PLANNED: 'Planned',
  WIP: 'Wip',
  DONE: 'Done',
}

const BORDER_COLOR_PLANNED = "#6E8097";
const LABEL_COLOR_PLANNED = "#6E8097";

const BORDER_COLOR_WIP = "#EB8243";
const LABEL_COLOR_WIP = "#EB8243";

const BORDER_COLOR_DONE = "#EB8243";
const LABEL_COLOR_DONE = "#EB8243";

const BORDER_COLOR_HOVER = "#5599ff";
// const LABEL_COLOR_PLANNED = "";

const BORDER_COLOR_SELECTED = "#5599ff";
// const LABEL_COLOR_PLANNED = "";

const BACKGROUND_COLOR = "#15181C";

const NODE_BACKGROUND_COLOR = "#15181C";
const NODE_BACKGROUND_COLOR_HOVER = "#15181C";
const NODE_BACKGROUND_COLOR_SELECTED = "#5599ff55";




const nodes = [
  {
    id: 1,
    label: "Alpha",
    shapeProperties: { borderDashes: false },
    icon: { code: "\uf160"},
    color: {
      border: BORDER_COLOR_DONE,
    },
    font: { color: LABEL_COLOR_DONE},
  },
  {
    id: 2,
    label: "Bravo",
    icon: { code: "\uf164"},
  },
  {
    id: 3,
    label: "Charli",
    shapeProperties: { borderDashes: [5, 5] },
    state: nodeStates.WIP,
    color: {
      border: BORDER_COLOR_WIP,
    },
    font: { color: LABEL_COLOR_WIP},
  },
  {
    id: 4,
    label: "Fred",
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
//      levelSeperation: 150,
//      treeSpacing: 200,
//      blockShifting: false,
      nodeSpacing: 450,
    }
  },
  nodes: {
    borderWidth: 2,
    font: { size: 22, color: LABEL_COLOR_PLANNED, background: BACKGROUND_COLOR },
    size: 30,
    shape: "dot",
    shapeProperties: { borderDashes: false },
    chosen: { label: false, node: setNodeSelected },
    color: {
      background: NODE_BACKGROUND_COLOR,
      border: BORDER_COLOR_PLANNED,
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

function importNetwork() {
  var inputValue = exportArea.value;
  var inputData = JSON.parse(inputValue);

  var data = {
    nodes: inputData.nodes,
    edges: inputData.edges,
  };

  network = new vis.Network(container, data, options);

  resizeExportArea();
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
  if(data.shapeProperties == undefined) {
    return nodeStates.PLANNED;  
  }
  if(data.shapeProperties.borderDashes != false) {
    return nodeStates.WIP;
  } else if(data.color.border == BORDER_COLOR_PLANNED) {
    return nodeStates.PLANNED;
  }
  
  return nodeStates.DONE;
}

function setToDone(data) {
  data.shapeProperties = { borderDashes: false };
  data.color = { border: BORDER_COLOR_DONE };
  data.font = { color: LABEL_COLOR_DONE};
  return data;
}

function setToWip(data) {
  data.shapeProperties = { borderDashes: [5, 5] };
  data.color = { border: BORDER_COLOR_WIP };
  data.font = { color: LABEL_COLOR_WIP};
  return data;
}

function setToPlanned(data) {
  data.shapeProperties = { borderDashes: false };
  data.color = { border: BORDER_COLOR_PLANNED };
  data.font = { color: LABEL_COLOR_PLANNED};
  
  return data;
}

/* 

https://visjs.github.io/vis-network/docs/network/#methodManipulation

*/

//function editMode() {
//  network.enableEditMode();
//}
//function addNode() {
//  network.addNodeMode();
//}
//function editNode() {
//  network.editNode();
//}
//function addLink() {
//  network.addEdgeMode();
//}
//function deleteSomething() {
//  network.deleteSelected();
//}
      

// webui
webui.ready(function() {

  ui("#menuAction").navButtonControl({ 
    transitionDuration: 300, 
    backgroundColor: "rgb(92, 107, 192)", 
    color: "#FFF"
  });

});
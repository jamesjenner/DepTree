/*
 * network tree using cirrus - https://spiderpig86.github.io/Cirrus/docs/
 *
 *
 */

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

const BACKGROUND_COLOR = "#212121";

const NODE_BACKGROUND_COLOR = "#212121";
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
    enabled: false, 
    initiallyActive: false,
    addNode: addNode,
    editNode: editNode,
    addEdge: addEdge,
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
  
  network.on("selectNode", function(param) {
    console.log("network event: selectNode " + JSON.stringify(param));
  });
  
//  network.on("", function(param) {
//    console.log("network event: ");
//  });
//  network.on("zoom", function (params) {
//    console.log("zoom level: " + params.scale);
//  });
}

var btnCloseEditPanel;
var btnAddNode;
var btnAddNodeCancel;
var btnAddNodeSave;
var btnEditNode;
var btnAddLink;
var btnDelete;
var btnOpenEditPanel;


window.addEventListener("load", () => {
  container = document.getElementById("mynetwork");
  exportArea = document.getElementById("input_output");
  importButton = document.getElementById("import_button");
  exportButton = document.getElementById("export_button");

  btnCloseEditPanel = document.getElementById("closeEditPanel");
  btnAddNode = document.getElementById("addNode");
  btnAddNodeCancel = document.getElementById("btnAddNodeCancel");
  btnAddNodeSave = document.getElementById("btnAddNodeSave");
  btnEditNode = document.getElementById("editNode");
  btnAddLink = document.getElementById("addLink");
  btnDelete = document.getElementById("delete");
  btnOpenEditPanel = document.getElementById("openEditPanel");
  
  setupListeners();
  
  draw();
});


/* listen for esc key and close any open modals */
document.addEventListener('keyup', function(e) {
  if(e.key === "Escape") {
    const modals = document.querySelectorAll('.modal-overlay');
    
    for (const modal of modals) {
      modal.click();
    }
  }
});

/*
 * addNode(data, callback) - setup form when adding a node
 *
 *   data - the data for the node to be edited
 *   callback - function called when processing is complete
 *
 */
function addNode(data, callback) {
  // hide the instruction
  hideInfoToast();
  
  // display the window
  window.location.hash = "#modal-id";
  
  // setup the dialog
  document.getElementById("node-dialog-title").innerHTML = "Add Node";
  document.getElementById("node-label").value = data.label;
  document.getElementById("node-state").value = getNodeState(data);
  
  btnAddNodeSave.onclick = saveNodeData.bind(
    this,
    data,
    callback
  );
  
  btnAddNodeCancel.onclick = cancelNodeEdit.bind(
    this,
    callback
  );
}

/*
 * editNode(data, callback) - setup form when editing a node
 *
 *   data - the data for the node to be edited
 *   callback - function called when processing is complete
 *
 */
function editNode(data, callback) {
  // hide the instruction
  hideInfoToast();
  
  // display the window
  window.location.hash = "#modal-id";
  
  document.getElementById("node-dialog-title").innerHTML = "Edit Node";
  document.getElementById("node-label").value = data.label;
  document.getElementById("node-state").value = getNodeState(data);
  
  btnAddNodeSave.onclick = saveNodeData.bind(
    this,
    data,
    callback
  );
  
  btnAddNodeCancel.onclick = cancelNodeEdit.bind(
    this,
    callback
  );
}

/*
 * cancelNodeEdit(callback) - peform tidyup when canceling editing/adding a node
 *
 *   callback - visjs callback to process node data
 *
 */
function cancelNodeEdit(callback) {
  callback(null);
  // turn off edit mode (i.e. add a new node mode)
  network.disableEditMode();
}

// TODO: ESC is now closing the instruction. the add edge mode appears canceled, need to verify

function addEdge(data, callback) {
  // hide the instruction
  hideInfoToast();
  
  // process the data via visjs
  callback(data);
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
  
  // let visjs apply the data to the network graph
  callback(data);
  
  // we don't appear to need this, not really sure why. Possibly the callback is also turning off the add mode
  // network.disableEditMode();
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

function showInfoToast(text, cancelCallback) {
  var infoToast = document.getElementById("infoToast");
  
  // var infoToastCloseBtn = document.getElementById("closeInfoToast");
  var infoToastText = document.getElementById("infoToastText");

  // close if user selects the toast
  infoToast.addEventListener('click', function() {hideInfoToast(true)});
  // infoToastCloseBtn.addEventListener('click', function() { hideInfoToast(cancelCallback); });
  infoToast.cancelCallback = cancelCallback;
  
  // close if user selects esc
  document.addEventListener('keyup', checkEscOnInfoToast);
  
  // setup message
  infoToastText.innerHTML = text;
  
  // set visible
  infoToast.style.visibility="visible";
  infoToast.style.opacity=1.0;
  
}

function hideInfoToast(canceled = false) {
  var infoToast = document.getElementById("infoToast");
  infoToast.style.visibility="hidden";
  infoToast.style.opacity=0.0;

  if(canceled && infoToast.cancelCallback != null && infoToast.cancelCallback != undefined) {
    infoToast.cancelCallback();
  }
}

function checkEscOnInfoToast(e) {
  // check if esc has been pressed
  if(e.key === "Escape") {
    var infoToast = document.getElementById("infoToast");
    
    hideInfoToast();
    
    // remove the listener (not sure if we really need to do this)
    document.removeEventListener('keyup', checkEscOnInfoToast);
    
    if(infoToast.cancelCallback != null && infoToast.cancelCallback != undefined) {
      infoToast.cancelCallback();
    }
  }
}

function setupListeners() {
  btnOpenEditPanel.onclick = function () {
    document.getElementById("networkEditPanel").style.visibility="visible";
    document.getElementById("networkEditPanel").style.opacity=1.0;
    btnOpenEditPanel.style.visibility="hidden";
  }

  btnCloseEditPanel.onclick = function () {
    document.getElementById("networkEditPanel").style.opacity=0.0;
    document.getElementById("networkEditPanel").style.visibility="hidden";
    btnOpenEditPanel.style.visibility="visible";
  }

  btnAddNode.onclick = function () {
    showInfoToast("Select where to add the point", function() {network.disableEditMode();});
    network.addNodeMode();
  }

  btnEditNode.onclick = function () {
    // do stuff
    network.editNode();    
  }

  btnAddLink.onclick = function () {
    showInfoToast("Drag between nodes to add link", function() {network.disableEditMode();});
    network.addEdgeMode();    
  }

  btnDelete.onclick = function () {
    // do stuff
    network.deleteSelected();
  }
}
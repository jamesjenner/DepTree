var editMode = false;
var network;

window.addEventListener("load", () => {
  var container = document.getElementById("mynetwork");
  var exportArea = document.getElementById("input_output");
  var importButton = document.getElementById("import_button");
  var exportButton = document.getElementById("export_button");

  var btnCloseEditPanel = document.getElementById("closeEditPanel");
  var btnAddNode = document.getElementById("addNode");
  var btnEditItemCancel = document.getElementById("btnEditItemCancel");
  var btnEditItemSave = document.getElementById("btnEditItemSave");
  var btnEditItemDelete = document.getElementById("btnEditItemDelete");
  
  var btnEditMode = document.getElementById("editMode");
  var btnAddLink = document.getElementById("addLink");
  var btnDelete = document.getElementById("delete");
  var btnModalCancel = document.getElementById("modal-cancel");
  var btnOpenEditPanel = document.getElementById("openEditPanel");
  
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

//  btnAddNode.onclick = function () {
//    showInfoToast("Select parent of the new item", function() {network.disableEditMode();});
//    network.addNodeMode();
//  }
//
  
  btnEditMode.onclick = function () {
    // TODO: Add clear indicator that edit mode is one
    // TODO: add esc stack so user can use ESC to get out of things (e.g. edit mode, menu, etc)
    // toggleEditMode();
    network.toggleEditMode();
  }

  btnAddLink.onclick = function () {
    showInfoToast("Drag between nodes to add link", function() {network.disableEditMode();});
  }

  btnDelete.onclick = function () {
    // do stuff
  }

  var root = getComputedStyle(document.querySelector(":root"));
  var colorDefault = root.getPropertyValue("--default");
  var colorDone = root.getPropertyValue("--done");
  var colorPlanned = root.getPropertyValue("--planned");
  var colorHover = root.getPropertyValue("--hover");

  var colorIcon = root.getPropertyValue("--icon-default");
  var colorIconHover = root.getPropertyValue("--icon-hover");
  var colorPress = root.getPropertyValue("--hover-secondary");


  var diagram = document.querySelector('#diagram');
  var itemWidth = 100;
  data = {};
  options = {
    xOffset: (diagram.getBoundingClientRect().width / 2 + itemWidth / 2) - 150, 
    yOffset: 100,
    connectorAngle: 70,
    connectorDiagonalLength: 350,
    connectorVerticalLength: 350,
    lineGap: true,
    lineGapSize: 10,      
    lineTextPadding: 26 + 13,
    itemWidth: itemWidth,
    colorDefault: colorDefault,
    colorDone: colorDone,
    colorWip: colorDone,
    colorPlanned: colorPlanned,
    colorHover: colorHover,
    colorIconDefault: colorIcon,
    colorIconDone: colorIcon,
    colorIconWip: colorIcon,
    colorIconPlanned: colorPlanned,
    colorIconHover: colorIconHover,
    colorPress: colorPress,
    colorBackground: "#FF000000",
    viewFunction: viewAction,
    editFunction: editAction,
    tapFunction: clickAction,
  };
  
  network = new Network(diagram, options);
  var root =      new Item("Rendering", "Rendering", Item.STATE_SHIPPED, "&#xf1b2;", "", Item.POSITION_NA,    0, new Reference("CAD-1238", Reference.TYPE_EPIC));
  var polylines = new Item("Polylines", "Polylines", Item.STATE_SHIPPED, "&#xf197;", "", Item.POSITION_LEFT,  1, new Reference("CAD-12831", Reference.TYPE_EPIC));
  var solids =    new Item("Solids",    "Solids",    Item.STATE_WIP,     "&#xf1b3;", "", Item.POSITION_RIGHT, 1, new Reference("CAD-17284", Reference.TYPE_STORY));

  network.setRoot(root);
  network.addItem(polylines, root.id, false);
  network.addItem(solids, root.id, false);
  network.addItem(new Item("Projection",         "Projection",         Item.STATE_WIP,     "&#xf26c;", "",                                      Item.POSITION_CENTER, 2, new Reference("CAD-17285", Reference.TYPE_STORY)), polylines.id, false);
  network.addItem(new Item("Boolean operations", "Boolean operations", Item.STATE_PLANNED, "&#xf24d;", "Perform booleans on solids.",           Item.POSITION_LEFT,   2, new Reference("CAD-17285", Reference.TYPE_STORY)), solids.id, false);
  network.addItem(new Item("Validate",           "Validate",           Item.STATE_PLANNED, "&#xf058;", "Validate that the solid has no errors", Item.POSITION_RIGHT,  2, new Reference("CAD-17289", Reference.TYPE_STORY)), solids.id, false);
  
  network.generate();
  // console.log(network.export());
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

SVGView.init(document.querySelector("#diagram"), size = {width: 1500, height: 1000}, baseZoom = {width: 500, height: 500});

function clickAction(e) {

}

// todo: move listeners and visibility into network.js


function addButtonMouseEnter(event) {
  // TODO: add an empty state for new map
  
  // add listener to the add item
  // remove listener to item
  
  // event.target.parentElement.parentElement.removeEventListener("click", editAction);
}

function addButtonMouseLeave(event) {
  // event.target.parentElement.parentElement.addEventListener("click", editAction);
}

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

/*
 * viewAction(event) - view details for the node that the user clicked on
 *
 *   event - the original event that triggered the action (ie reference to node)
 *
 */
function viewAction(event) {
  console.log("View item");
  
  // TODO: add logic to view an item, make the param the id of the node that triggered the event
}

/*
 * editAction(event) - prompt the user with a form to edit the node that the user clicked on
 *
 *   event - the original event that triggered the edit action (ie indirect reference to the node)
 *
 */
function editAction(id) {
  // TODO: change this to parse the node that triggered this event

  // setup the item, based on the original
  var item = network.getItem(id);

  // set form data from item
  document.getElementById("itemTitle").innerHTML = "Edit Item";
  document.getElementById("itemName").value = item.name;
  document.getElementById("itemState").value = item.state;
  document.getElementById("itemDescription").value = item.description;
  document.getElementById("itemPosition").value = item.position;
  document.getElementById("itemReference").value = item.reference.id;
  document.getElementById("itemReferenceType").value = item.reference.type;
  
  // scroll to top
  document.getElementsByClassName("modal-body")[0].scrollTop = 0;
  
  // show the delete button
  document.getElementById("btnEditItemDelete").style.visibility="visible";
  
  // display the window
  window.location.hash = "#modalEditItem";
  
  // setup save action, pass the event that opened this edit action to the apply
  // btnEditItemSave.onclick = saveItemAction.bind(this, event, saveItemAction);
  btnEditItemSave.onclick = saveItemAction.bind(this, id);
  
  // setup delete action
  btnEditItemDelete.onclick = network.removeItem.bind(this, id);
}

// TODO: add function for handling empty state click (adding first node)

/*
 * addAction(event) - prompt the user with a form to add a node to the node that the user clicked on (i.e. the parent for the new node)
 *
 *   event - the event of the click, i.e. reference to the node that the user clicked on
 *
 */
function addAction(event) {
  console.log("Add item");

  // get the target of the click
  var item = network.getItem(event.target.parentNode.parentNode.id);
  
  // TODO: sort out handling the icon
  
  // setup data
  document.getElementById("itemTitle").innerHTML = "Add Item";
  document.getElementById("itemName").value = "";
  document.getElementById("itemState").value = Item.STATE_PLANNED;
  document.getElementById("itemDescription").value = "";
  document.getElementById("itemPosition").value = Item.POSITION_CENTER;
  document.getElementById("itemReference").value = "";
  document.getElementById("itemReferenceType").value = "";
  
  // scroll to top
  document.getElementsByClassName("modal-body")[0].scrollTop = 0;
  
  // hide the delete button
  // TODO: why is there a delay when setting hidden?
  document.getElementById("btnEditItemDelete").style.visibility="hidden";
  
  // display the window
  window.location.hash = "#modalEditItem";
  
  // setup save action
  btnEditItemSave.onclick = addItemAction.bind(this, item.id);
}

/*
 * saveItemAction(event) - retreive form data and update the item
 *
 *   event - the original event that triggered the edit action (ie indirect reference to the node)
 *
 */
function saveItemAction(id) {
  // setup the item, based on the original
  var item = network.getItem(id);

  // get values from the form and apply to the DTO
  // retreive data from the form
  item.name = document.getElementById("itemName").value;
  item.state = document.getElementById("itemState").value;
  item.position = document.getElementById("itemPosition").value;
  item.description = document.getElementById("itemDescription").value;
  item.reference.id = document.getElementById("itemReference").value;
  item.reference.type = document.getElementById("itemReferenceType").value;

  // TODO: support selecting and updating the icon
  // TODO: not handling changing the position
  
  // update the data and ui
  network.updateItem(item);
}

/*
 * addItemAction(parentTransform, level) - retreive data from the edit form and create a new item
 *
 *   parentId  the item id for the parent that this will be added to
 *
 */
function addItemAction(parentId) {
  var item = new Item();
  var ref = new Reference();

  // TODO: remove need to set the level, should be auto determined (e.g. first or later one)

  // retreive data from the form
  item.name = document.getElementById("itemName").value;
  item.state = document.getElementById("itemState").value;
  item.position = document.getElementById("itemPosition").value;
  item.description = document.getElementById("itemDescription").value;

  ref.id = document.getElementById("itemReference").value;
  ref.type = document.getElementById("itemReferenceType").value;
  item.reference = ref;

  network.addItem(item, parentId);

  // addItemToItem.addEventListener("mouseenter", addButtonMouseEnter);
  // addItemToItem.addEventListener("mouseleave", addButtonMouseLeave);
  
}

function modifyItemPosition() {
}

function setupItemIcon() {
  // do we need this?
}

function cancelItemChanges() {
  
}


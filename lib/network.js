
class Reference {
  static TYPE_EPIC = "Epic";
  static TYPE_STORY = "Story";
  static TYPE_DEFECT = "Defect";

  type;
  id;
  
  constructor(id = getUuid(), type = Reference.TYPE_STORY) {
    this.id = id;
    this.type = type;
  }
  
}

class Item {
  static POSITION_LEFT = "Left";
  static POSITION_RIGHT = "Right";
  static POSITION_CENTER = "Center";
  static POSITION_NA = "Not applicable";


  static STATE_SHIPPED = "Shipped";
  static STATE_PLANNED = "Planned";
  static STATE_WIP = "WIP";
  static DEFAULT_ICON = "&#xf26c;";

  id;
  name;
  state;
  icon;
  description;
  position;
  reference;
  
  constructor(id, name = "", state = Item.STATE_PLANNED, icon = Item.DEFAULT_ICON, description = "", position = Item.POSITION_CENTER, reference = new Reference()) {
    this.id = typeof id === "undefined" ? getUuid() : id;
    this.name = name;
    this.state = state;
    this.icon = icon;
    this.description = description;
    this.position = position;
    this.reference = reference;
  }

}

class Node {
  item;
  level;
  parentId;
  childrenIds;
  
  constructor(item, level = 0, parentId = "", childrenIds = []) {
    this.item = item;
    this.level = level;
    this.parentId = parentId;
    this.childrenIds = childrenIds;
  }

  hasChildren() {
    return this.childrenIds.length > 0;
  }
  
  getChildrenIds() {
    return this.childrenIds;
  }

  isRoot() {
    return this.level == 0;
  }

  getLevel() {
    return level;
  }
}

class Network {
  static SVGNS = "http://www.w3.org/2000/svg";

  #nodes = {};
  
  #options = {
    xOffset: 300,
    yOffset: 100,
    connectorAngle: 70,
    connectorDiagonalLength: 350,
    connectorVerticalLength: 350,
    
    lineGap: true,
    lineGapSize: 10,      
    lineTextPadding: 26 + 13, // currently set to the font height + half again (typical row spacing)
                              // todo: make this calculated, so user can choose font height and item width
    itemWidth: 100,

    viewFunction: null,
  };

  #container;
  
  constructor(container, options) {
    this.#container = container;
    
    if(typeof options !== "undefined") {
      this.#options = options;
    }
  }

  setRoot(item) {
    var node = new Node(item);
    
    this.#nodes = {};
    this.#nodes["root"] = node;
    this.#nodes[item.id] = node;
  }

  getRoot() {
    return this.#nodes.root;
  }

  /*
   * getItem(id) get the item for the id
   *
   * id   the id for the item
   */
  getItem(id) {
    return this.#nodes[id].item;
  }

  getParent(id) {
    return this.#nodes[id].parentId;
  }

  getChildren(node) {
    var children = [];
    
    if(node !== "undefined" && node.hasChildren()) {
      for(var i = 0; i < node.childrenIds.length; i++) {
        children.push(this.#nodes[node.childrenIds[i]]);
      }
    }
                        
    return children;
  }

  /*
   * addItem(item) 
   *
   * Adds a new node for the item, to the parent, within the network
   * This does not support
   * 
   * item      Item DTO for the new node
   * parentId  optional, id of the parent, if not specified then the node is presumed to be a new root
   * updateUI  optional, if true then item is added to UI, if false then UI is not modified
   */
  addItem(item, parentId = "", updateUI = true) {
    // TODO: handle no parent id
    // TODO: do we want seperate trees? if so then we need to handle multiple trees and adding a new root node
    var level = 0;

    if (parentId != "") {
      level = this.#nodes[parentId].level + 1;
    }

    var node = new Node(item, level, parentId);
    this.#nodes[item.id] = node;
    this.#nodes[parentId].childrenIds.push(item.id);

    // TODO: add to the UI
    if(updateUI) {
      this.#addNodeUI(node);
    }
  }

  removeItem(itemId, updateUI = true) {

    // remove all the children, and the children's children, and the childern's children's children, and so on...
    this.#removeChildren(this.#nodes[itemId]);
    
    // remove reference parent's children
    if(this.#nodes[itemId].parentId != "") {
      for(var i = 0; i < this.#nodes[this.#nodes[itemId].parentId].childrenIds.length; i++) {
        if(this.#nodes[this.#nodes[itemId].parentId].childrenIds[i] === itemId) {
          this.#nodes[this.#nodes[itemId].parentId].childrenIds.splice(i, 1);
          i--;
        }
      }
    }
       
    // remove self
    delete this.#nodes[itemId];

    // TODO: remove from the UI
    // TODO: add to the UI
    if(updateUI) {
      this.#removeNodeUI(this.#nodes[modifiedItem.id].item);
    }
  }

  /*
   * updateItem(item) 
   *
   * Updates the nodes based on item.id with the data passed via the item object.
   * This does not support: changing the parent, children, id, position and level.
   * 
   * modifiedItem  Item DTO, with changes to be applied to modifiedItem.id
   * updateUI      if true then the ui is updated, otherwise just the item node
   */
  updateItem(modifiedItem, updateUI = true) {
    
    this.#nodes[modifiedItem.id].item.name = modifiedItem.name;
    this.#nodes[modifiedItem.id].item.state = modifiedItem.state;
    this.#nodes[modifiedItem.id].item.icon = modifiedItem.icon;
    this.#nodes[modifiedItem.id].item.description = modifiedItem.description;
    this.#nodes[modifiedItem.id].item.reference = modifiedItem.reference;

    if(updateUI) {
      this.#updateNodeUI(this.#nodes[modifiedItem.id].item);
    }
  }
  
  export() {
    console.log("lets export");
    return JSON.stringify(this.#nodes, null, " ");
  }
                          
  import() {
    // TODO: implement import option
  }
      
  #removeChildren(item) {
    for(var i = 0; i < item.childrenIds.length; i++) {
      // delete the children for current child
      this.#removeChildren(this.#nodes[item.childrenIds[i]]);
      // delete current child
      delete this.#nodes[item.childrenIds[i]];
    }
  }

  /*
   * generate() generate the network
   */ 
  generate() {
    var levelTransform = [];
    var lastLevel = 0;
    
    // todo: how to determine center of first item?
    // should be center of the svg tag?
    
    // ToDo: clear #container first
    
    // load the very first item: root
    lastLevel = this.#initialLoadAddItemToDiagram(this.#nodes.root, levelTransform, lastLevel);

    // load the children of root
    this.#processItems(this.getChildren(this.#nodes.root), levelTransform, lastLevel);
  }

  // TODO: implement addItemToData
  #addItemToData(parentId, newData) {

  }

  // TODO: implement deleteItemFromData
  #deleteItemFromData(id) {

  }

  // TODO: implement moveItemWithinData
  #moveItemWithinData(movingId, newParentId, oldParentId) {

  }

  /*
   * processItems() recursive add item function
   *
   * iterates through a tree sturcture where items have child items of the same type, so that 
   * all items are added to the #container
   * 
   * items           the items to be added, and their child items and so 
   * levelTransform  an array of transform setps for the level, will be truncated as a branch is completed 
   * lastLevel       the previous level processed
   *
   * returns the last level processed
   */
  #processItems(items, levelTransform, lastLevel) {
    if(items == undefined && items == null) {
      return lastLevel;
    }

    for(let i = 0; i < items.length; i++) {
      lastLevel = this.#initialLoadAddItemToDiagram(items[i], levelTransform, lastLevel);

      // load the children of the current item
      lastLevel = this.#processItems(this.getChildren(items[i]), levelTransform, lastLevel);
    }

    return lastLevel;
  }

  /*
   * initialLoadAddItemToDiagram - adds the current node iteration to the #container
   * 
   *   node            node being loaded
   *   levelTransform  array of transforms for each level
   *   lastLevel       previous level that was processed
   */
  #initialLoadAddItemToDiagram(node, levelTransform, lastLevel) {
    var parentTransform = "";

    // if past first level, then caluclate the parent transform
    if(!node.isRoot()) {
      // if lastLevel is higher than current level, then truncate the array
      if(lastLevel >= node.level) {
        // truncate to the level needed, not using pop, as changes are it's more than one pop, which makes setting length faster
        levelTransform.length = node.level;
      }

      for(var i = 0; i < levelTransform.length; i++) {
        parentTransform += levelTransform[i];
      }
    }

    var itemTransform = this.#getItemTransform(node);

    // set the current transform to the item
    levelTransform[node.level] = itemTransform;

    this.#addItemToDiagram(node, parentTransform, itemTransform);

    // update last level to the current level
    lastLevel = node.level;

    return lastLevel;
  }

  /* 
   * addItemToDiagram - adds an item to the #container
   *
   *   node            node representing the item in the network
   *   parentTransform transform text for the parent of this item
   *   itemTransform   transform text for the current item
   */
  #addItemToDiagram(node, parentTransform, itemTransform) {
    var textNode;
    var lineTransform = parentTransform;

    let connector = document.createElementNS(Network.SVGNS, "line");
    var angle = this.#getConnectorAngle(node.item.position);
    var connectorLength = this.#getConnectorLength(node.item.position);

    // if we need to draw a connector only if not the first level
    if(!node.isRoot()) {
      // setup and add the line to the document (added intentionally before the item)
      var x = 0;
      var y1 = 0;
      var y2 = y1 + connectorLength - (this.#options.itemWidth / 2);
      var lineGap = 0;
      var textGap = 0;

      if(this.#options.lineGap) {
        lineGap = this.#options.lineGapSize;
      }

      if(node.item.position == Item.POSITION_CENTER) {
        textGap = this.#options.lineTextPadding;
      }
      connector.setAttribute("x1", x);
      connector.setAttribute("y1", y1);
      connector.setAttribute("x2", x);
      connector.setAttribute("y2", y2 - (this.#options.itemWidth / 2) - lineGap * 2);

      if(node.item.position != Item.POSITION_CENTER) {
        // rotate for the required angle
        lineTransform += "rotate(" + angle + ", 0, 0) ";
      } else {
        // shorten because of the text
        connector.setAttribute("y2", y2 - (this.#options.itemWidth / 2) - lineGap * 2 - textGap);
      }

      lineTransform += " translate(0, " + ((this.#options.itemWidth / 2) + lineGap + textGap) + ")";

      connector.setAttribute("transform", lineTransform);

      // note that style of connector is performed below when setupVisualStates is called
      this.#container.appendChild(connector);
    } else {
      // TODO: this is not the best approach, setting to null to stop it being styles in setupVisualStates()
      connector = null;
    }

    // define parent item group, contains item group and name (ie. item label under the ellipse)
    let parentItemGroup = document.createElementNS(Network.SVGNS, "g");

    // setup the item group, contains ellipse, main icon and add icon (group)
    let itemGroup = document.createElementNS(Network.SVGNS, "g");
    itemGroup.setAttribute("class", "item");
    itemGroup.setAttribute("id", node.item.id);
    itemGroup.setAttribute("data-state", node.item.state);
    itemGroup.setAttribute("data-name", node.item.name);
    itemGroup.setAttribute("data-description", node.item.description);
    itemGroup.setAttribute("data-position", node.item.position);
    itemGroup.setAttribute("data-reference", node.item.reference.id);
    itemGroup.setAttribute("data-reference-type", node.item.reference.type);
    itemGroup.setAttribute("data-level", node.level);

    // setup the item border (ie. ellipse)
    let ellipse = document.createElementNS(Network.SVGNS, "ellipse");
    ellipse.setAttribute("rx", this.#options.itemWidth / 2);
    itemGroup.appendChild(ellipse);

    // setup the item icon
    let mainIcon = document.createElementNS(Network.SVGNS, "text");
    mainIcon.setAttribute("text-anchor", "middle");
    mainIcon.setAttribute("alignment-baseline", "central");
    mainIcon.innerHTML = node.item.icon;
    itemGroup.appendChild(mainIcon);

    // setup the add control for the item
    // TODO: this group seems redundant, if it is then remove it
    let addIconGroup = document.createElementNS(Network.SVGNS, "g");
    addIconGroup.setAttribute("transform", "translate(0, 35)");

    let addIcon = document.createElementNS(Network.SVGNS, "text");
    addIcon.setAttribute("class", "material-icons modifyIcon modifyIconAdd");
    addIcon.setAttribute("text-anchor", "middle");
    addIcon.setAttribute("alignment-baseline", "central");
    textNode = document.createTextNode("add");
    addIcon.appendChild(textNode);
    addIconGroup.appendChild(addIcon);
    itemGroup.appendChild(addIconGroup);

    // setup the name for the item, add it to the parent item group so it doesn't trigger hover events
    let textName = document.createElementNS(Network.SVGNS, "text");
    textName.setAttribute("class", "name");
    textName.setAttribute("text-anchor", "middle");
    textName.setAttribute("alignment-baseline", "text-before-edge");
    textName.setAttribute("transform", "translate(0,60)");
    textNode = document.createTextNode(node.item.name);
    textName.appendChild(textNode);

    // setup the parent item group
    parentItemGroup.setAttribute("transform", parentTransform + itemTransform);
    parentItemGroup.appendChild(itemGroup);
    parentItemGroup.appendChild(textName);

    // setup all the styles, note connector will be null if there is no need for a connector (ie parent node)
    this.#setupVisualStates(node.item.state, connector, ellipse, mainIcon, textName);

    this.#container.appendChild(parentItemGroup);

    // TODO: actions should be specified when seting up the network

    itemGroup.addEventListener("click", this.#options.viewFunction);

    //  if we wanted a delete option at the top of the itemGroup/ellipse
    //
    //  <g transform="translate(0,-35)">
    //    <text class="material-icons modifyIcon modifyIconDelete" text-anchor="middle" alignment-baseline="central">close</text>
    //  </g>
  }
  
  /*
   * getItemTransform (node) get the relative transform for an item for it's parent 
   *
   * node   the node of which to get the transform for
   *
   */
  #getItemTransform(node) {
    var position = node.item.position;

    var itemTransform = "";
    var angle = this.#getConnectorAngle(position);
    var connectorLength = this.#getConnectorLength(position);

    if(!node.isRoot()) {
      if(position == Item.POSITION_CENTER) {
        // translate straight down
        itemTransform = 
          "translate(0, " + connectorLength + ") ";
      } else {
        // rotate, translate to the side and then rotate back
        itemTransform = 
          "rotate(" + angle + ", 0, 0) " +
          "translate(0, " + connectorLength + ") " +
          "rotate(" + (-angle) + ", 0, 0) ";
      }
    } else {
      // TODO: hard coded offset the start, for now, while wip
      itemTransform = "translate(" + (0 + this.#options.xOffset) + "," + (this.#options.yOffset + 35) + ") ";
    }

    return itemTransform;  
  }

  /*
   * getAbsoluteTransform (node) get the absolute transform for a node
   *
   * node   the node of which to get the transform for
   *
   */
  #getAbsoluteTransform(node) {
    // this is only needed as current structure is to not put elements under each other (which we should do?)
  }

  #getConnectorAngle(position) {
    var angle = 0;

    switch(position) {
      case Item.POSITION_LEFT:
        angle = this.#options.connectorAngle;
        break;

      case Item.POSITION_RIGHT:
        angle = -this.#options.connectorAngle;
        break;

      case Item.POSITION_CENTER:
        angle = 0;
        break;
    }

    return angle;
  }

  #getConnectorLength(position) {
    var connectorLength = this.#options.connectorDiagonalLength;

    switch(position) {
      case Item.POSITION_LEFT:
        connectorLength = this.#options.connectorDiagonalLength;        
        break;

      case Item.POSITION_RIGHT:
        connectorLength = this.#options.connectorDiagonalLength;        
        break;

      case Item.POSITION_CENTER:
        connectorLength = this.#options.connectorDiagonalLength * Math.cos(this.#options.connectorAngle * Math.PI / 180) * 2;
        break;
    }

    return connectorLength;
  }

  /*
   * updateNodeUI (item) 
   * 
   * update the visual representation of the node based on the Item instance
   *
   * item   Item DTO for the item to be updated
   */
  #updateNodeUI(item) {
    // use the id to retrieve the svg elements
    var g = document.getElementById(item.id).parentNode;
    var ellipse = g.querySelector("ellipse");
    var connector = g.previousSibling;
    var textItems = g.querySelectorAll("text");
    var mainIcon = textItems[0];
    var addIcon = textItems[1];
    var textName = textItems[2];

    // update the name
    textName.firstChild.nodeValue = item.name;

    this.#setupVisualStates(item.state, connector, ellipse, mainIcon, textName);
  }

/*
   * addNodeUI (item) 
   * 
   * add the visual representation for the specified node
   *
   * node      node to be added to the UI
   */
  #addNodeUI(node) {
    var parentTransform = "";
    var itemTransform = "";

    // determine the item transform (not sure why this is passed in)
    var itemTransform = this.#getItemTransform(node);

    if(!node.isRoot()) {
      // determine the parent transform
      parentTransform = this.#getItemTransform(this.#nodes[node.parentId]);
    }

    this.#addItemToDiagram(node, parentTransform, itemTransform)    
  }

/*
   * removeNodeUI (item) 
   * 
   * remove the visual representation for the specified node
   *
   * node      the node to be removed from the UI
   */
  #removeNodeUI(node) {

  }

  #getItemGraphicsTag(id) {
  }

  /* 
   * setupVisualStates (state, connector, ellipse, mainIcon, textName) 
   * 
   * setup the visual styling for the state of the item
   *
   * state      the state of the item
   * connector  the svg item line connection
   * ellipse    the svg item border element
   * mainIcon   the svg main icon element
   * textName   the svg item title element
   */
  #setupVisualStates(state, connector, ellipse, mainIcon, textName) {
    // all we need is the element of the item, and then the context can be figured out from there...

    // select for <g> where class = "item" and id = "id", but this only works if we have already attached it do the document
    // so two modes? either attached to the doc or not...

    // let ellipse = event.target.parentNode.querySelector("ellipse");
    // let connector = event.target.parentNode.parentNode.previousSibling;
    // let textItems = event.target.parentNode.parentNode.querySelectorAll("text");
    // let mainIcon = textItems[0];
    // let addIcon = textItems[1];
    // let textName = textItems[2];
    
    // setupVisualStates(state, connector, ellipse, mainIcon, textName);

    switch(state) {
      case Item.STATE_PLANNED:
        if(connector != null && connector.nodeName == "line") connector.setAttribute("class", "line linePlanned");
        ellipse.setAttribute("class", "planned");
        mainIcon.setAttribute("class", "icon iconPlanned");
        textName.setAttribute("class", "name namePlanned");
        break;
  
      case Item.STATE_WIP:
        if(connector != null && connector.nodeName == "line") connector.setAttribute("class", "line lineWIP");
        ellipse.setAttribute("class", "wip");
        mainIcon.setAttribute("class", "icon");
        textName.setAttribute("class", "name");
        break;
  
      case Item.STATE_SHIPPED:
        if(connector != null && connector.nodeName == "line") connector.setAttribute("class", "line");
        ellipse.setAttribute("class", "done");
        mainIcon.setAttribute("class", "icon");
        textName.setAttribute("class", "name");
        break;
    }
  }
}

/*** --- ***/

/*
 * UUID generator (v4 as of 3 Nov 2020), see https://stackoverflow.com/a/2117523/1125784
 */
function getUuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}


/*** --- ***/

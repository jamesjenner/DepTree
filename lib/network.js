
/*
 * Network - dynamic SVG based network
 *
 * Author: James Jenner
 * Copyright: 2020
 * License: MIT
 */

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

  #editMode = false;
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
      this.#addNodeToUI(node);
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
    var lastLevel = 0;
    
    // todo: how to determine center of first item?
    // should be center of the svg tag?
    
    // ToDo: clear #container first

    // load the root node, all children will automatically be added
    this.#processNodeForUI(this.#nodes.root);

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

  // TODO: add validation method to handle if nodes will impact each other when added

  #processNodeForUI(node) {
    if(node == undefined && node == null) {
      return;
    }

    this.#addNodeToUI(node);

    var childrenNodes = this.getChildren(node)

    for(let i = 0; i < childrenNodes.length; i++) {
      // load the child of the current node
      this.#processNodeForUI(childrenNodes[i]);
    }
  }

  /* 
   * addNodeToUI - adds an item to the #container
   *
   *   node            node representing the item in the network
   *   parentTransform transform text for the parent of this item
   *   itemTransform   transform text for the current item
   */
  #addNodeToUI(node) {
    var textNode;
    var lineTransform = "";
    var itemTransform = this.#getItemTransform(node);

    let connector = document.createElementNS(Network.SVGNS, "line");
    var angle = this.#getConnectorAngle(node.item.position);
    var connectorLength = this.#getConnectorLength(node.item.position);

    var parentElement;

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
        lineTransform = "rotate(" + angle + ", 0, 0) ";
      } else {
        // shorten because of the text
        connector.setAttribute("y2", y2 - (this.#options.itemWidth / 2) - lineGap * 2 - textGap);
      }

      lineTransform += " translate(0, " + ((this.#options.itemWidth / 2) + lineGap + textGap) + ")";

      connector.setAttribute("transform", lineTransform);

      // get the transform group for the parent id
      parentElement = document.getElementById(node.parentId).parentNode;

      // note that style of connector is performed below when setupVisualStates is called
      parentElement.appendChild(connector);
    } else {
      // TODO: this is not the best approach, setting to null to stop it being styles in setupVisualStates()
      connector = null;
      parentElement = this.#container;
    }

    // define parent item group, contains item group and name (ie. item label under the ellipse)
    let parentItemGroup = document.createElementNS(Network.SVGNS, "g");

    // setup the item group, contains ellipse, main icon and add icon (group)
    let itemGroup = document.createElementNS(Network.SVGNS, "g");
    itemGroup.setAttribute("class", "item");
    itemGroup.setAttribute("id", node.item.id);

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
    let editIconGroupCenter = document.createElementNS(Network.SVGNS, "g");
    editIconGroupCenter.setAttribute("transform", this.#getModifyIconTransform(Item.POSITION_CENTER));

    let editIconGroupLeft = document.createElementNS(Network.SVGNS, "g");
    editIconGroupLeft.setAttribute("transform", this.#getModifyIconTransform(Item.POSITION_LEFT));
    
    let editIconGroupRight = document.createElementNS(Network.SVGNS, "g");
    editIconGroupRight.setAttribute("transform", this.#getModifyIconTransform(Item.POSITION_RIGHT));

    // todo: change the icon dynamically, could be delete or add
    var modifyItemIcon = document.createElementNS(Network.SVGNS, "text");
    modifyItemIcon.setAttribute("class", "material-icons modifyIcon modifyIconAdd");
    modifyItemIcon.setAttribute("text-anchor", "middle");
    modifyItemIcon.setAttribute("alignment-baseline", "central");
    textNode = document.createTextNode("add");  // add and close, need a link/join/connect option
    modifyItemIcon.appendChild(textNode);

    editIconGroupLeft.appendChild(modifyItemIcon);
    editIconGroupCenter.appendChild(modifyItemIcon.cloneNode(true));
    editIconGroupRight.appendChild(modifyItemIcon.cloneNode(true));

    itemGroup.appendChild(editIconGroupLeft);
    itemGroup.appendChild(editIconGroupCenter);
    itemGroup.appendChild(editIconGroupRight);

    // setup the name for the item, add it to the parent item group so it doesn't trigger hover events
    let textName = document.createElementNS(Network.SVGNS, "text");
    textName.setAttribute("class", "name");
    textName.setAttribute("text-anchor", "middle");
    textName.setAttribute("alignment-baseline", "text-before-edge");
    textName.setAttribute("transform", "translate(0,60)");
    textNode = document.createTextNode(node.item.name);
    textName.appendChild(textNode);

    // setup the parent item group
    parentItemGroup.setAttribute("transform", itemTransform);
    parentItemGroup.appendChild(itemGroup);
    parentItemGroup.appendChild(textName);

    // setup all the styles, note connector will be null if there is no need for a connector (ie parent node)
    this.#setupVisualStates(node.item.state, connector, ellipse, mainIcon, textName);

    /* 
     * if we want it flat, then we have to setup the transform absolutely for every parentItemGroup, 
     * resulting in the very very messy code to deal with calculating absolute positioning throughout 
     * the document. It works, but it be crazy and a pain to maintain.
     * However it has the advantage that we can use CSS selectors to highlight on mouse over based on <g>. 
     * If we structure it logically, then goodbye to using css selectors for :hover
     * 
     * we should group items under other items, this will make moving nodes between branches extreamly easy. 
     * However may be complicated when deleting part way down a node, what do we do with the children? 
     * Ideally we don't wish to lose them, so need to think about this bit. For now, will presume that we
     * prune the entire branch. Ideally we should let the user reattach the detached branches. Maybe we 
     * could just make them seperate trees as a quick and dirty (though not very nice for the user).
     * 
     * It does mean that we have to detect mouse enter/exit for areas and change the fill/outline manually 
     * for the ellipse and the icon.
     */
    // this.#container.appendChild(parentItemGroup);
    // get group transform for parent
    parentElement.appendChild(parentItemGroup);

    // TODO: actions should be specified when seting up the network

    editIconGroupLeft.addEventListener("click", this.#nodeEditIconClick.bind(this, Item.POSITION_LEFT));
    editIconGroupCenter.addEventListener("click", this.#nodeEditIconClick.bind(this, Item.POSITION_CENTER));
    editIconGroupRight.addEventListener("click", this.#nodeEditIconClick.bind(this, Item.POSITION_RIGHT));

    itemGroup.addEventListener("click", this.#options.viewFunction);

    itemGroup.addEventListener("mouseenter", this.#mouseEnter.bind(this));
    itemGroup.addEventListener("mouseleave", this.#mouseLeave.bind(this));

    itemGroup.addEventListener("mousedown", this.#mouseDown.bind(this));
    itemGroup.addEventListener("mouseup", this.#mouseUp.bind(this));

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

  #getModifyIconTransform(position) {

    var angle = this.#getConnectorAngle(position);
    var offset = 38; // todo: hardcoded, should be offset from size of ellipse
    var transform = "";

    switch(position) {
      case Item.POSITION_LEFT:
        transform = 
          "rotate(" + angle + ", 0, 0) " +
          "translate(0, " + offset + ") " +
          "rotate(" + (-angle) + ", 0, 0) ";
        break;

      case Item.POSITION_RIGHT:
        transform = 
          "rotate(" + angle + ", 0, 0) " +
          "translate(0, " + offset + ") " +
          "rotate(" + (-angle) + ", 0, 0) ";
        break;

      case Item.POSITION_CENTER:
        transform = "translate(0, " + offset + ")";
        break;
    }

    return transform;
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

    this.#setEllipseDefault(ellipse, state);

    switch(state) {
      case Item.STATE_PLANNED:
        if(connector != null && connector.nodeName == "line") {
          // connector.setAttribute("class", "line linePlanned");
          connector.setAttribute("stroke", this.#options.colorPlanned);
          connector.setAttribute("stroke-width", "3px");
          connector.setAttribute("stroke-dasharray", "none");
        }
        mainIcon.setAttribute("fill", this.#options.colorIconPlanned);
        mainIcon.setAttribute("class", "icon");
        textName.setAttribute("fill", this.#options.colorPlanned);
        break;
  
      case Item.STATE_WIP:
        if(connector != null && connector.nodeName == "line") {
          // connector.setAttribute("class", "line lineWIP");
          connector.setAttribute("stroke", this.#options.colorWip);
          connector.setAttribute("stroke-width", "3px");
          connector.setAttribute("stroke-dasharray", "7, 5");
        }
        mainIcon.setAttribute("fill", this.#options.colorIconWip);
        mainIcon.setAttribute("class", "icon");
        textName.setAttribute("fill", this.#options.colorWip);
        break;
  
      case Item.STATE_SHIPPED:
        if(connector != null && connector.nodeName == "line") {
          // connector.setAttribute("class", "line");
          connector.setAttribute("stroke", this.#options.colorDone);
          connector.setAttribute("stroke-width", "3px");
          connector.setAttribute("stroke-dasharray", "none");
          }
        mainIcon.setAttribute("fill", this.#options.colorIconDone);
        mainIcon.setAttribute("class", "icon");
        textName.setAttribute("fill", this.#options.colorDone);
        break;
    }
  }

  #setEllipseDefault(ellipse, state) {
    ellipse.setAttribute("fill", this.#options.colorBackground)
    ellipse.setAttribute("stroke-width", "3px");
    
    switch(state) {
      case Item.STATE_PLANNED:
        ellipse.setAttribute("stroke", this.#options.colorPlanned);
        ellipse.setAttribute("stroke-dasharray", "none");
        break;
  
      case Item.STATE_WIP:
        ellipse.setAttribute("stroke", this.#options.colorWip);
        ellipse.setAttribute("stroke-dasharray", "7, 5");
        break;
  
      case Item.STATE_SHIPPED:
        ellipse.setAttribute("stroke", this.#options.colorDone);
        ellipse.setAttribute("stroke-dasharray", "none");
        break;
    }
  }

  #mouseEnter (event) {
    event.target.querySelector("ellipse").setAttribute("stroke", this.#options.colorHover);
    event.target.querySelector("ellipse").setAttribute("fill", this.#options.colorHover);
    event.target.querySelector("ellipse").setAttribute("fill-opacity", "10%");

    if(this.#editMode) {
      event.target.querySelectorAll(".modifyIcon").forEach(x => { 
        x.style.visibility = "visible";
      });
    }
  }

  #mouseLeave (event) {
    this.#setEllipseDefault(event.target.querySelector("ellipse"), this.#nodes[event.target.id].item.state);

    if(this.#editMode) {
      event.target.querySelectorAll(".modifyIcon").forEach(x => {
        x.style.visibility = "hidden"
      });
    }
  }

  #mouseDown (event) {
    console.log("down");
  }

  #mouseUp (event) {
    console.log("up");
  }

  #nodeEditIconClick(direction, event) {
    var parentId = event.target.parentElement.parentElement.id;
    var item = new Item();    
    item.name = "New item";
    item.position = direction;

    this.addItem(item, parentId);
  }

  toggleEditMode() {
    this.#editMode = !this.#editMode;
  
    if(this.#editMode) { 
      // set controls to visible
      const items = document.querySelectorAll('.item');
      const addItemToItems = document.querySelectorAll('.modifyIconAdd');

      // for (const addItemToItem of addItemToItems) {
      //   addItemToItem.addEventListener("mouseenter", addButtonMouseEnter);
      //   addItemToItem.addEventListener("mouseleave", addButtonMouseLeave);
      // }
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

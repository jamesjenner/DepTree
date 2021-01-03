/*
 * SVGView - allow zoom, pan for svg files
 *
 * Currently implemented as the module pattern, not the ES6 module approach so can be tested locally
 * 
 * Author: James Jenner
 * Copyright: 2020
 * License: MIT
 */

var SVGView = (function () {

    const MAIN_BUTTON = 0; // normally the left button, but could be different dependent on device and mapping (e.g. left handed use)
    const SVGNS = "http://www.w3.org/2000/svg";

    function publicInit(svg, size = {width: 500, height: 500}, baseZoom = {width: 200, height: 200}, duration = "0.6s", zoomFactor = 0.09) {
        this.svg = svg;
        this.zoomFactor = zoomFactor;
        this.baseZoom = baseZoom;
        this.size = size;
        this.duration = duration;

        // This variable will be used later for move events to check if pointer is down or not
        this.isPointerDown = false;

        // This variable will contain the original coordinates when the user start pressing the mouse or touching the screen
        var pointerOrigin;
        

        // add the animate tag to the svg
        let animate = document.createElementNS(SVGNS, "animate");

        // TODO: support multiple SVGS at same time, need to fix animate tag id
        // TODO: id is not unique
        animate.setAttribute("id", "animateZoom");
        animate.setAttribute("attributeName", "viewBox" );
        animate.setAttribute("calcMode", "spline");
        animate.setAttribute("keySplines", "0.27,0.17,.29,1");
        animate.setAttribute("keyTimes", "0;1");
        animate.setAttribute("values", "0 0 " + this.size.width + " " + this.size.height + ";0 0 " + this.baseZoom.width + " " + this.baseZoom.height );
        animate.setAttribute("begin", "indefinite" );
        animate.setAttribute("repeatCount", 1);
        animate.setAttribute("restart", "always");
        animate.setAttribute("dur", this.duration);
        animate.setAttribute("fill", "freeze");

        this.svg.appendChild(animate);

        // TODO: hack to stop onselectstart from occuring... could be beter managed?
        document.onselectstart = function() { return false; };

        /* 
        * Note: 
        *  start pointer/mouse/touch events are on svg element, others are on the window
        *  allows panning when mouse cursor is off the svg element, needed for when 
        *  zoomed in
        */

        // if the browser supports pointer events
        if (window.PointerEvent) {
            this.svg.addEventListener('pointerdown', onPointerDown.bind(this)); // Pointer is pressed
            window.addEventListener('pointerup', onWindowPointerUp.bind(this)); // Releasing the pointer
            window.addEventListener('pointermove', onWindowPointerMove.bind(this));
        } else {
            // Add all mouse events listeners fallback
            this.svg.addEventListener('mousedown', onPointerDown.bind(this)); // Pressing the mouse
            window.addEventListener('mouseup', onWindowPointerUp.bind(this)); // Releasing the mouse
            window.addEventListener('mousemove', onWindowPointerMove.bind(this));

            // Add all touch events listeners fallback
            this.svg.addEventListener('touchstart', onPointerDown.bind(this)); // Finger is touching the screen
            window.addEventListener('touchend', onWindowPointerUp.bind(this)); // Finger is no longer touching the screen
            window.addEventListener('touchmove', onWindowPointerMove.bind(this)); // Finger is moving
        }

        /* 
        * TODO: add support for touch events equiv for mouse wheel
        * TODO: add support for double tap events
        * https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Using_Touch_Events
        */

        this.svg.addEventListener('wheel', onMouseWheel.bind(this)); // note 'mousewheel' is not supported by firefox
        this.svg.addEventListener('dblclick', onMouseDoubleClick.bind(this));
    }

    function publicSetZoomFactor(zoomFactor) {
        this.zoomFactor = zoomFactor;
    }

    // This function returns an object with X & Y values from the pointer event
    function getPointFromEvent(svg, event) {
        var point = svg.createSVGPoint();

        // If even is triggered by a touch event, we get the position of the first finger
        if (event.targetTouches) {
            point.x = event.targetTouches[0].clientX;
            point.y = event.targetTouches[0].clientY;
        } else {
            point.x = event.clientX;
            point.y = event.clientY;
        }
        
        return point.matrixTransform(svg.getScreenCTM().inverse());
    }

    function onWindowPointerUp(e) {
        this.isPointerDown = false;
    }

    // Function called by the event listeners when user start pressing/touching
    function onPointerDown(event) {
        if(event.button != MAIN_BUTTON) {
            // if not main button, ignore
            return;
        }

        this.isPointerDown = true; // We set the pointer as down
        
        // We get the pointer position on click/touchdown so we can get the value once the user starts to drag
        this.pointerOrigin = getPointFromEvent(this.svg, event);
    }

    function onWindowPointerMove(event) {
        // Only run this function if the pointer is down
        if (!this.isPointerDown) {
            return;
        }

        // This prevent user to do a selection on the page
        event.preventDefault();

        // Get the pointer position as an SVG Point
        let pointerPosition = getPointFromEvent(this.svg, event);

        // We don't need to take care of a ratio because this is handled in the getPointFromEvent function
        let animViewBox = this.svg.viewBox.animVal;

        let x = animViewBox.x - (pointerPosition.x - this.pointerOrigin.x);
        let y = animViewBox.y - (pointerPosition.y - this.pointerOrigin.y);

        // animate the adjustment, basically 0 so it's reponsive
        document.getElementById('animateZoom').endElement(); // bug with chrome, need to do this for now
        adjustViewBoxAnimated(this.svg, x, y, animViewBox.width, animViewBox.height, "1ms");
    }

    function onMouseWheel(event) {
        // stop normal events
        event.preventDefault();

        // Get the pointer position as an SVG Point
        let animViewBox = event.currentTarget.viewBox.animVal;

        // calculate the delta width and height based on the mouse offset/zoom factor
        let dw = animViewBox.width * Math.sign(event.deltaY) * this.zoomFactor;
        let dh = animViewBox.height * Math.sign(event.deltaY) * this.zoomFactor;

        // calc the delta x/y based on the mouse offset and the width/height offset
        let dx = dw * event.offsetX / event.currentTarget.clientWidth;
        let dy = dh * event.offsetY / event.currentTarget.clientHeight;

        // calc new viewbox dims
        let x = animViewBox.x - dx;
        let y = animViewBox.y - dy;
        let width = animViewBox.width + dw;
        let height = animViewBox.height + dh;

        // animate the adjustment, basically 0 so it's reponsive
        document.getElementById('animateZoom').endElement(); // bug with chrome, need to do this for now
        adjustViewBoxAnimated(this.svg, x, y, width, height, "1ms");
    }

    function onMouseDoubleClick(event) {
        // stop normal events
        event.preventDefault();

        /* 
        * TODO: defect with chrome (MacOS only?) - doesn't always animate when double clicking, 
        * when this happens, ending the element fixes it, but not sure how to detect when it is an issue.
        */

        // todo, this should behave more like the manual zoom... but then is it a fixed zoom or more like google maps, stepped zoom?

        var cursorPoint = getPointFromEvent(this.svg, event);
        var newX = cursorPoint.x - this.baseZoom.width / 2;
        var newY = cursorPoint.y - this.baseZoom.height / 2;

        // console.log("Zoom to: " + newX + ", " + newY + ", " + w + ", " + h);

        adjustViewBoxAnimated(this.svg, newX, newY, this.baseZoom.width, this.baseZoom.height, this.duration);
    }

    function adjustViewBoxAnimated(svg, x, y, width, height, time = "0.6s") {
        // use the animVal, not the baseVal, otherwise it's all screwy, not sure why it's not removing after completing animation
        let animViewBox = svg.viewBox.animVal;

        let oldSize = animViewBox.x + " " + animViewBox.y + " " + animViewBox.width + " " + animViewBox.height;
        let newSize = x + " " + y + " " + width + " " + height;

        var animateViewBoxElem = document.getElementById('animateZoom');

        // if(time == "0.6s") {
        //     // debug for double click, sometimes beginElement() does nothing on chrome, uncertain why
        //     // appears to be related to time, changing dur to 1ms stops the problem... maybe related to keysplines?
        //     console.log("values: " + oldSize + "; " + newSize);
        // }
        animateViewBoxElem.setAttribute("dur", time);
        animateViewBoxElem.setAttribute('values', oldSize + "; " + newSize);
        
        animateViewBoxElem.beginElement();
    }

    return {
        init: publicInit,
        setZoom: publicSetZoomFactor,
    }
})();
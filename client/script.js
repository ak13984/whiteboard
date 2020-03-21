const board = document.querySelector(".board");
board.height = window.innerHeight;
board.width = window.innerWidth;
const eraser = document.querySelector(".eraser");
const stickyNote = document.querySelector(".stickyNote");
let stickyPad = document.querySelector(".sticky-pad");
const topbar = stickyPad.querySelector(".top-bar");
const minimizesticky = stickyPad.querySelector(".Minimize");
const close = stickyPad.querySelector(".Close");
var offset = [0, 0];
const pencil = document.querySelector(".pencil");
const ctx = board.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
ctx.strokeStyle = "white";
ctx.lineWidth = 7;
const undo = document.querySelector(".undo");
const locArray = [];
const redoArray = [];
const tools = document.querySelector(".tools");
const redo = document.querySelector(".redo");
const slider = document.getElementsByClassName("font-size");
let isDrawing = false;
let isEraserdown = false;
let isStickyMoving = false;
const magnify = document.querySelector(".incsize");
var socket = io.connect('http://localhost:3000');

board.addEventListener("mousedown", function (e) {
    ctx.beginPath();
    if (!isEraserdown) {
        // ctx.strokeStyle="black";
    }
    const { x, y } = getLocation(e.clientX, e.clientY);

    var curr = { x: x, y: y, width: ctx.lineWidth, currcolor: ctx.strokeStyle, flag: "start" };
    socket.emit('draw',curr);    
    locArray.push(curr);
    ctx.moveTo(x, y);
    isDrawing = true;
});




board.addEventListener("mousemove", function (e) {
    if (!isDrawing && !isEraserdown) return;
    const { x, y } = getLocation(e.clientX, e.clientY);
    var curr = { x: x, y: y, width: ctx.lineWidth, currcolor: ctx.strokeStyle, flag: "moving" };

    ctx.lineTo(x, y);
    ctx.stroke();
    socket.emit('draw', curr);
    locArray.push(curr);
});

board.addEventListener("mouseup", function (e) {
    isDrawing = false;
    isEraserdown = false;
    const { x, y } = getLocation(e.clientX, e.clientY);
    var curr = { x: x, y: y, width: ctx.lineWidth, currcolor: ctx.strokeStyle, flag: "end" };
    socket.emit('draw',curr);
    ctx.closePath();
    return;
});

eraser.addEventListener("mousedown", function (e) {
    isEraserdown = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
    ctx.strokeStyle = ctx.fillStyle;

});


function getLocation(clientX, clientY) {
    const rect = board.getBoundingClientRect();
    return { x: clientX, y: clientY - rect.top };
}

stickyNote.addEventListener("click", function () {
    stickyPad.style.display = 'block';
    socket.emit('displaysticky',stickyPad.style.display);
});
socket.on('showsticky',function(style){
    stickyPad.style.display = style;
});

minimizesticky.addEventListener("click", function () {
    if (stickyPad.childNodes[3].style.display == 'none') {
        stickyPad.childNodes[3].style.display = 'block';
    } else {
        stickyPad.childNodes[3].style.display = 'none';
    }
});

close.addEventListener("click", function () {
    close.parentElement.parentElement.childNodes[3].value = "";
    close.parentElement.parentElement.style.display = 'none';
});
topbar.addEventListener("mousedown", function (e) {
    isStickyMoving = true;
    offset = [
        stickyPad.offsetLeft - e.clientX,
        stickyPad.offsetTop - e.clientY
    ];
});
stickyPad.addEventListener('mousemove', function (event) {
    if (!isStickyMoving) return;
    stickyPad.style.left = (event.clientX + offset[0]) + 'px';
    stickyPad.style.top = (event.clientY + offset[1]) + 'px';
    var coordinates = [event.clientX + offset[0],event.clientY + offset[1]];
    socket.emit('topbar',coordinates);
});
socket.on('movetopbar',function(coordinates){
    stickyPad.style.left = (coordinates[0]) + 'px';
    stickyPad.style.top = (coordinates[1]) + 'px';
});


topbar.addEventListener("mouseleave", function () {
    isStickyMoving = false;
});

pencil.addEventListener("click", function () {
    unset("pencil");
    if (!pencil.id) {
        pencil.setAttribute("id", "toolprop");
    } else if (pencil.children[1].style.display == "") {
        pencil.children[1].style.display = "block";
    } else {
        pencil.removeAttribute("id");
        pencil.children[1].style.display = "";
    }
});


eraser.addEventListener("click", function () {
    unset("eraser");
    if (!eraser.id) {
        eraser.setAttribute("id", "toolprop");
    } else if (eraser.children[1].style.display == "") {
        eraser.children[1].style.display = "block";
    } else {
        eraser.removeAttribute("id");
        eraser.children[1].style.display = "";
    }
});

function unset(tool) {
    let toolsChildren = tools.childNodes;
    for (var i = 1; i < toolsChildren.length; i += 2) {
        if (toolsChildren[i]!=undefined && toolsChildren[i].childNodes[1]!=undefined && (toolsChildren[i].childNodes[1]).classList.value != tool) {
            if (toolsChildren[i].childNodes[1].id) {
                toolsChildren[i].childNodes[1].removeAttribute("id");
                toolsChildren[i].childNodes[1].children[1].style.display = "";
            }
        }
    }
}

function colors(color) {
    ctx.strokeStyle = color;
    // socket.emit('colorchange', ctx.strokeStyle);
}

slider[0].addEventListener("change", function () {
    ctx.lineWidth = slider[0].value;
});



socket.on('drawforme', function (obj) {
    if (obj.flag == "start") {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineWidth = obj.width;
        ctx.strokeStyle = obj.currcolor;
    } else if (obj.flag == "moving") {
        ctx.lineWidth = obj.width;
        ctx.strokeStyle = obj.currcolor;
        ctx.lineTo(obj.x, obj.y);
        ctx.stroke();
    } else {
        ctx.closePath();
        isDrawing = false;
    }
});


undo.addEventListener("click", function () {
    ctx.clearRect(0, 0, board.width, board.height);
    if (locArray.length == 0) return;
    redoArray.push(locArray.pop());
    for (var i = 0; i < locArray.length; i++) {
        if (locArray[i].flag == "start") {
            ctx.strokeStyle = locArray[i].currcolor;
            ctx.lineWidth=locArray[i].width;
            ctx.beginPath();
            ctx.moveTo(locArray[i].x, locArray[i].y);
            socket.emit('undo',locArray[i]);
        } else if (locArray[i].flag == "moving") {
            ctx.strokeStyle = locArray[i].currcolor;
            ctx.lineWidth = locArray[i].width;
            ctx.lineTo(locArray[i].x, locArray[i].y);
            ctx.stroke();
            socket.emit('undo',locArray[i]);
        }
    }
});
socket.on('drawafterundo',function(obj){
    ctx.clearRect(0, 0, board.width, board.height);
    redoArray.push(obj);
    if (obj.flag == "start") {
            ctx.strokeStyle = obj.currcolor;
        ctx.lineWidth = obj.width;
            ctx.beginPath();
            ctx.moveTo(obj.x, obj.y);
        } else if (obj.flag == "moving") {
            ctx.strokeStyle = obj.currcolor;
            ctx.lineTo(obj.x, obj.y);
            ctx.stroke();
        }
});


redo.addEventListener("click", function () {
    if (redoArray.length == 0) return;

    ctx.clearRect(0, 0, board.width, board.height);
    var lastvisited = redoArray.pop();
    locArray.push(lastvisited);

    for (var i = 0; i < locArray.length; i++) {
        if (locArray[i].flag == "start") {
            ctx.strokeStyle = locArray[i].currcolor;
            ctx.lineWidth = locArray[i].width;
            ctx.beginPath();
            ctx.moveTo(locArray[i].x, locArray[i].y);
        } else if (locArray[i].flag == "moving") {
            ctx.strokeStyle = locArray[i].currcolor;
            ctx.lineWidth = locArray[i].width;
            ctx.lineTo(locArray[i].x, locArray[i].y);
            ctx.stroke();
        }
    }
    ctx.strokeStyle = lastvisited.currcolor;
    ctx.lineWidth = locArray[i].width;
    ctx.moveTo(lastvisited.x, lastvisited.y);
    ctx.stroke();
});

magnify.addEventListener('click',function(){

});

var clearButton = document.getElementById("doodle-bin");
var canvascontainer = document.getElementById("doodle-canvas-container");
var canvas = document.getElementById("doodle-canvas");
var context = canvas.getContext("2d");
var radius =
  (document.getElementById("doodle-canvas-container").clientWidth +
    document.getElementById("doodle-canvas-container").clientHeight) /
  150;
var dragging = false;
context.mozImageSmoothingEnabled = false;
context.imageSmoothingEnabled = false;

canvas.width = 1280;
canvas.height = 720;
canvas.style.width = "100%";
canvas.style.height = "100%";

/* CLEAR CANVAS */
function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

clearButton.addEventListener("click", clearCanvas);

function getMouesPosition(e) {
  var mouseX = ((e.offsetX * canvas.width) / canvas.clientWidth) | 0;
  var mouseY = ((e.offsetY * canvas.height) / canvas.clientHeight) | 0;
  return { x: mouseX, y: mouseY };
}

var putPoint = function (e) {
  if (dragging) {
    context.lineTo(getMouesPosition(e).x, getMouesPosition(e).y);
    context.lineWidth = radius * 2;
    context.stroke();
    context.beginPath();
    context.arc(
      getMouesPosition(e).x,
      getMouesPosition(e).y,
      radius,
      0,
      Math.PI * 2
    );
    context.fill();
    context.beginPath();
    context.moveTo(getMouesPosition(e).x, getMouesPosition(e).y);
  }
};

var engage = function (e) {
  dragging = true;
  putPoint(e);
};
var disengage = function () {
  dragging = false;
  context.beginPath();
};

canvas.addEventListener("mousedown", engage);
canvas.addEventListener("mousemove", putPoint);
canvas.addEventListener("mouseup", disengage);
document.addEventListener("mouseup", disengage);
canvas.addEventListener("contextmenu", disengage);

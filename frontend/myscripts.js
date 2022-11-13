import { io } from "socket.io-client";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const rectangle = document.querySelector(".rectangle");
const circle = document.querySelector(".circle");
const deleteBtn = document.querySelector(".delete");

const color_down_arrow = document.querySelector(".color_down_arrow");
const color_options = document.querySelector(".color_options");
const color_chosen = document.querySelector(".color_chosen");

// rectangles and cicles
canvas.width = 800;
canvas.height = 500;
canvas.style.border = "3px solid black";

let canvas_width = canvas.width;
let canvas_height = canvas.height;
let edge_size = 6;
let offset_x;
let offset_y;

const get_offset = function () {
  let canvas_offsets = canvas.getBoundingClientRect();
  offset_x = canvas_offsets.left;
  offset_y = canvas_offsets.top;
};

get_offset();
window.onscroll = function () {
  get_offset();
};
window.onresize = function () {
  get_offset();
};
canvas.onresize = function () {
  get_offset();
};

class Circle {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill("evenodd");
  }
  calculateDistance(x, y) {
    // Pythagorean Theorem
    const distance = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    if (distance < this.radius) {
      return true;
    }
  }
}

let shapes = [];
let is_dragging = false;
let top_right_resizing = false;
let top_left_resizing = false;
let bottom_right_resizing = false;
let bottom_left_resizing = false;
let startX;
let startY;
let is_selected = false;
let current_shapeId;
let current_shape;
let current_chosen_color = "black";

const socket = io("http://localhost:3000");
socket.on("connect", () => {
  console.log(socket.id);
});
socket.on("recieved-newShape", (newShape) => {
  shapes.push(newShape);
  draw_shapes();
});

const rainbowColors = [
  "Red",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "violet",
];

function new_colors() {
  color_options.innerHTML = "";
  rainbowColors.forEach((color) => {
    const color_options_color = document.createElement("div");
    color_options_color.classList.add("color_options_color");
    color_options_color.style.backgroundColor = color;
    color_options.appendChild(color_options_color);

    color_options_color.addEventListener("click", () => {
      color_chosen.style.backgroundColor = color;
      current_chosen_color = color;
    });
  });

  color_down_arrow.addEventListener("click", colorDownArrowFunc);
  function colorDownArrowFunc() {
    color_options.classList.toggle("hidden");
  }
}
new_colors();

color_chosen.addEventListener("click", () => {
  if (is_selected) {
    current_shape.data.color = current_chosen_color;

    socket.emit("new_current_shape_color", {
      newcolor: current_chosen_color,
      shapeId: current_shapeId,
    });
  }
});

socket.on("received_new_color", (data) => {
  let [current_shape_socket] = shapes.filter(
    (shape) => shape.shapeId === data.shapeId
  );
  current_shape_socket.data.color = data.newcolor;

  draw_shapes();
});

const randomColor = function () {
  const hex = "0123456789abcdef";
  const color = new Array(6)
    .fill("")
    .map(() => hex[Math.floor(Math.random() * hex.length)])
    .join("");
  return `#${color}`;
};

rectangle.onpointerdown = function () {
  const color = randomColor();
  const shapeId = Date.now();

  shapes.push({
    shapeId: shapeId,
    angle: "rectangle",
    data: {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      color: color,
    },
  });
  socket.emit("new-shape", {
    shapeId: shapeId,
    angle: "rectangle",
    data: {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      color: color,
    },
  });
  draw_shapes();
};

circle.onpointerdown = function () {
  const color = randomColor();
  const shapeId = Date.now();

  shapes.push({
    shapeId: shapeId,
    angle: "circle",
    data: {
      x: 50,
      y: 50,
      radius: 50,
      color: color,
    },
  });

  socket.emit("new-shape", {
    shapeId: shapeId,
    angle: "circle",
    data: {
      x: 50,
      y: 50,
      radius: 50,
      color: color,
    },
  });
  draw_shapes();
};

deleteBtn.onpointerdown = function () {
  if (is_selected) {
    const index = shapes.indexOf(current_shape);
    if (index > -1) {
      is_selected = false;
      const [delete_shape] = shapes.splice(index, 1);
      socket.emit("delete_shape", delete_shape);
    }
    draw_shapes();
  }
};

const is_mouse_in_shape = function (x, y, shape) {
  let shape_left = shape.x;
  let shape_right = shape.x + shape.width;
  let shape_top = shape.y;
  let shape_bottom = shape.y + shape.height;

  if (x > shape_left && x < shape_right && y > shape_top && y < shape_bottom) {
    return true;
  }
  return false;
};

const top_right_edge = function (x, y, shape) {
  let shape_left = shape.x + shape.width;
  let shape_right = shape_left + edge_size;
  let shape_top = shape.y;
  let shape_bottom = shape_top - edge_size;

  if (x > shape_left && x < shape_right && y < shape_top && y > shape_bottom) {
    top_right_resizing = true;
    return true;
  }
  return false;
};
const top_left_edge = function (x, y, shape) {
  let shape_left = shape.x;
  let shape_right = shape_left - edge_size;
  let shape_top = shape.y;
  let shape_bottom = shape_top - edge_size;

  if (x < shape_left && x > shape_right && y < shape_top && y > shape_bottom) {
    return true;
  }
  return false;
};
const bottom_right_edge = function (x, y, shape) {
  let shape_left = shape.x + shape.width;
  let shape_right = shape_left + edge_size;
  let shape_top = shape.y + shape.height;
  let shape_bottom = shape_top + edge_size;

  if (x > shape_left && x < shape_right && y > shape_top && y < shape_bottom) {
    return true;
  }
  return false;
};
const bottom_left_edge = function (x, y, shape) {
  let shape_left = shape.x;
  let shape_right = shape_left - edge_size;
  let shape_top = shape.y + shape.height;
  let shape_bottom = shape_top + edge_size;

  if (x < shape_left && x > shape_right && y > shape_top && y < shape_bottom) {
    return true;
  }
  return false;
};

const mouse_down = function (e) {
  e.preventDefault();
  is_selected = false;

  startX = parseInt(e.offsetX);
  startY = parseInt(e.offsetY);

  for (let shape of shapes) {
    if (shape.angle === "rectangle") {
      if (is_mouse_in_shape(startX, startY, shape.data)) {
        current_shapeId = shape.shapeId;
        current_shape = shapes.filter(
          (shape) => shape.shapeId === current_shapeId
        )[0];
        is_selected = true;
        is_dragging = true;
        return;
      }
    }
    if (shape.angle === "circle") {
      if (
        new Circle(
          shape.data.x,
          shape.data.y,
          shape.data.radius,
          shape.data.color
        ).calculateDistance(startX, startY)
      ) {
        current_shapeId = shape.shapeId;
        current_shape = shapes.filter(
          (shape) => shape.shapeId === current_shapeId
        )[0];
        is_dragging = true;
        is_selected = true;
      }
    }
  }

  if (current_shapeId) {
    if (top_right_edge(startX, startY, current_shape.data)) {
      top_right_resizing = true;
      is_selected = true;
    }
    if (top_left_edge(startX, startY, current_shape.data)) {
      top_left_resizing = true;
      is_selected = true;
    }
    if (bottom_right_edge(startX, startY, current_shape.data)) {
      bottom_right_resizing = true;
      is_selected = true;
    }
    if (bottom_left_edge(startX, startY, current_shape.data)) {
      bottom_left_resizing = true;
      is_selected = true;
    }
  }
  return;
};

const mouse_up = function (e) {
  if (is_dragging) {
    e.preventDefault();
    is_dragging = false;
  }

  if (top_right_resizing) {
    e.preventDefault();
    top_right_resizing = false;
  }

  if (top_left_resizing) {
    e.preventDefault();
    top_left_resizing = false;
  }
  if (bottom_right_resizing) {
    e.preventDefault();
    bottom_right_resizing = false;
  }
  if (bottom_left_resizing) {
    e.preventDefault();
    bottom_left_resizing = false;
  }
  return;
};

const mouse_out = function (e) {
  if (is_dragging) {
    e.preventDefault();
    is_dragging = false;
  }

  if (top_right_resizing) {
    e.preventDefault();
    top_right_resizing = false;
  }

  if (top_left_resizing) {
    e.preventDefault();
    top_left_resizing = false;
  }
  if (bottom_right_resizing) {
    e.preventDefault();
    bottom_right_resizing = false;
  }
  if (bottom_left_resizing) {
    e.preventDefault();
    bottom_left_resizing = false;
  }
  return;
};

socket.on("received_drag_n_resize", socket_draw_dragging);
socket.on("received_delete_shape", socket_delete_shape);

function socket_delete_shape(data) {
  const [current_shape_socket] = shapes.filter(
    (shape) => shape.shapeId === data.shapeId
  );

  const index = shapes.indexOf(current_shape_socket);
  console.log(index);
  if (index > -1) {
    shapes.splice(index, 1);
  }
  draw_shapes();
}

function socket_draw_dragging(data) {
  const [current_shape_socket] = shapes.filter(
    (shape) => shape.shapeId === data.shapeId
  );

  if (current_shape_socket === undefined) return;

  if (data.transform === "dragging") {
    current_shape_socket.data.x += data.x;
    current_shape_socket.data.y += data.y;
  }

  if (data.transform === "top_right_resizing") {
    current_shape_socket.data.width += data.x;
    current_shape_socket.data.y += data.y;
    current_shape_socket.data.height -= data.y;
  }
  if (data.transform === "top_left_resizing") {
    current_shape_socket.data.width -= data.x;
    current_shape_socket.data.y += data.y;
    current_shape_socket.data.height -= data.y;
    current_shape_socket.data.x += data.x;
  }

  if (data.transform === "bottom_right_resizing") {
    current_shape_socket.data.width += data.x;
    current_shape_socket.data.height += data.y;
  }
  if (data.transform === "bottom_left_resizing") {
    current_shape_socket.data.width -= data.x;
    current_shape_socket.data.x += data.x;
    current_shape_socket.data.height += data.y;
  }

  draw_shapes();
}

const mouse_move = function (e) {
  e.preventDefault();

  let mouseX = parseInt(e.offsetX);
  let mouseY = parseInt(e.offsetY);
  let dx = mouseX - startX;
  let dy = mouseY - startY;

  draw_shapes();

  if (is_dragging) {
    current_shape.data.x += dx;
    current_shape.data.y += dy;

    socket.emit("shape_drag_n_resize", {
      transform: "dragging",
      shapeId: current_shape.shapeId,
      x: dx,
      y: dy,
    });
  }

  if (top_right_resizing) {
    current_shape.data.width += dx;
    current_shape.data.y += dy;
    current_shape.data.height -= dy;

    socket.emit("shape_drag_n_resize", {
      transform: "top_right_resizing",
      shapeId: current_shape.shapeId,
      x: dx,
      y: dy,
    });
  }

  if (top_left_resizing) {
    current_shape.data.width -= dx;
    current_shape.data.y += dy;
    current_shape.data.height -= dy;
    current_shape.data.x += dx;

    socket.emit("shape_drag_n_resize", {
      transform: "top_left_resizing",
      shapeId: current_shape.shapeId,
      x: dx,
      y: dy,
    });
  }
  if (bottom_right_resizing) {
    current_shape.data.width += dx;
    current_shape.data.height += dy;

    socket.emit("shape_drag_n_resize", {
      transform: "bottom_right_resizing",
      shapeId: current_shape.shapeId,
      x: dx,
      y: dy,
    });
  }
  if (bottom_left_resizing) {
    current_shape.data.width -= dx;
    current_shape.data.x += dx;
    current_shape.data.height += dy;

    socket.emit("shape_drag_n_resize", {
      transform: "bottom_left_resizing",
      shapeId: current_shape.shapeId,
      x: dx,
      y: dy,
    });
  }
  startX = mouseX;
  startY = mouseY;
  return;
};

canvas.onpointerdown = mouse_down;
canvas.onpointerup = mouse_up;
canvas.onpointerout = mouse_out;
canvas.onpointermove = mouse_move;

function draw_shapes() {
  ctx.clearRect(0, 0, canvas_width, canvas_height);
  for (let shape of shapes) {
    if (shape.angle === "rectangle") {
      ctx.fillStyle = shape.data.color;
      ctx.fillRect(
        shape.data.x,
        shape.data.y,
        shape.data.width,
        shape.data.height
      );
    }
    if (shape.angle === "circle") {
      const newShape = new Circle(
        shape.data.x,
        shape.data.y,
        shape.data.radius,
        shape.data.color
      );
      newShape.draw();
    }

    if (is_selected) {
      ctx.fillStyle = "teal";
      ctx.fillRect(
        current_shape.data.x,
        current_shape.data.y,
        -edge_size,
        -edge_size
      );
      ctx.fillRect(
        current_shape.data.x + current_shape.data.width,
        current_shape.data.y,
        edge_size,
        -edge_size
      );
      ctx.fillRect(
        current_shape.data.x,
        current_shape.data.y + current_shape.data.height,
        -edge_size,
        edge_size
      );
      ctx.fillRect(
        current_shape.data.x + current_shape.data.width,
        current_shape.data.y + current_shape.data.height,
        edge_size,
        edge_size
      );
    }
  }
}

// color

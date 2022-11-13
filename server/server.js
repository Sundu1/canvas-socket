const Server = require("socket.io");
const io = Server(3000, {
  cors: {
    origin: ["http://localhost:1234"],
  },
});

io.on("connection", (socket) => {
  socket.on("new-shape", (newShape) => {
    console.log(newShape);
    socket.broadcast.emit("recieved-newShape", newShape);
  });
  socket.on("shape_drag_n_resize", (data) => {
    socket.broadcast.emit("received_drag_n_resize", data);
  });
  socket.on("delete_shape", (data) =>
    socket.broadcast.emit("received_delete_shape", data)
  );
  socket.on("new_current_shape_color", (data) => {
    socket.broadcast.emit("received_new_color", data);
  });
});

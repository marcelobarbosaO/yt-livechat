$(function () {
  const socket = io("https://cnt-lives.herokuapp.com/");
  socket.on("connection", (socket) => {
    console.log(socket.handshake.query); // prints { x: "42", EIO: "4", transport: "polling" }
  });

  socket.on("message_selected_by_host", (object) => {
    console.log("MSG:: ",object);
  });
});

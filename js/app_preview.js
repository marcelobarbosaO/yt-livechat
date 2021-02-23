$(function () {
  const socket = io("https://cnt-lives.herokuapp.com/");
  socket.on("connection", (socket) => {
    console.log('CONNECTED', socket); // prints { x: "42", EIO: "4", transport: "polling" }
  });

  socket.on("message_selected_by_host", (object) => {
    if (object) {
      var id = object.id;
      var channel = object.authorDetails;
      var message = object.snippet.displayMessage;

      var html = [
        '<li data-id="' + id + '">',
        '<img src="' + channel.profileImageUrl + '"/>',
        '<div>',
        '<h4>' + channel.displayName + '</h4>',
        '<p>' + message + '</p>',
        '</div>',
        '</li>'
      ];
      $('#comments .messages ul').html(html.join(''));
    } else {
      $('#comments .messages ul').html('<li><span>Selecione uma mensagem abaixo pra ficar em destaque</span></li>');
    }
  });
});

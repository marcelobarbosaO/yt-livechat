$(function () {
  const socket = io("https://cnt-lives.herokuapp.com/");
  socket.on("connection", (socket) => {
    console.log(socket.handshake.query); // prints { x: "42", EIO: "4", transport: "polling" }
  });

  var allMessages = [];
  var selectedItemIndex = null;
  var apikey = 'AIzaSyDPqQmiTFpu8lwC7T7nJwEJduk-X-bO0bc';
  var clientID = '1071083884583-n46pbsol5s9q215o52h45tr7o1lih2kj.apps.googleusercontent.com';
  var clientSecret = 'N5M5FRj4--9_qKx0-04b1B5u';
  var accessToken = null;

  var YT_API = {
    lives: 'https://www.googleapis.com/youtube/v3/liveBroadcasts',
    messages: 'https://youtube.googleapis.com/youtube/v3/liveChat/messages',
    validateToken: 'https://www.googleapis.com/oauth2/v1/tokeninfo',
    refreshToken: 'https://accounts.google.com/o/oauth2/token',
  }

  function refreshToken() {
    var obj = {
      client_id: clientID,
      client_secret: clientSecret,
      refresh_token: accessToken,
      grant_type: "refresh_token"
    }

    $.ajax({
      url: YT_API.refreshToken,
      data: obj,
      type: 'post',
      dataType: 'json',
      success: function (data) {
        if (data.access_token === "online") {
          accessToken = data.access_token;
          openTab(actions);
        }
      },
      error: function (err) {
        console.log(err);
        alert('erro refresh');
      }
    })
  }

  function validateToken(actions) {
    $.ajax({
      url: YT_API.validateToken,
      data: { "access_token": accessToken },
      type: 'get',
      dataType: 'json',
      success: function (data) {
        if (data.access_type === "online") {
          openTab(actions);
        } else {
          refreshToken(actions);
        }
      },
      error: function (err) {
        console.log(err);
        alert('erro validate');
      }
    })
  }

  function openTab(actions) {
    $('.boxes').addClass('hide');

    if (actions.action === 'find_video') $('#get_live_id').removeClass('hide');
    if (actions.action === 'show_comments') $('#comments').removeClass('hide');
    if (actions.action === 'sign_in') $('#googleSignIn').removeClass('hide');
  }

  function getLives(actions) {
    var videoId = $('input[name="live_id"]').val();

    if (videoId !== "") {
      $.ajax({
        url: YT_API.lives,
        data: { "key": apikey, id: videoId, part: 'snippet,contentDetails,status' },
        type: 'get',
        dataType: 'json',
        beforeSend: function (xhr) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
        success: function (data) {
          if (data.items.length > 0) {
            if (actions.redirect) {
              var url = window.location.href;

              window.location.href = url + '&videoId=' + videoId;

              location.reload();
            } else {
              var liveId = data.items[0].snippet.liveChatId;

              $('a#getNewMessages').attr('data-live-id', liveId);

              getComments(liveId);
            }
          }
        },
        error: function (err) {
          console.log(err);
          alert('erro ao pegar os dados desse vídeo, veja se o ID está certo.');
        }
      })
    } else {
      alert('Digite o id do video antes de continuar');
    }
  }

  function getComments(liveId) {
    $.ajax({
      url: YT_API.messages,
      data: {
        "key": apikey,
        liveChatId: liveId,
        part: 'snippet,authorDetails',
        maxResults: 200
      },
      type: 'get',
      dataType: 'json',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      },
      success: function (data) {
        $('#comments').removeClass('hide');
        $('#get_live_id').addClass('hide');

        //$('.carrossel ul').html('');

        if (data.items.length > 0) {
          var liQuantity = $('#comments .messages li').length;
          if (data.items.length > liQuantity) {
            $('#comments .messages ul').html('');

            var items = data.items.reverse();
            allMessages = items;

            for (var key in items) {
              var id = items[key].id;
              var channel = items[key].authorDetails;
              var message = items[key].snippet.displayMessage;
              var className = selectedItemIndex === id ? 'activated' : '';

              var html = [
                '<li data-id="' + id + '" class="' + className + '">',
                '<img src="' + channel.profileImageUrl + '"/>',
                '<div>',
                '<h4>' + channel.displayName + '</h4>',
                '<p>' + message + '</p>',
                '</div>',
                '</li>'
              ];
              $('#comments .messages ul').append(html.join(''));
            }
          }
        } else {
          $('#comments .messages ul').html('<li><p>Nenhuma mensagem encontrada ainda.</p></li>');
        }

        setTimeout(function () {
          getComments(liveId);
        }, 5000);
      },
      error: function (err) {
        console.log(err);
        alert('erro mensagens');
      }
    })
  }

  $(document).on('click', '#comments .messages li', function () {
    $('#comments .messages li').removeClass('activated');

    var $li = $(this);
    $li.addClass('activated');

    selectedItemIndex = $li.attr('data-id');

    var objectMessage = allMessages.find(function(item){ return item.id === selectedItemIndex });

    if ( objectMessage !== undefined ) {
      console.log("MANDAR MENSAGEM AQUI", objectMessage);
      socket.emit('selected_message', objectMessage);
      var cloneElement = $li.clone();

      $('.message_active ul').html(cloneElement);
    }
  });

  $('a#find_live_id').on('click', function () {
    getLives({ redirect: true });
  });

  $('a#google').on('click', function () {
    var url = 'https://marcelobarbosao.github.io/yt-livechat/index.html';

    location.href = 'https://accounts.google.com/o/oauth2/auth?client_id=' + clientID + '&redirect_uri=' + url + '&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=token';
  });

  $('a#getNewMessages').on('click', function () {
    var liveId = $(this).attr('data-live-id');

    getComments(liveId);
  });

  $('a#changeVideo').on('click', function () {
    $('#comments').addClass('hide');
    $('#get_live_id').removeClass('hide');
  });

  if (accessToken === null) {
    var hash = window.location.hash;
    if (hash !== "") {
      var items = hash.split('&');

      accessToken = items.shift().split('=').pop();

      var lastItemHash = items.pop().split('=');
      if (lastItemHash.shift() === 'videoId') {
        $('input[name="live_id"]').val(lastItemHash.pop());
        openTab({ action: 'show_comments' });
        getLives({ redirect: false });
      } else {
        validateToken({ action: 'find_video' });
      }
    } else {
      $('#googleSignIn').removeClass('hide');
    }
  } else {
    validateToken({ action: 'find_video' });
  }
});

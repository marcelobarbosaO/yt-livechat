$(function () {
  const socket = io("https://cnt-lives.herokuapp.com/");
  socket.on("connection", (socket) => {
    console.log(socket.handshake.query); // prints { x: "42", EIO: "4", transport: "polling" }
  });

  var allMessages = [];
  var selectedItemIndex = null;
  var liveChatId = null;
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

  function refreshToken(actions) {
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
        if( err.status === 400 ){
          liveChatId = null;

          openTab({ action: 'sign_in' });

          alert('Seu token expirou');
        } else {
          alert('Houve um erro ao validar o token');
        }
      }
    })
  }

  function openTab(actions) {
    $('.boxes').addClass('hide');

    if (actions.action === 'find_video') {
      $('#get_live_id').removeClass('hide');

      $.ajax({
        url: YT_API.lives,
        data: { "key": apikey, part: 'snippet,contentDetails,status', broadcastStatus: 'all' },
        type: 'get',
        dataType: 'json',
        beforeSend: function (xhr) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
        success: function (data) {
          const lives = data.items;

          var htmlLives = "";

          if (lives.length > 0) {
            for (var key in lives) {
              const live = lives[key].snippet;

              const title = live.title;
              const thumbnail = live.thumbnails.high;
              const scheduleDate = live.scheduledStartTime;
              const liveChatId = live.liveChatId;

              const html = [
                '<li data-chat-id="' + liveChatId + '" data-live-id="' + lives[key].id + '">',
                '<div class="img"><img src="' + thumbnail.url + '" /></div>',
                '<div class="text">',
                '<h5>' + title + '</h5>',
                '</div>',
                '</li>'
              ].join('');

              htmlLives += html;
            }

            $('#list-lives').html(htmlLives);
          } else {
            alert('Nenhuma live encontrada');
          }
        },
        error: function (err) {
          if( err.status === 401) {
            liveChatId = null;

            openTab({ action: 'sign_in' });

            alert('Seu token expirou. Faça login novamente');
          } else {
            alert('Houve um erro ao obter a lista de lives da sua conta.');
          }
        }
      });
    }
    if (actions.action === 'show_comments') $('#comments').removeClass('hide');
    if (actions.action === 'sign_in') $('#googleSignIn').removeClass('hide');
  }

  function getComments() {
    $.ajax({
      url: YT_API.messages,
      data: {
        "key": apikey,
        liveChatId: liveChatId,
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
      },
      error: function (err) {
        console.log(err);
        if( err.status === 403 ){
          alert('O chat dessa live não está ativo. Esta live já começou?');
        } else if( err.status === 401) {
          liveChatId = null;

          openTab({ action: 'sign_in' });

          alert('Seu token expirou. Faça login novamente');
        } else {
          alert('Houve um erro ao trazer as mensagens');
        }
      }
    });
  }

  $(document).on('click', '#comments .messages li', function () {
    $('#comments .messages li').removeClass('activated');

    var $li = $(this);
    $li.addClass('activated');

    selectedItemIndex = $li.attr('data-id');

    var objectMessage = allMessages.find(function (item) { return item.id === selectedItemIndex });

    if (objectMessage !== undefined) socket.emit('selected_message', objectMessage);
  });

  $(document).on('click', '#list-lives li', function () {
    var chatId = $(this).attr('data-chat-id');
    var liveId = $(this).attr('data-live-id');

    if (chatId) {
      var url = window.location.href;

      window.location.href = url + '?liveId=' + liveId + '&chatId=' + chatId;

      location.reload();
    }
  })

  $('a#back-to-lives').on('click', function () {
    liveChatId = null;

    var urlHash = window.location.hash.split('?').shift();

    window.location.href = urlHash;

    location.reload();
  });

  $('a#refresh-messages').on('click', function () {
    getComments();
  });

  $('a#google').on('click', function () {
    var url = 'https://marcelobarbosao.github.io/yt-livechat/index.html';

    location.href = 'https://accounts.google.com/o/oauth2/auth?client_id=' + clientID + '&redirect_uri=' + url + '&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=token';
  });

  if (accessToken === null) {
    var urlHash = window.location.hash;

    if (urlHash !== "") {
      var allParams = urlHash.split('#').pop().split('?');

      if (allParams.length > 1) {
        var accessToken = allParams.shift().split('&').shift().split('=').pop();
        var params = allParams.pop().split('&');

        var live = params.shift().split('=');
        var chat = params.pop().split('=');

        if (live.shift() === 'liveId' && chat.shift() === 'chatId') {
          openTab({ action: 'show_comments' });

          liveChatId = chat.pop();

          getComments();
        } else {
          validateToken({ action: 'find_video' });
        }
      } else {
        accessToken = urlHash.split('&').shift().split('=').pop();

        validateToken({ action: 'find_video' });
      }
    } else {
      $('#googleSignIn').removeClass('hide');
    }
  } else {
    validateToken({ action: 'find_video' });
  }
});

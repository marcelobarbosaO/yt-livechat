$(function () {
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
    $('.container').addClass('hide');

    if (actions.action === 'find_video') $('#get_live_id').removeClass('hide');
    if (actions.action === 'show_comments') $('#comments').removeClass('hide');
    if (actions.action === 'sign_in') $('#googleSignIn').removeClass('hide');
  }

  function getLives() {
    var videoId = $('input[name="live_id"]').val();

    $.ajax({
      url: YT_API.lives,
      data: { "key": apikey, id: videoId, part: 'snippet,contentDetails,status' },
      type: 'get',
      dataType: 'json',
      beforeSend: function(xhr){
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      },
      success: function (data) {
        if (data.items.length > 0) {
          var liveId = data.items[0].snippet.liveChatId;

          $('button#getNewMessages').attr('data-live-id', liveId);

          getComments(liveId);
        }
      },
      error: function (err) {
        console.log(err);
        alert('erro lives');
      }
    })
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
      beforeSend: function(xhr){
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      },
      success: function (data) {
        $('#comments').removeClass('hide');
        $('#get_live_id').addClass('hide');
        $('.messages ul').html('');
        $('.carrossel ul').html('');

        if (data.items.length > 0) {
          var messages = data.items.reverse();

          messages.forEach(function (val, index) {
            var channel = val.authorDetails;
            var message = val.snippet.displayMessage;
            var html = [
              '<li>',
                '<img src="' + channel.profileImageUrl + '"/>',
                '<div>',
                  '<h4>' + channel.displayName + '</h4>',
                  '<p>' + message + '</p>',
                '</div>',
              '</li>'
            ];
            $('.messages ul').append(html.join(''));
            $('.carrossel ul').append(html.join(''));
          });
        } else {
          $('.messages ul').html('<li><p>Nenhuma mensagem encontrada ainda.</p></li>');
        }
      },
      error: function (err) {
        console.log(err);
        alert('erro mensagens');
      }
    })
  }

  $('button#find_live_id').on('click', function () {
    getLives();
  });

  $('button#google').on('click', function () {
    var url = 'https://marcelobarbosao.github.io/yt-livechat/index.html';

    location.href = 'https://accounts.google.com/o/oauth2/auth?client_id='+ clientID +'&redirect_uri='+ url +'&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=token';
  });

  $('button#getNewMessages').on('click', function () {
    var liveId = $(this).attr('data-live-id');

    getComments(liveId);
  });

  $('button#changeVideo').on('click', function () {
    $('#comments').addClass('hide');
    $('#get_live_id').removeClass('hide');
  });

  if (accessToken === null) {
    var hash = window.location.hash;
    if( hash !== "") {
      accessToken = hash.split('&').shift().split('=').pop();

      validateToken({ action: 'find_video' });
    } else {
      $('#googleSignIn').removeClass('hide');
    }
  } else {
    validateToken({ action: 'find_video' });
  }
});

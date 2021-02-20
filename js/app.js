$(function () {
  function authenticate() {
    return gapi.auth2.getAuthInstance()
      .signIn({ scope: "https://www.googleapis.com/auth/youtube.readonly" })
      .then(function () { console.log("Sign-in successful"); },
        function (err) { console.error("Error signing in", err); });
  }

  function loadClient() {
    gapi.client.setApiKey("AIzaSyDPqQmiTFpu8lwC7T7nJwEJduk-X-bO0bc");

    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
      .then(function () {
        getLives();
      }, function (err) { console.error("Error loading GAPI client for API", err); });
  }

  function getLives() {
    var videoId = $('input[name="live_id"]').val();

    return gapi.client.youtube.liveBroadcasts.list({
      "part": [
        "snippet,contentDetails,status"
      ],
      "id": [videoId]
    }).then(function (response) {
      var lives = response.result.items;

      if (lives.length > 0) {
        var liveId = lives[0].snippet.liveChatId;
        getComments(liveId);
      }
    }, function (err) { console.error("Execute error", err); });
  }

  function getComments(liveId) {
    return gapi.client.youtube.liveChatMessages.list({
      "part": [
        "snippet,authorDetails"
      ],
      "liveChatId": liveId,
      "maxResults": 10
    }).then(function (response) {
      var messages = response.result.items;

      $('#getNewMessages').attr('data-live-id', liveId);

      $('#comments').removeClass('hide');
      $('#get_live_id').addClass('hide');
      $('.messages ul').html('');

      console.log("MENSAGENS:: ", messages);

      if ( messages.length > 0 ) {
        messages.forEach(function(val, index){
          var channel = val.authorDetails;
          var message = val.snippet.displayMessage;
          var html = [
            '<li>',
              '<img src="'+ channel.profileImageUrl + '"/>',
              '<div>',
                '<h4>' + channel.displayName + '</h4>',
                '<p>' + message + '</p>',
              '</div>',
            '</li>'
          ];
          $('.messages ul').append( html.join(''));
        });
      }
    }, function (err) { console.error("Execute error", err); });
  }

  function execute() {
    authenticate().then(loadClient);
  }

  gapi.load("client:auth2", function () {
    auth2 = gapi.auth2.init({
      client_id: "1071083884583-n46pbsol5s9q215o52h45tr7o1lih2kj.apps.googleusercontent.com"
    });
  });

  $('button').on('click', function () {
    execute();
  });

  $('button#getNewMessages').on('click', function () {
    var liveId = $(this).attr('data-live-id');

    getComments(liveId);
  });

  $('button#changeVideo').on('click', function () {
    $('#comments').addClass('hide');
    $('#get_live_id').removeClass('hide');
  });
});

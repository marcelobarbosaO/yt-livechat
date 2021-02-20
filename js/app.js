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
      .then(function () { console.log("GAPI client loaded for API"); },
        function (err) { console.error("Error loading GAPI client for API", err); });
  }

  function execute() {

    authenticate().then(loadClient);

    var videoId = $('input[name="live_id"]').val();

    return gapi.client.youtube.liveBroadcasts.list({
      "part": [
        "snippet,contentDetails,status"
      ],
      "id": [ videoId ]
    }).then(function (response) {
        console.log("Response", response);
    }, function (err) { console.error("Execute error", err); });
  }

  gapi.load("client:auth2", function () {
    gapi.auth2.init({
      client_id: "1071083884583-n46pbsol5s9q215o52h45tr7o1lih2kj.apps.googleusercontent.com"
    });
  });
});

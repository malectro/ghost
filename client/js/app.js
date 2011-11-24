var Game = {};

(function () {
  
Game.SERVER_URL = 'http://127.0.0.1:1337';

Game.Credentials = (function () {

  var me = {},
           _userId,
           _username,
           _error;

  me.getUserId = function () {
    return _userId;
  };

  me.getUsername = function () {
    return _username;
  };

  me.getError = function () {
    return _error;
  };

  me.checkCredentials = function () {
    _userId = window.localStorage.getItem('userId');
    _username = window.localStorage.getItem('username');
    
    // If there's not a user ID, only show create/login options.
    if(!_userId) {
      $('.with-profile').hide();
      $('.without-profile').show();
    } else {
      // If there is a user ID, show gameplay options.
      $('.with-profile').show();
      $('.without-profile').hide();
      // Personalize the page w/ the username.
      $('#username').text(_username);
    }
  };

  me.setCredentials = function (response) {
    $('.error').hide();
    
    if (response.e === 0) {
      if (response.userId) {
        window.localStorage.setItem('userId', response.userId);
        window.localStorage.setItem('username', response.username);
      } else {
        window.localStorage.removeItem('userId');
        window.localStorage.removeItem('username');
      }
      
      window.location = '#foo';
      this.checkCredentials();
    } else {
      // If there's a server-side error, show it.
      _error = response.msg;
      $('#' + response.request + '-error').text(_error).show();
    }
  };

  me.logout = function () {
    // Clear out previous user's info
    me.setCredentials({e:0});
    Game.User.setUser(null);
    
    $('#username').text('bro');
    $('#profile-username').text('');
    $('#profile-email').text('');
    $('#profile-phone').text('');
    $('input:text').val('');
    
    window.location = '#foo';
  };

  return me;
  
}());


Game.User = (function () {

  var me = {},
      _user,
      _error;

  me.getUser = function () {
    return _user;
  };

  me.setUser = function (userObject) {
    _user = userObject;
  };

  me.userResponseHandler = function (response) {
    if (response.e === 0) {
      this.setUser(response.user);
      this.viewProfile();
    } else {
      _error = response.msg;
      $('.error').hide();
      $('#' + response.request + '-error').text(_error).show();
    }
  };

  me.viewProfile = function () {
    if(_user) {
      $('#profile-username').text(_user.username);
      $('#profile-email').text('Email: ' + _user.email);
      $('#profile-phone').text('Phone: ' + _user.phone);
    } else {
      Game.Ajax.getUserInfo();
    }
  };

  return me;

}());


Game.Ajax = (function () {

  var me = {},
      _user;

  me.create = function (formData) {
    console.log('create');
    $.ajax({
      type: "GET",
      dataType: "jsonp",
      jsonpCallback: "Game.Credentials.setCredentials",
      url: Game.SERVER_URL + "/user/create",
      data: formData,
    });
  };
    
  me.login = function (formData) {
    console.log('login');
    $.ajax({
      type: "GET",
      dataType: "jsonp",
      jsonpCallback: "Game.Credentials.setCredentials",
      url: Game.SERVER_URL + "/user/authenticate",
      data: formData,
    });
  };

  me.getUserInfo = function () {
    console.log('getuserinfo');
    $.ajax({
      type: "GET",
      dataType: "jsonp",
      jsonpCallback: "Game.User.userResponseHandler",
      url: Game.SERVER_URL + "/user/retrieve",
      data: {_id: Game.Credentials.getUserId()},
    });
  };

  me.setupEvents = function () {
    // Set up submit handler for creation form
    $('#register-form').submit(function () {
      Game.Ajax.create($(this).serialize());
      return false;
    });
    
    // Set up submit handler for login form
    $('#login-form').submit(function () {
      Game.Ajax.login($(this).serialize());
      return false;
    });  
  
      // Set up page handler for Profile page display
    $('#profile').live('pageshow', function (event){
      Game.User.viewProfile();
    });
  
      // Set up click handler for logout button
    $('#logout').click(function () {
      Game.Credentials.logout();
    });
  };

  return me;

}());

$(function () {

  Game.Ajax.setupEvents();
  Game.Credentials.checkCredentials();
  
});

}());
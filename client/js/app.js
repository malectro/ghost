var Ghost = {};

(function () {
  
Ghost.SERVER_URL = 'http://127.0.0.1:1337';

/**
 * Ghost.Credentials
 * The object that handles the user's credentials during login and logout.
 */
Ghost.Credentials = (function () {

  var me = {},
           _userId;

  me.getUserId = function () {
    return _userId;
  };

  me.checkCredentials = function () {
    _userId = window.localStorage.getItem('userId');
    
    // If there's not a user ID, only show create/login options.
    if(!_userId) {
      Ghost.UI.Login.show();
    } else {
      // If there is a user ID, show gameplay options and personalize page.
      Ghost.UI.Login.hide();
      Ghost.User.getProfileInfo();
    }
  };

  me.setCredentials = function (response) {
    
    if (response.e === 0) {
      if (response.userId) {
        window.localStorage.setItem('userId', response.userId);
      }
      window.location = '#foo';
      me.checkCredentials();
    } else {
      // If there's a server-side error, show it.
      Ghost.UI.Login.showError(response);
    }
  };
  
  var clearCredentials = function () {
    window.localStorage.removeItem('userId');
  };

  me.logout = function () {
    // Clear out previous user's info
    clearCredentials();
    Ghost.User.setUser(null);
    Ghost.UI.Logout.clearProfileInfo();
    window.location = '#foo';
    me.checkCredentials();
  };

  return me;
  
}());


/**
 * Ghost.User
 * The object that handles the logged-in user's profile.
 */
Ghost.User = (function () {

  var me = {},
      _user;

  me.getUser = function () {
    return _user;
  };

  me.setUser = function (userObject) {
    _user = userObject;
  };

  me.userResponseHandler = function (response) {
    if (response.e === 0) {
      me.setUser(response.user);
      Ghost.UI.Profile.updateProfile();
      if (window.location.hash === '#edit_profile') {
        window.location = '#profile';
      }
    } else {
      Ghost.UI.Profile.showError(response);
    }
  };
  
  me.getProfileInfo = function () {
    Ghost.Ajax.get('/user/retrieve', {
      data: {_id: Ghost.Credentials.getUserId()},
      success: Ghost.User.userResponseHandler
    });
  }

  return me;

}());


/**
 * Ghost.Game
 * The object that handles game setup and actual gameplay.
 */
Ghost.Game = (function () {
  var me = {},
      _invitees = [],
      _currentGame;

  me.addInvitee = function (emailOrPhone) {
    me.getByEmailOrPhone(emailOrPhone, function (resp) {
      if (resp.e) {
        Ghost.UI.GameStart.errorInvitee('Sorry, that user has not signed up!');
      }
      else {
        _invitees.push(resp.user);
        Ghost.UI.GameStart.listInvitee(resp.user.username);
      }
    });
  };
  
  me.getByEmailOrPhone = function (emailOrPhone, callback) {
    var getter = {},
        thisUser = Ghost.User.getUser();
    
    emailOrPhone = emailOrPhone.trim();
  
    if (emailOrPhone === thisUser.phone || emailOrPhone === thisUser.email) {
      return Ghost.UI.GameStart.errorInvitee('You cannot invite yourself!  Don\'t even try!');
    }
    if (me.isPhone(emailOrPhone)) {
      getter.phone = emailOrPhone;
    }
    else if (me.isEmail(emailOrPhone)) {
      getter.email = emailOrPhone;
    }
    else {
      return Ghost.UI.GameStart.errorInvitee('Not a valid email address or phone number');
    }
    
    Ghost.Ajax.get('/user/retrieve', {
      data: getter,
      success: callback
    });

  };
  
  me.isPhone = function (number) {
    return /^\d+$/.test(number);
  };
  
  me.isEmail = function (email) {
    return /^[a-zA-Z0-9\+\._]+@[a-zA-Z0-9_]+\.[a-z]+$/.test(email);
  };
      
  me.get = function (params, callback) {
    Ghost.Ajax.get('/game/get', {
      data: params,
      success: callback
    });
  };
  
  me.start = function () {
    
    var ids;
    
    if (!_invitees.length) {
      return Ghost.UI.GameStart.errorInvitee('Select at least one friend to start a game.');
    }

    ids = _.pluck(_invitees, '_id');
    
    // Make sure creator is included in players list.
    ids.push(Ghost.Credentials.getUserId());
    
    Ghost.Ajax.get('/game/create', {
      data: {players: ids},
      success: me.load
    });
  };
  
  me.load = function (game) {
    if (typeof game === 'string') {
      return me.get({gameid: game}, function (result) {
        me.load(result.game);
      });
    }
  
    _currentGame = game;
    Ghost.UI.Game.load(game);
  };
  
  me.getList = function (uid, callback) {
    uid = uid || Ghost.Credentials.getUserId();
    
    me.get({userid: uid}, callback);
  };
  
  me.play = function (letter) {
    console.log({letter: letter, gameid: _currentGame._id});
    Ghost.Ajax.get('/game/play', {
      data: {letter: letter, gameid: _currentGame._id},
      success: me.load
    });
  };

  return me;
}());


/**
 * Ghost.Ajax
 * The object that makes calls to the server.
 */
Ghost.Ajax = (function () {

  var me = {};
  
  /**
   * Ajax.get
   * generic ajax wrapper
   */
  me.get = function (cmd, options) {
    options = $.extend({
      type: 'GET',
      dataType: 'jsonp',
      data: {},
      url: Ghost.SERVER_URL + cmd
    }, {}, options);
    
    options.data.currentUser = Ghost.Credentials.getUserId();
    
    $.ajax(options);
  };

  return me;

}());


/**
 * Ghost.Util
 * A collection of utility functions for the app.
 */
Ghost.Util = (function () {

  var me = {};
  
  /**
   * copy
   * shallow copy function for objects
   * @param {object} obj  object to copy
   */
  me.copy = function (obj) {
    var clone = {};
    
    for (var i in obj) {
      clone[i] = obj[i];
    }
    
    return clone;
  };
  
  /**
   * create
   * Crockford's prototypal inheritance method
   * @param {object} obj  object to extend
   */
  me.create = function (obj) {
    function F() {}
    F.prototype = obj;
    return new F();
  };
  
  return me;

}());


$(function () {

  Ghost.Credentials.checkCredentials();
  Ghost.UI.init();
  
});

}());
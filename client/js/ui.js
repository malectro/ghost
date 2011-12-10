/**
 * UI
 * UI namespace
 */
Ghost.UI = (function () {
  var me = {},
  
      _templates = {};
      
  me.init = function () {
    //load templates 
    $('.tmpl').each(function () {
      _templates[this.title] = this.innerHTML.trim();
    });
  };
  
  me.render = function (tmpl, context) {
    return Mustache.to_html(_templates[tmpl], context);
  };
  
  return me;
}());


/**
 * UI.Module
 * All UI modules should extend this module. Provides basic event handling.
 * All methods are extendable.
 */
Ghost.UI.Module = (function () {
  var me = {};

  /**
   * register()
   * used to register methods to a DOM event and add them to the
   * current module
   */
  me.register = function (event, funcName, func) {
    funcName = funcName.split(' ');
  
    this['event_' + funcName[0]] = func;
    $('.event_' + funcName).on(event, funcName[1], func);
  };
  
  /**
   * render()
   * render a given template with the given context
   * TODO: should probably decide on an engine
   */
  me.render = Ghost.UI.render;

  return me;
}());


/**
 * UI.GameStart
 * Object that handles UI updates for game creation.
 */
Ghost.UI.GameStart = (function () {
  me = Ghost.Util.create(Ghost.UI.Module);
  
  me.register('click', 'addInvitee', function () {
    var el = $('.start_invite_field'),
        val = el.val();
        
    Ghost.Game.addInvitee(val);
  });
  
  me.register('click', 'startGame', function () {
    Ghost.Game.start();
  });
  
  me.clear = function () {
    $('.error').hide();
    $('.start_invite_field').val('');
    $('.start_invitees').html('');
  };
  
  me.errorInvitee = function (msg) {
    $('.error').hide();
    $('#privateStart-error').text(msg).show();
  };
  
  me.listInvitee = function (name) {
    $('.error').hide();
    $('.start_invite_field').val('');
    $('.start_invitees').append(
      me.render('start_invitee', {name: name})
    );
  };
  
  return me;
}());


/**
 * UI.GameList
 */
Ghost.UI.GameList = (function () {
  var me = Ghost.Util.create(Ghost.UI.Module),
  
      _games = [];
  
  me.register('click', 'listGames', function () {
    Ghost.Game.getList(null, _showGames)
  });
  
  me.register('click', 'continueGame li', function () {
    $('#game-input').focus();
    Ghost.Game.load(this.innerHTML);
  });
  
  function _showGames(games) {
    var html = '';
  
    _games = games.games;
    
    for (var i = 0; i < _games.length; i++) {
      html += me.render('continue_list', {game: _games[i]._id});
    }
    
    $('#continue-list').html(html);
  }
  
  return me;
}());


/**
 * UI.Game
 */
// TODO(qarren): This will probably need to be split up once it starts
// getting really large.
Ghost.UI.Game = (function () {
  var me = Ghost.Util.create(Ghost.UI.Module);
  
  me.register('keydown', 'changeLetter', function (e) {
    if (event.which === 13 && this.value != '') {
      Ghost.Game.play(this.value);
      me.hideInput();
    }
    else if (event.which > 64 && event.which < 91) {
      this.value = '';
    }
    else {
      e.preventDefault();
    }
  });
  
  me.hideInput = function(response) {
    if (response) {
      $('#game-status').text('Waiting on ' + response.user.username);
    }
    $('#game-input').hide();
  }

  me.load = function (game) {
    console.log(game);
    
    location.hash = '#game';
    $('#game-string').text(game.letters || '');
    
    if (game.myTurn) {
      $('#game-input').val('').show();
      $('#game-status').text('Your turn!');
    }
    else {
      Ghost.Ajax.get('/user/retrieve', {
        data: {_id: game.currentPlayer},
        success: Ghost.UI.Game.hideInput
      });
    }
  };

  return me;
}());


/**
 * UI.Profile
 * Object that handles UI updates related to the user profile.
 */
Ghost.UI.Profile = (function () {
  
  me = Ghost.Util.create(Ghost.UI.Module);
  
  me.register('pageshow', 'profile', function () {
    Ghost.User.getProfileInfo();
  });
  
  me.register('pageshow', 'edit_profile', function () {
    var user = Ghost.User.getUser(),
        editForm = $('#edit_profile_form').children('input');
    for (i=0; i < editForm.length; i++) {
      var input = editForm[i];
      if (input.name === '_id') {
        input.value = Ghost.Credentials.getUserId();
      } else {
        input.value = user[input.name];
      }
    }
  });
  
  me.register('submit', 'edit_profile_submit', function () {
    Ghost.Ajax.get('/user/edit', {
      data: $(this).serialize(),
      success: Ghost.User.userResponseHandler
    });
    return false;
  });

  me.updateProfile = function () {
    var user = Ghost.User.getUser();
    if(user) {
      $('#username').text(user.username);
      $('#view_name').html(me.render('profile_name', {name: user.username}));
      $('#view_email').html(me.render('profile_email', {email: user.email}));
      $('#view_phone').html(me.render('profile_phone', {phone: user.phone}));
    }
  };
  
  me.showError = function (response) {
    $('.error').hide();
    $('#' + response.request + '-error').text(response.msg).show();
  }
  
  return me;
}());


/**
 * UI.Register
 * Object that handles the UI during user creation.
 */
Ghost.UI.Register = (function () {
  
  me = Ghost.Util.create(Ghost.UI.Module);
  
  me.validate = function(formFields) {
    var errors = '';
    for(i=0; i<formFields.length; i++) {
      var field = formFields[i];
      switch (field.name) {
        case 'email':
          if (!Ghost.Util.isEmail(field.value)) {
            errors += 'Please provide a properly formatted email address.<br />'
          }
          break;
        case 'phone':
          if (!Ghost.Util.isPhone(field.value)) {
            errors += 'Please provide a properly formatted phone number.<br />'
          }
          break;
        default:
          if (!field.value) {
            errors += 'Please provide a ' + field.name + '.<br />'
          }
          break;
      }
    }
    return errors;
  };

  me.showError = function (msg) {
    $('.error').hide();
    $('#create-error').html(msg).show();
  };
  
  me.register('submit', 'register', function () {
    var validation = Ghost.UI.Register.validate($(this).serializeArray());
    if(validation) {
      Ghost.UI.Register.showError(validation);
    } else {  
      Ghost.Ajax.get('/user/create', {
        data: $(this).serialize(),
        success: Ghost.Credentials.setCredentials
      });
    }
    return false;
  });
  
  return me;
}());


/**
 * UI.Login
 * Object that handles the UI during Login
 */
Ghost.UI.Login = (function () {
  
  me = Ghost.Util.create(Ghost.UI.Module);
  
  me.register('submit', 'login', function () {
    Ghost.Ajax.get('/user/authenticate', {
      data: $(this).serialize(),
      success: Ghost.Credentials.setCredentials
    });
    return false;
  });
  
  me.show = function() {
    $('.with-profile').hide();
    $('.without-profile').show();
  };
  
  me.hide = function() {
    $('.with-profile').show();
    $('.without-profile').hide();
  };
  
  me.showError = function(response) {
    $('.error').hide();
    $('#' + response.request + '-error').text(response.msg).show();
  };
  
  return me;
}());


/**
 * UI.Logout
 * Object that handles the UI during logout.
 */
Ghost.UI.Logout = (function () {
  
  me = Ghost.Util.create(Ghost.UI.Module);
  
  me.register('click', 'logout', function () {
    Ghost.Credentials.logout();
  });
  
  me.clearProfileInfo = function () {
    $('#username').text('bro');
    $('#profile-username').text('');
    $('#profile-email').text('');
    $('#profile-phone').text('');
    $('input:text').val('');
  };

  return me;
}());

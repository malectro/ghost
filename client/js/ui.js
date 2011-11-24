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
      _templates[this.title] = this.innerHTML;
    });
  };
  
  me.render = function (tmpl, context) {
    Mustache.to_html(_templates[tmpl], context);
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
    this['event_' + funcName] = func;
    $('.event_' + funcName).live(event, func);
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
 * UI.Start
 * 
 */
Ghost.UI.Start = (function () {
  me = Ghost.Util.create(Ghost.UI.Module);
  
  me.register('click', 'addInvitee', function () {
    var el = $(this),
        val = el.val();
        
    Ghost.Game.addInvitee(val);
  });
  
  me.errorInvitee = function (msg) {
    $('.start_msg').html(msg);
  };
  
  me.listInvitee = function (name) {
    $('.start_msg').val('');
    $('.start_invitees').append(
      me.render('start_invitee', {name: name})
    );
  };
  
  return me;
}());
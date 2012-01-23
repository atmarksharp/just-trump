(function() {
  var CARD_NUM, SHIFT, color, computer_id, multi_select, nums, selected, shuffled, socket, suits, users, zIndex;

  SHIFT = 16;

  CARD_NUM = 54;

  suits = "s,h,d,c".split(",");

  nums = "1,2,3,4,5,6,7,8,9,10,j,q,k".split(",");

  multi_select = false;

  selected = [];

  zIndex = 10;

  socket = io.connect(window.location.href);

  shuffled = {};

  computer_id = parseInt(Math.random() * 10e13);

  users = {};

  color = {
    h: parseInt(Math.random() * 360),
    s: 100,
    b: 50
  };

  $(document).ready(function() {
    var arrange, char, divide, gather, i, j, reserve, send, shuffle, startPoints, unreserve, unselect_all;
    char = function(s) {
      return s.charCodeAt(0);
    };
    send = function() {
      var msg;
      msg = {};
      $.each(selected, function() {
        return msg[$(this).data("id")] = {
          offset: $(this).offset(),
          z_index: $(this).css("z-index"),
          face: $(this).face(),
          reserved_by_sender: $(this).hasClass("reserved")
        };
      });
      return socket.emit('message', msg);
    };
    unselect_all = function() {
      var unselected;
      unselected = {};
      $.each(selected, function() {
        $(this).removeClass("selected_card");
        $(this).redraw();
        return unselected[$(this).data("id")] = "";
      });
      selected = [];
      return socket.emit("unselect", unselected);
    };
    shuffle = function() {
      var i, j, n1, n2, s1, s2;
      shuffled = {};
      i = selected.length;
      while (i -= 1) {
        j = Math.floor(Math.random() * (i + 1));
        if (i === j) continue;
        s1 = selected[i].suit();
        n1 = selected[i].number();
        s2 = selected[j].suit();
        n2 = selected[j].number();
        selected[j].data("suit", s1);
        selected[j].data("num", n1);
        selected[i].data("suit", s2);
        selected[i].data("num", n2);
        selected[i].redraw();
        selected[j].redraw();
        shuffled[selected[i].data("id")] = {
          visual: "" + s2 + "-" + n2
        };
        shuffled[selected[j].data("id")] = {
          visual: "" + s1 + "-" + n1
        };
      }
      return socket.emit("shuffle", shuffled);
    };
    gather = function() {
      var i;
      i = 0;
      return $.each(selected, function() {
        $(this).css("top", selected[0].offset().top - i * 0.3 + "px");
        $(this).css("left", selected[0].offset().left - i * 0.3 + "px");
        return i += 1;
      });
    };
    reserve = function() {
      var i;
      i = 0;
      return $.each(selected, function() {
        $(this).removeClass("reserved-by-other").addClass("reserved").redraw();
        return i += 1;
      });
    };
    unreserve = function() {
      var i;
      i = 0;
      return $.each(selected, function() {
        $(this).removeClass("reserved").redraw();
        return i += 1;
      });
    };
    arrange = function() {
      var i;
      i = 0;
      return $.each(selected, function() {
        $(this).css("top", selected[0].offset().top + "px");
        $(this).css("left", selected[0].offset().left + 30 * i + "px");
        return i += 1;
      });
    };
    divide = function() {
      var i, playerNum;
      playerNum = parseInt(window.prompt("何人に配りますか？", ""));
      i = 0;
      return $.each(selected, function() {
        $(this).css("top", selected[0].offset().top - i * 0.3 / playerNum + "px");
        $(this).css("left", selected[0].offset().left - i * 0.3 / playerNum + 100 * (i % playerNum) + "px");
        return i += 1;
      });
    };
    i = 0;
    while (i < 4) {
      j = 0;
      while (j < 13) {
        $("#back").append("<li id='" + suits[i] + "-" + nums[i] + "' class='card' data-id='" + suits[i] + "-" + nums[j] + "' data-suit='" + suits[i] + "' data-num='" + nums[j] + "' data-face='0' ></li>");
        j++;
      }
      i++;
    }
    $("#back").append("<li class='card' id='j-1' data-id='j-1' data-suit='j' data-num='1' data-face='0' ></li>");
    $("#back").append("<li class='card' id='j-2' data-id='j-2' data-suit='j' data-num='2' data-face='0' ></li>");
    jQuery.fn.extend({
      number: function() {
        return $(this).data("num");
      },
      suit: function() {
        return $(this).data("suit");
      },
      face: function() {
        return $(this).data("face");
      },
      name: function() {
        return $(this).data("suit") + "-" + $(this).data("num");
      },
      img: function() {
        if ($(this).data("face") !== 0) {
          return $(this).data("suit") + "-" + $(this).data("num");
        } else {
          return "ura";
        }
      },
      redraw: function() {
        $(this).attr("id", $(this).name());
        if ($(this).face() === 0) {
          $(this).removeClass("semi-open");
          return $(this).addClass("ura");
        } else {
          if ($(this).hasClass("reserved-by-other")) {
            $(this).removeClass("ura");
            return $(this).addClass("semi-open");
          } else {
            $(this).removeClass("semi-open");
            return $(this).removeClass("ura");
          }
        }
      },
      flip: function() {
        if ($(this).hasClass("reserved-by-other")) return;
        $(this).data("face", 1 - $(this).data("face"));
        return $(this).redraw();
      },
      open: function() {
        if ($(this).hasClass("reserved-by-other")) return;
        $(this).data("face", 1);
        return $(this).redraw();
      },
      close: function() {
        if ($(this).hasClass("reserved-by-other")) return;
        $(this).data("face", 0);
        return $(this).redraw();
      }
    });
    $("#back").selectable({
      selected: function(e, ui) {
        $(ui.selected).addClass("selected_card").redraw();
        selected.push($(ui.selected));
        zIndex += CARD_NUM;
        $(ui.selected).css("z-index", zIndex);
        send();
        return true;
      },
      start: function(e, ui) {
        unselect_all();
        return true;
      }
    });
    startPoints = [];
    $(".card").draggable({
      start: function(e, ui) {
        startPoints = [];
        return $.each(selected, function() {
          var str;
          str = $(this).name();
          return startPoints[str] = $(this).offset();
        });
      },
      drag: function(e, ui) {
        var leftDistance, topDistance;
        topDistance = $(this).offset().top - startPoints[$(this).name()].top;
        leftDistance = $(this).offset().left - startPoints[$(this).name()].left;
        $.each(selected, function() {
          $(this).css("top", (startPoints[$(this).name()].top + topDistance) + "px");
          return $(this).css("left", (startPoints[$(this).name()].left + leftDistance) + "px");
        });
        return send();
      },
      stop: function(e, ui) {
        return send();
      }
    }).each(function() {
      zIndex += 1;
      $(this).css("z-index", zIndex);
      $(this).redraw();
      $(this).attr("id", $(this).name());
      return selected.push($(this));
    }).mousedown(function() {
      console.log("down:" + $(this).name());
      if (multi_select) {
        selected.push($(this));
      } else if (selected.length === 0 || !$(this).hasClass("selected_card")) {
        unselect_all();
        selected = [$(this)];
      }
      $(this).addClass("selected_card");
      zIndex += CARD_NUM;
      $(this).css("z-index", zIndex);
      send();
      return false;
    }).mouseup(function() {});
    $("body").keypress(function(e) {
      if (e.which === char("f")) {
        $.each(selected, function() {
          return $(this).flip();
        });
        return send();
      } else if (e.which === char("d")) {
        $.each(selected, function() {
          return $(this).open();
        });
        return send();
      } else if (e.which === char("s")) {
        $.each(selected, function() {
          return $(this).close();
        });
        return send();
      } else if (e.which === char("a")) {
        return shuffle();
      } else if (e.which === char("g")) {
        gather();
        return send();
      } else if (e.which === char("h")) {
        arrange();
        return send();
      } else if (e.which === char("j")) {
        divide();
        return send();
      } else if (e.which === char("j")) {
        divide();
        return send();
      } else if (e.which === char("k")) {
        reserve();
        return send();
      } else if (e.which === char("l")) {
        unreserve();
        return send();
      }
    }).keydown(function(e) {
      if (e.keyCode === SHIFT) multi_select = true;
      return console.log(e.keyCode);
    }).keyup(function(e) {
      return multi_select = false;
    }).mousedown(function() {
      return unselect_all();
    });
    gather();
    return selected = [];
  });

  socket.on('connect', function(msg) {
    return socket.emit('add_user', {
      id: computer_id,
      color: color,
      name: "guest"
    });
  });

  socket.on('message', function(data) {
    var key, msg, s, target, user, _results;
    msg = data.value;
    user = data.user;
    if (users[user.id] === void 0) {
      users[user.id] = {
        name: user.name,
        color: user.color
      };
      s = document.styleSheets[0];
      s.insertRule(".UID" + user.id + " { box-shadow: 0px 0px 10px hsl(" + user.color.h + "," + user.color.s + "%," + user.color.b + "%); }", s.cssRules.length);
      s.insertRule(".reserved-by-other.RID" + user.id + " { border: 3px solid hsl(" + user.color.h + "," + user.color.s + "%," + user.color.b + "%); }", s.cssRules.length);
    }
    _results = [];
    for (key in msg) {
      target = $(".card[data-id='" + key + "']");
      if (msg[key].reserved_by_sender) {
        _results.push(target.css("top", msg[key].offset.top).removeClass("reserved").addClass("UID" + user.id).css("left", msg[key].offset.left).css("z-index", msg[key].z_index).data("face", msg[key].face).addClass("reserved-by-other").addClass("RID" + user.id).redraw());
      } else {
        _results.push(target.css("top", msg[key].offset.top).addClass("UID" + user.id).css("left", msg[key].offset.left).css("z-index", msg[key].z_index).data("face", msg[key].face).removeClass("reserved-by-other").removeClass("RID" + user.id).redraw());
      }
    }
    return _results;
  });

  socket.on('unselect', function(data) {
    var key, msg, user, _results;
    msg = data.value;
    user = data.user;
    _results = [];
    for (key in msg) {
      _results.push($(".card[data-id='" + key + "']").removeClass("UID" + user.id));
    }
    return _results;
  });

  socket.on('shuffle', function(data) {
    var key, msg, to, _results;
    msg = data.value;
    _results = [];
    for (key in msg) {
      to = msg[key].visual.split("-");
      _results.push($(".card[data-id='" + key + "']").data("suit", to[0]).data("num", to[1]).redraw());
    }
    return _results;
  });

  socket.on('new_user_entry', function(data) {
    var user;
    user = data.user;
    return $("#loading").text("" + data.user.name + " was entered.").slideDown(1000).slideUp(500);
  });

  socket.on('user_disconnect', function(data) {
    var user;
    user = data.user;
    $("#loading").text("" + data.user.name + " was disconnected.").slideDown(1000).slideUp(500);
    $(".UID" + user.id).removeClass("UID" + user.id).redraw();
    return $(".RID" + user.id).removeClass("RID" + user.id).removeClass("reserved-by-other").data("face", 0).redraw();
  });

  socket.on('init', function(data) {
    var key, msg, s, target, to, user, _results, _users;
    msg = data.value;
    _users = data.users;
    s = document.styleSheets[0];
    for (key in _users) {
      user = _users[key];
      users[user.id] = {
        name: user.name,
        color: user.color
      };
      s.insertRule(".UID" + user.id + " { box-shadow: 0px 0px 10px hsl(" + user.color.h + "," + user.color.s + "%," + user.color.b + "%); }", s.cssRules.length);
      s.insertRule(".reserved-by-other.RID" + user.id + " { border: 3px solid hsl(" + user.color.h + "," + user.color.s + "%," + user.color.b + "%); }", s.cssRules.length);
    }
    $("#loading").fadeOut(500);
    $("#back").css("display", "block");
    _results = [];
    for (key in msg) {
      target = $(".card[data-id='" + key + "']");
      if (!(msg[key].face === void 0) && !(msg[key].offset === void 0) && !(msg[key].z_index === void 0)) {
        target.css("top", msg[key].offset.top).css("left", msg[key].offset.left).css("z-index", msg[key].z_index).data("face", msg[key].face);
      }
      if (!(msg[key].visual === void 0)) {
        to = msg[key].visual.split("-");
        target.data("suit", to[0]).data("num", to[1]);
      }
      if (!(msg[key].reserved_by === void 0) && msg[key].reserved_by !== 0) {
        console.log(msg[key].reserved_by);
        target.addClass("reserved-by-other").addClass("RID" + msg[key].reserved_by);
      }
      _results.push(target.redraw());
    }
    return _results;
  });

}).call(this);

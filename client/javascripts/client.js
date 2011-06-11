(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Crafty.c("WASD", {
    init: function() {
      return this.requires("controls");
    },
    wasd: function(speed) {
      this.speed || (this.speed = speed);
      this.bind("enterframe", function() {
        var location_message, x, y;
        if (this.disableControls) {
          return;
        }
        if (this.isDown("RIGHT_ARROW") || this.isDown("D")) {
          x = this.x + this.speed;
        }
        if (this.isDown("LEFT_ARROW") || this.isDown("A")) {
          x = this.x - this.speed;
        }
        if (this.isDown("UP_ARROW") || this.isDown("W")) {
          y = this.y - this.speed;
        }
        if (this.isDown("DOWN_ARROW") || this.isDown("S")) {
          y = this.y + this.speed;
        }
        if ((typeof x !== 'undefined' || typeof y !== 'undefined') && (x !== this.x || y !== this.y)) {
          location_message = client.set_location_message(this.x, this.y);
          client.send(location_message);
          if (x != null) {
            this.x = x;
          }
          if (y != null) {
            return this.y = y;
          }
        }
      });
      return this;
    }
  });
  Crafty.c('damageable', {
    init: function() {
      return this.health = 10;
    },
    take_damage: function(damage) {
      this.health -= damage;
      return window.client.log("Entity " + this[0] + " took " + damage + " damage");
    }
  });
  Crafty.c("player", {
    init: function() {
      this.requires("2D, DOM, Collision");
      this.origin("center");
      this.css({
        border: '1px solid white'
      });
      this.attr({
        x: 100,
        y: 100,
        w: 40,
        h: 40
      });
      this.bind('enterframe', function() {
        if (window.debug) {
          debugger;
        }
      });
      return console.log('Player inited!');
    }
  });
  Crafty.c('monster', {
    init: function() {
      this.strength = 1;
      this.addComponent("2D, DOM, Collide");
      this.origin("center");
      this.attr({
        x: 200,
        y: 200,
        w: 40,
        h: 40
      });
      this.onHit('player', function(hit_data) {
        var collider, collision, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = hit_data.length; _i < _len; _i++) {
          collision = hit_data[_i];
          collider = collision.obj;
          _results.push(collider.__c['player'] ? window.client.send(window.client.take_damage_mesage(collider[0], this.strength)) : void 0);
        }
        return _results;
      });
      return console.log('Monster inited!');
    }
  });
  Crafty.c('tile', {
    init: function() {
      this.requires('2D, DOM');
      return this.attr({
        w: 40,
        h: 40
      });
    }
  });
  Crafty.c('wall', {
    init: function() {
      return this.requires('tile, wall_gray');
    }
  });
  Crafty.c('floor', {
    init: function() {
      return this.requires('tile, floor_gray');
    }
  });
  window.client = {
    init: function() {
      Crafty.init(600, 600);
      Crafty.background("#000");
      Crafty.sprite(40, "images/lofi_char.png", {
        player_green: [0, 0],
        player_gray: [1, 0]
      });
      Crafty.sprite(40, "images/lofi_environment.png", {
        wall_gray: [0, 0],
        floor_brown: [12, 1]
      });
      this.player = window.Crafty.e("player, player_green, WASD").wasd(3);
      this.socket = new io.Socket(null, {
        port: 9000,
        rememberTransport: false
      });
      this.socket.connect();
      this.socket.on('connect', function() {});
      this.socket.on('message', __bind(function(message) {
        return this.receive(message);
      }, this));
      this.socket.send({
        type: "setName",
        body: $("#player-name").innerHTML
      });
      this.game = new window.Game;
      return this.players_by_connection_id = {};
    },
    log: function(msg) {
      if ((typeof console !== "undefined" && console !== null ? console.log : void 0) != null) {
        return console.log(msg);
      }
    },
    dir: function(msg) {
      if ((typeof console !== "undefined" && console !== null ? console.dir : void 0) != null) {
        return console.dir(msg);
      }
    },
    set_location_message: function(x, y) {
      return {
        type: 'set_location',
        body: {
          x: x,
          y: y
        }
      };
    },
    take_damage_message: function(entity_id, damage) {
      type('take_damage');
      return {
        body: {
          entity_id: entity_id,
          damage: damage
        }
      };
    },
    add_map_tiles: function(map) {
      return _.each(map, function(row, y) {
        return _.each(row, function(cell, x) {
          var tile;
          tile = null;
          switch (cell) {
            case 'W':
              tile = Crafty.e('wall');
              break;
            case 'f':
              tile = Crafty.e('floor');
          }
          if (tile) {
            return tile.attr({
              x: x * tile.w,
              y: y * tile.h
            });
          }
        });
      });
    },
    send: function(message) {
      this.log('sending: ' + $.toJSON(message));
      return this.socket.send(message);
    },
    receive: function(message) {
      var entity, map, player;
      this.log('IN: ' + $.toJSON(message));
      this.dir(message);
      switch (message.type) {
        case 'connection':
          this.log('connected: ' + message.client);
          player = this.players_by_connection_id[message.client] || Crafty.e('player, player_gray');
          this.players_by_connection_id[message.client] = player;
          return player.attr({
            clientid: message.client
          });
        case 'map':
          map = message.body.map;
          return this.add_map_tiles(map);
        case 'disconnection':
          this.log('disconnected: ' + message.client);
          player = this.players_by_connection_id[message.client];
          delete this.players_by_connection_id[message.client];
          return player.destroy();
        case 'set_location':
          player = this.players_by_connection_id[message.client];
          player.attr({
            x: message.body.x,
            y: message.body.y
          });
          return this.log(message.client + ' ' + player.x + ' ' + player.y);
        case 'setName':
          return '';
        case 'take_damage':
          entity = Crafty(message.body.entity_id);
          if (entity) {
            return entity.take_damage(message.body.damage);
          }
      }
    }
  };
  $(function() {
    return Crafty.load(["images/lofi_char.png"], function() {
      return window.client.init();
    });
  });
}).call(this);

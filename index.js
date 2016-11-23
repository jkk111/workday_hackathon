var blessed = require("blessed");

var screen = blessed.screen();
var crypto = require("crypto");
var entities = {};
var bullets = {};

var score = 0;
var hp = 100;

var box = blessed.box({
  width: "100%",
  height: "100%",
  style: {
    bg: "blue"
  }
});

var scoreBox = blessed.box({
  parent: box,
  content: "Score: 0",
  style: {
    fg: "white",
    bg: "blue"
  }
})

var player = blessed.box({
  bottom: 2,
  mouse: true,
  left: Math.floor(screen.cols / 2),
  width: 8,
  height: 1,
  style: {
    bg: "red"
  }
});

screen.append(box);
screen.append(player);
player.setIndex(10);
screen.render();

var types = [
  {
    speed: 5 / 8
  }
]

var bulletTypes = [
  {
    speed: 1,
    dmg: 10
  }
]



function genRow() {
  var sort = random(1, types.length) - 1;
  var num = random(3, 8);
  var spacing = Math.floor((screen.cols - 10) / num);
  for(var i = 0; i < num; i++) {
    (new Enemy(10 + (spacing * i), sort));
  }
}

function collide(bullet) {
  for(var enemy in entities) {
    var en = entities[enemy];
    var lwren = en.object.left;
    var hien = lwren + en.object.width;
    if (bullet && en && bullet.hp > 0 && en.hp > 0 &&
        (bullet.object.left + bullet.object.width) > lwren &&
        (bullet.object.left) < hien &&
        bullet.y <= en.y) {
      score += 10;
      en.kill();
      bullet.kill();
      break;
    }
  }
}

function random(min, max) {
  var rand = Math.floor(Math.random() * (max - min + 1)) + min;
  return rand;
}

var scores = {
  0: "n00b",
  100: "You Tried.jpg",
  500: "GJ",
  1000: "I am not worthy",
  2500: "You are an hero!"
}


function Enemy(x, sort) {
  this.x = x;
  this.y = -5;
  this.id = crypto.randomBytes(8).toString("hex");
  entities[this.id] = this;
  this.object = createEnemy(this.x, this.y, sort);
  this.speed = types[sort].speed;
  this.hp = 100;
  this.kill = function() {
    this.y = screen.rows + 5;
    this.update(true);
  }
  this.update = function(force) {
    this.y += this.speed;
    if(this.object && this.hp > 0) {
      this.object.top = Math.floor(this.y);
      if(this.object.top > screen.rows) {
        screen.remove(this.object);
        delete entities[this.id];
        this.hp = 0;
        if(!force) {
          hp -= 4;
          if(hp <= 0) {
            var s = "n00b";
            for(var sc in scores) {
              if(score > sc) {
                s = scores[sc];
              }
            }
            screen.destroy();
            console.log("Game Over :(\n" + s + "\nYou Scored: " + score);
            process.exit();
          }
        }
      }
    }
  }
}

function fire() {
  (new Bullet(player.left + 1, player.top - 1, 1, 0));
  (new Bullet(player.left + player.width - 3, player.top - 1, 1, 0));
}

function Bullet(x, y, speed, sort) {
  this.x = x;
  this.y = y;
  this.speed = speed;
  this.object = createBullet(this.x, this.y, sort);
  this.hp = 100;
  this.id = crypto.randomBytes(8).toString("hex");
  bullets[this.id] = this;
  this.update = function(force) {
    this.y -= this.speed;
    if(this.object && this.y >= -1 || force) {
      this.object.top = Math.floor(this.y);
      if(this.object.top < 0) {
        screen.remove(this.object);
        delete bullets[this.id];
        this.hp = 0;
      }
    }
  }

  this.kill = function() {
    this.y = -5;
    this.hp = 0;
    this.update(true);
  }
}

var frame = 0;
setInterval(function() {
  for(var enemy in entities) {
    entities[enemy].update();
  }

  for(var bullet in bullets) {
    bullets[bullet].update();
    collide(bullets[bullet]);
  }
  if(frame % random(20, 40) == 0) {
    genRow();
  }
  frame++;
  scoreBox.setLine(0, "Score: " + score);
  scoreBox.setLine(1, "HP: " + hp);
  if(frame % 3 == 0) {
    fire();
  }
  screen.render();
}, 1000 / 24);

function createEnemy(x, y, sort) {
  var box = blessed.box({
    top: y,
    left: x,
    width: 4,
    height: 1,
    style: {
      bg: "green"
    }
  });
  screen.append(box);
  return box;
}


function createBullet(x, y, sort) {
  var box = blessed.box({
    top: y,
    left: x,
    width: 2,
    height: 1,
    style: {
      bg: "yellow"
    }
  });
  screen.append(box);
  return box;
}

box.focus();


box.on("keypress", function (ch, key) {
  if(key.name == "left") {
    player.left -= 1;
    // if(frame % 2 == 0)
      // fire();
  } else if (key.name == "right") {
    player.left += 1;
    // if(frame % 2 == 0)
      // fire();
  }
  player.left = Math.min(Math.max(0, player.left), screen.cols - player.width);
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
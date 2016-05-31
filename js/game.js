/*
 *
 *                  LASERCATS
 *
 *   FILE: game.js
 *   AUTHORS: M. Jahja
 *   HISTORY:
 *      created.01DEC2015.mjahja with initial game structure,
 *      mod.22JAN2016.mjahja with game refinements + agent structure
 *
 *   Main implementation of LaserCats (JavaScript) game.
 *
 */

 //Generate normal random variable using Irwin-Hall approximation
var normalRand = function(mu, sig){
  var u = [];
  for (var i=0, n=12; i < n; i++) {
    u.push(Math.random());
  }
  sumU = u.reduce(function(a, b) {return a + b;});
  x = sig*(sumU - 6) + mu;
  return x;
};

//Function to generate random number from gamma distr using
// Ahrens-Dieter acceptance-rejection method
var gammaRand = function(a, b){
  var uk = [];
  for (var i=0, n=Math.floor(a); i<n; i++) {
    uk.push(Math.log(Math.random()));
  }
  delta = a - Math.floor(a);
  if (delta != 0){
    do {
      u = Math.random();
      v = Math.random();
      w = Math.random();
      if (u <= (Math.E/(Math.E + delta))){
          xi = Math.pow(v, (1/delta));
          eta = w*Math.pow(xi, delta - 1);
      }
      else{
        xi = 1 - Math.log(v);
        eta = w*Math.pow(Math.E, -xi);
      }
    }
    while (eta > Math.pow(xi,delta-1)*Math.pow(Math.E, -xi));
  }
  else{
    eta = 0;
  }
  if (uk.length > 0){
    sumUk = uk.reduce(function(a, b) {return a + b;});
  }
  else{
    sumUk = 0;
  }
  gam = (1/b)*(eta - sumUk);
  return gam;
};


var game = new Phaser.Game(1000, 500, Phaser.AUTO, 'game');

///////////////////////////////////
///            Lasers           ///
///////////////////////////////////
var Laser = function (game, key) {
    Phaser.Sprite.call(this, game, 0, 0, key);
    this.anchor.set(0.5);
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
    this.exists = false;
};
Laser.prototype = Object.create(Phaser.Sprite.prototype);
Laser.prototype.constructor = Laser;
Laser.prototype.fire = function (x, y, angle, speed, gx, gy) {

    gx = gx || 0;
    gy = gy || 0;

    this.reset(x, y);
    this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);
    this.body.gravity.set(gx, gy);

};
var Lasers = {};
Lasers.SingleLaser = function (game) {
    Phaser.Group.call(this, game, game.world, 'Single Bullet', false, true, Phaser.Physics.ARCADE);
    this.nextFire = 0;
    this.bulletSpeed = 550;
    this.fireRate = 300;
    for (var i = 0; i < 20; i++) {
        this.add(new Laser(game, 'laser'), true);
    }
    return this;
};
Lasers.SingleLaser.prototype = Object.create(Phaser.Group.prototype);
Lasers.SingleLaser.prototype.constructor = Lasers.SingleLaser;
Lasers.SingleLaser.prototype.fire = function (source) {
    if (this.game.time.time < this.nextFire) {
        return;
    }
    this.getFirstExists(false).fire(source.x + 10, source.y + 20, 180, this.bulletSpeed, 0, 0);
    this.nextFire = this.game.time.time + this.fireRate;
};

///////////////////////////////////
///            Game             ///
///////////////////////////////////
var LaserCats = function () {
    this.background = null;
    this.cat = null;
    this.lasers = null;
    this.mice = null;
    this.rats = null;
    this.counter = null;
    this.player = null;
    this.action = null;

    this.mouseGenTime = 30;
    this.ratGenTime = 100;

    this.lives = null;
    this.score = 0;
    this.prevScore = 0;
    this.scoreText = null;
    this.livesText = null;
};

var gamma = 0.8;
var zai_init = 0.0;
var c_init = 0.01;
var a_init = 0.01;
var b_init = 0.01;
var theta_vec = Array.apply(null, Array(17)).map(Number.prototype.valueOf,0);
var zai_vec = [];
for(var i=0; i<2301; i++) {
    zai_vec[i] = Array.apply(null, Array(17)).map(Number.prototype.valueOf,zai_init);
};
var c_vec = [];
for(var i=0; i<2301; i++) {
    c_vec[i] = Array.apply(null, Array(17)).map(Number.prototype.valueOf,c_init);
};
var a_vec = [];
for(var i=0; i<2301; i++) {
    a_vec[i] = Array.apply(null, Array(17)).map(Number.prototype.valueOf,a_init);
};
var b_vec = [];
for(var i=0; i<2301; i++) {
    b_vec[i] = Array.apply(null, Array(17)).map(Number.prototype.valueOf,b_init);
};

LaserCats.prototype = {

    init: function () {
        this.physics.startSystem(Phaser.Physics.ARCADE);
    },

    preload: function () {
        /// load all images ///
        this.load.image('background', 'assets/background.png');
        this.load.image('cat', 'assets/cat.png');
        this.load.image('mice', 'assets/mice.png');
        this.load.image('rat', 'assets/rat.png');
        this.load.image('laser', 'assets/laser.png');
    },

    create: function () {
        /// game display ///
        this.background = this.add.tileSprite(0, 0, 1571, 786, 'background');
        var style = {font: "28px Arial", fill: "#fff", align: "left"};
        this.score = 0;
        this.prevScore = 0;
        this.lives = 99999;
        this.scoreText = this.game.add.text(0, 0, "Score: " + this.score, style);
        this.livesText = this.game.add.text(0, 28, "Lives: " + this.lives, style);
        this.counter = 1;

        /// player ///
        this.player = new HumanPlayer();

        /// cat ///
        this.cat = this.add.sprite(this.game.width - 200.0, this.game.height / 2.0, 'cat');
        this.physics.arcade.enable(this.cat, Phaser.Physics.ARCADE);
        this.cat.enableBody = true;
        this.cat.body.collideWorldBounds = true;
        this.cat.physicsBodyType = Phaser.Physics.ARCADE;

        /// lasers ///
        this.lasers = new Lasers.SingleLaser(this.game);

        /// mice ///
        this.mice = this.game.add.group();
        this.mice.enableBody = true;
        this.mice.physicsBodyType = Phaser.Physics.ARCADE;

        /// rats ///
        this.rats = this.game.add.group();
        this.rats.enableBody = true;
        this.rats.physicsBodyType = Phaser.Physics.ARCADE;
    },


    update: function () {

        /// cat movement ///
        this.cat.body.velocity.setTo(0, 0);

        /// Example of sending mouse positions and getting actions.
        if (this.counter > 1){
          prevState = currState;
          prevFeat = currFeat;
          index1 = index2;
        }
        this.player.sendMousePositions(this.mice.children); // an array is passed
        this.action = this.player.getAction();
        currState = this.getPositions(this.cat,this.mice.children,this.rats.children,this.lasers.children);
        //console.log(currState);
        currFeat = this.getFeatures(currState);
        index2 = currFeat.indexOf(1);

        if (this.counter > 1){
          // Find the positions hyperparameters that need to be updated
          zai1 = zai_vec[index1][action];
          c1 = c_vec[index1][action];
          a1 = a_vec[index1][action];
          b1 = b_vec[index1][action];
          // Find the action that leads to highest expected reward
          // console.log(index2)
          a_max = Math.max.apply(null, zai_vec[index2]);
          // console.log(zai_vec[index2])
          // console.log(a_max);
          a_opt = zai_vec[index2].indexOf(a_max);
          //Find values of hyperparameters for R_s'
          zai2 = zai_vec[index2][a_opt];
          c2 = c_vec[index2][a_opt];
          b2 = b_vec[index2][a_opt];
          a2 = a_vec[index2][a_opt];

          // Compute E[r + gamma*R_s'] and E[(r + gamma*R_s')^2]
          er = zai2 // E[R]
          m1 = reward + gamma*er;

          //Update posteriors of the old state-action pair
          zai_vec[index1][action] = (c1*zai1 + m1)/(c1 + 1);
          c_vec[index1][action] = c1 + 1;
          a_vec[index1][action] = a1 + 0.5;
          b_vec[index1][action] = b1 + c1*Math.pow(m1 - zai1,2)/(2*(c1 + 1));

          // Use Q-Sampling to choose action
          for(var i=0; i < 17; i++){
            //Extract the hyperparameters for action i at state index2
            zai = zai_vec[index2][i];
            c = c_vec[index2][i];
            a = a_vec[index2][i];
            b = b_vec[index2][i];
            // First sample w from Ga(a,b), where b is rate
            w = gammaRand(a, b);
            theta = normalRand(zai, 1/(c*w));
            // Store the mean for action i
            theta_vec[i] = theta
          }
        }

        // Movements for Human Player
        // if (this.action['shift']) {
        //     this.shiftMult = 3;
        // }
        // else {
        //     this.shiftMult = 1;
        // }
        // if (this.action['left']) {
        //     this.cat.x -= 8 * this.shiftMult;
        // }
        // else if (this.action['right']) {
        //     this.cat.x += 8 * this.shiftMult;
        // }
        //
        // if (this.action['up']) {
        //     this.cat.y -= 8 * this.shiftMult;
        // }
        // else if (this.action['down']) {
        //     this.cat.y += 8 * this.shiftMult;
        // }

        /// shoot lasers ///
        this.lasers.fire(this.cat);

        /// add mice ///
        // if (this.counter % this.mouseGenTime == 0) {
        //     this.generateMouse();
        // }
        //
        // /// add rat ///
        // if (this.counter % this.ratGenTime == 0) {
        //     this.generateRat();
        // }

        if ((currState[2] == null) && (currState[4] == null)){
          if (Math.random() < 0.9){
            this.generateMouse();
          }
          else{
            this.generateRat();
          }
        }

        /// time penalty ///
        if (this.counter % 60 == 0) {
            this.score -= 1;
        }

        /// check collisions ///
        this.game.physics.arcade.overlap(this.mice, this.cat, this.catHitMouse, null, this);
        this.game.physics.arcade.collide(this.mice, this.lasers, this.laserHitMouse, null, this);
        this.game.physics.arcade.overlap(this.rats, this.cat, this.catHitRat, null, this);
        this.game.physics.arcade.collide(this.rats, this.lasers, this.laserHitRat, null, this);
        if ((currState[2] > 996) || (currState[4] > 996)){
          this.score -= 5;
        }
        this.scoreText.setText("Score: " + this.score);
        this.livesText.setText("Lives: " + this.lives);

        thetaMax = Math.max.apply(null, theta_vec);
        action = theta_vec.indexOf(thetaMax);
        reward = this.score - this.prevScore;


        // Move Up
        if (action == 0){
          this.cat.y -= 8;
        }
        // Move Up-Right
        if (action == 1){
          this.cat.y -= 8;
          this.cat.x += 8;
        }
        // Move Right
        if (action == 2){
          this.cat.x += 8;
        }
        // Move Down-Right
        if (action == 3){
          this.cat.y += 8;
          this.cat.x += 8;
        }
        // Move Down
        if (action == 4){
          this.cat.y += 8;
        }
        // Move Down-Left
        if (action == 5){
          this.cat.y += 8;
          this.cat.x -= 8;
        }
        // Move Left
        if (action == 6){
          this.cat.x -= 8;
        }
        //Move Left-Up
        if (action == 7){
          this.cat.y -= 8;
          this.cat.x -= 8;
        }
        // Move Plus shift
        // Move Up
        if (action == 8){
          this.cat.y -= 24;
        }
        // Move Up-Right
        if (action == 9){
          this.cat.y -= 24;
          this.cat.x += 24;
        }
        // Move Right
        if (action == 10){
          this.cat.x += 24;
        }
        // Move Down-Right
        if (action == 11){
          this.cat.y += 24;
          this.cat.x += 24;
        }
        // Move Down
        if (action == 12){
          this.cat.y += 24;
        }
        // Move Down-Left
        if (action == 13){
          this.cat.y += 24;
          this.cat.x -= 24;
        }
        // Move Left
        if (action == 14){
          this.cat.x -= 24;
        }
        //Move Left-Up
        if (action == 15){
          this.cat.y -= 24;
          this.cat.x -= 24;
        }
        // If action is 16 do nothing

        this.counter += 0.5;
        this.prevScore = this.score;


        if (this.counter == 60){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec.csv");
          link.click();
        }
        if (this.counter == 108000*24){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec1.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec1.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec1.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec1.csv");
          link.click();
        }
        if (this.counter == 108000*24*2){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec2.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec2.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec2.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec2.csv");
          link.click();
        }
        if (this.counter == 108000*24*3){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec3.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec3.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec3.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec3.csv");
          link.click();
        }
        if (this.counter == 108000*24*4){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec4.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec4.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec4.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec4.csv");
          link.click();
        }
        if (this.counter == 108000*24*5){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec5.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec5.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec5.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec5.csv");
          link.click();
        }
        if (this.counter == 108000*24*6){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec6.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec6.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec6.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec6.csv");
          link.click();
        }
        if (this.counter == 108000*24*7){
          var data = a_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "a_vec7.csv");
          link.click();
          var data = b_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "b_vec7.csv");
          link.click();
          var data = c_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "c_vec7.csv");
          link.click();
          var data = zai_vec;
          var csvContent = "data:text/csv;charset=utf-8,";
          data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;
          });
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "zai_vec7.csv");
          link.click();
        }
        if (this.counter == 108000*24*8){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec8.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec8.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec8.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec8.csv");
            link.click();
        }
        if (this.counter == 108000*24*9){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec9.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec9.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec9.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec9.csv");
            link.click();
        }
        if (this.counter == 108000*24*10){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec10.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec10.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec10.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec10.csv");
            link.click();
        }
        if (this.counter == 108000*24*11){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec11.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec11.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec11.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec11.csv");
            link.click();
        }
        if (this.counter == 108000*24*12){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec12.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec12.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec12.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec12.csv");
            link.click();
        }
        if (this.counter == 108000*24*13){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec13.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec13.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec13.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec13.csv");
            link.click();
        }
        if (this.counter == 108000*24*14){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec14.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec14.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec14.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec14.csv");
            link.click();
        }
        if (this.counter == 108000*24*15){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec15.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec15.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec15.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec15.csv");
            link.click();
        }
        if (this.counter == 108000*24*16){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec16.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec16.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec16.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec16.csv");
            link.click();
        }
        if (this.counter == 108000*24*17){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec17.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec17.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec17.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec17.csv");
            link.click();
        }
        if (this.counter == 108000*24*18){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec18.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec18.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec18.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec18.csv");
            link.click();
        }
        if (this.counter == 108000*24*19){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec19.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec19.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec19.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec19.csv");
            link.click();
        }
        if (this.counter == 108000*24*20){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec20.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec20.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec20.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec20.csv");
            link.click();
        }
        if (this.counter == 108000*24*21){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec21.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec21.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec21.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec21.csv");
            link.click();
        }
        if (this.counter == 108000*24*22){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec22.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec22.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec22.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec22.csv");
            link.click();
        }
        if (this.counter == 108000*24*23){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec23.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec23.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec23.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec23.csv");
            link.click();
        }
        if (this.counter == 108000*24*24){
            var data = a_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "a_vec24.csv");
            link.click();
            var data = b_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "b_vec24.csv");
            link.click();
            var data = c_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "c_vec24.csv");
            link.click();
            var data = zai_vec;
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zai_vec24.csv");
            link.click();
        }
    },

    /* Generate mouse enemies. */
    generateMouse: function () {
        var mouse = this.mice.getFirstExists(false);
        var yPosition = Math.min(Math.random() * this.game.height, this.game.height - 100);
        if (mouse) {
            mouse.reset(0, Math.max(yPosition, 5), 'mice');
        }
        else {
            mouse = this.mice.create(0, Math.max(yPosition, 5), 'mice');
        }
        mouse.body.velocity.x = 200;
        mouse.outOfBoundsKill = true;
        mouse.checkWorldBounds = true;
    },


    /* Generate rat enemies. */
    generateRat: function () {
        var rat = this.rats.getFirstExists(false);
        var yPosition = Math.min(Math.random() * this.game.height, this.game.height - 250);
        if (rat) {
            rat.reset(0, Math.max(yPosition, 5), 'rat');
        }
        else {
            rat = this.rats.create(0, Math.max(yPosition, 5), 'rat');
        }
        rat.life = 5;
        rat.body.velocity.x = 200;
        rat.body.immovable = true;
        rat.outOfBoundsKill = true;
        rat.checkWorldBounds = true;
    },

    /* Check mouse-cat collisions. */
    catHitMouse: function (cat, mouse) {
        if (this.mice.getIndex(mouse) > -1) {
            this.mice.remove(mouse);
        }
        mouse.kill();
        this.lives -= 1;
        this.score -= 10;
        this.livesText.setText("Lives: " + this.lives);
    },

    /* Check laser-mouse collisions. */
    laserHitMouse: function (mouse, laser) {
        // if (this.mice.getIndex(mouse) > -1) {
        //    this.mice.remove(mouse);
        // }
        mouse.kill();
        laser.kill();
        this.score += Math.round(1 + (1000 - this.cat.x)/100);
    },

    /* Check cat-rat collisions. */
    catHitRat: function (cat, rat) {
        //if (this.rats.getIndex(rat) > -1) {
        //    this.rats.remove(rat);
        //s}
        rat.kill();
        this.lives -= 1;
        this.score -= 10;
    },

    /* Check laser-rat collisions. */
    laserHitRat: function (rat, laser) {
        // if (this.rats.getIndex(rat) > -1) {
        //    this.rats.remove(rat);
        //}
        rat.life -= 1;
        if (rat.life == 0) {
            rat.kill();
            this.score += Math.round(1 + (1000 - this.cat.x)/100);
        }
        laser.kill();
    },

    getPositions: function (cat,mice,rats,lasers) {
      maxLasers = Math.ceil(this.game.width/(this.lasers.bulletSpeed*(this.lasers.fireRate/1000)));
      // Need to find better way to get velocity and replace 200

      //Temporary for Training
      //maxMice = Math.ceil(this.game.width/(200*(this.mouseGenTime/30)));
      //maxRats = Math.ceil(this.game.width/(200*(this.ratGenTime/30)));
      maxMice = 1;
      maxRats = 1;

      data_array = [];
      data_array.push(cat.position.x, cat.position.y);
      numDeadMice = 0;
      numDeadRats = 0;
      for (var i = 0; i < mice.length; i++) {
        if (mice[i].alive == true){
          data_array.push(mice[i].position.x, mice[i].position.y);
        }
        else{
          numDeadMice += 1;
        }
      }
      for (var i = mice.length - numDeadMice; i < maxMice; i++) {
          data_array.push(null, null);
      }

      for (var i = 0; i < rats.length; i++) {
        if(rats[i].alive == true){
          data_array.push(rats[i].position.x, rats[i].position.y);
        }
        else{
          numDeadRats += 1;
        }
      }
      for (var i = rats.length - numDeadRats; i < maxRats; i++) {
          data_array.push(null, null);
      }

      for (var i = 0; i < lasers.length; i++) {
          data_array.push(lasers[i].position.x, lasers[i].position.y);
      }
      for (var i = rats.length; i < maxLasers; i++) {
          data_array.push(null, null);
      }
      // console.log(data_array);
      return data_array;
    },

    getFeatures: function (pos) {
    	// 62 seems to be based on mouse height...have to check this on JS
    	cat_mid_x = pos[0] + 63;
    	// Same for 39
    	cat_mid_y = pos[1] + 40;
    	tile_w = 40;
    	tile_h = 20;
    	nrow = 46;
    	ncol = 50;
      F = Array.apply(null, Array(nrow*ncol + 1)).map(Number.prototype.valueOf,0);
    	//F = [0] * (nrow * ncol + 1);

      //Temporary for Training
      // maxMice = Math.ceil(this.game.width/(200*(this.mouseGenTime/30)));
      maxMice = 1;

      if(pos[2] || pos[2*maxMice+2]) {
        max = Math.max(pos[2],pos[2*maxMice+2]);
        if (max == pos[2]){
          mouseX = pos[2];
          mouseY = pos[3];
        }
        else{
          mouseX = pos[2*maxMice+2];
          mouseY = pos[2*maxMice+3];
        }
        mouse_mid_x = mouseX + 30;
    		mouse_mid_y = mouseY + 34;
    		xDist = cat_mid_x - mouse_mid_x;
    		yDist = cat_mid_y - mouse_mid_y;
    		xCoord = Math.floor(xDist / tile_w);
    		yCoord = Math.floor(yDist / tile_h);
    		xCoord1 = xCoord + ncol / 2;
    		yCoord1 = yCoord + nrow / 2;
    		F[yCoord1 * ncol + xCoord1] = 1;
    	} else {
    		F[nrow*ncol] = 1;
    	}
      //console.log(F.indexOf(1));
      return F;
    }

};

///////////////////////////////////
///            Menu             ///
///////////////////////////////////
var menuState = {
    preload: function () {
        this.game.load.image('background', 'assets/background.png')
    },

    create: function () {
        this.speed = 10;

        this.bg = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'background');
        this.bg.autoScroll(-this.speed, 0);

        var title = {font: "75px Arial", fill: "#fff", align: "center"};
        this.game.add.text(280, 120, "LASERCATS", title);

        var subtitle = {font: "28px Arial", fill: "#fff", align: "center"};
        this.game.add.text(380, 200, "press enter to start", subtitle);
        this.game.add.text(380, 230, "arrow keys to move", subtitle);
        this.game.add.text(380, 260, "shift to accelerate", subtitle);
    },

    update: function () {
        if (this.input.keyboard.isDown(Phaser.Keyboard.ENTER)) {
            this.game.state.start('Game');
        }
    }
};

game.state.add('Game', LaserCats);
game.state.add('Menu', menuState);
game.state.start('Menu');

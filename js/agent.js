/*
 *
 *                  LASERCATS
 *
 *   FILE: agent.js
 *   AUTHORS: M. Jahja
 *   HISTORY:
 *      created.22JAN2016.mjahja with initial agent structure,
 *
 *   Agent object structure.
 *
 */

// Basic human player layout. Sets actions to whatever the keyboard is
// pressing.
function HumanPlayer() {

    this.cursors = game.input.keyboard.createCursorKeys();

    this.actions = {
        up: false,
        down: false,
        left: false,
        right: false,
        shift: false
    };

    // Alternative method for specific keypress.
    this.shift = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);


    // Function to set actions.
    // You'd want to change the value to whatever action you decide upon.
    this.getAction = function () {

        this.actions['up'] = this.cursors.up.isDown;
        this.actions['down'] = this.cursors.down.isDown;
        this.actions['left'] = this.cursors.left.isDown;
        this.actions['right'] = this.cursors.right.isDown;
        this.actions['shift'] = this.shift.isDown;

        // Return!
        return this.actions;

    };

    // Example of how to get mouse positions. This doesn't use it
    // for anything other than printing to console.
    this.sendMousePositions = function (mice) {
        for (var i = 0; i < mice.length; i++) {
            //console.log(mice[i].position); // use position.x or .y for #s
        }
    };

    // this.getPositions = function(cat, mice, rats, lasers, counter) {
    //   data_array = [];
    //   data_array.push(cat.position.x, cat.position.y);
    //
    //   // for (var i = 0; i < mice.length; i++) {
    //   //     console.log(mice[i].position); // use position.x or .y for #s
    //   // }
    //
    //   for (var i = 0; i < mice.length; i++) {
    //        data_array.push(mice[i].position.x, mice[i].position.y);
    //        //console.log(mice[i].position);
    //   }
    //   // for (var i = 0; mice.length <= i < maxMice; i++) {
    //   //     data_array.push(null, null);
    //   // }
    //   //
    //   // for (var i = 0; i < rats.length; i++) {
    //   //     data_array.push(rats[i].position.x, rats[i].position.y);
    //   // }
    //   // for (var i = 0; rats.length <= i < maxRats; i++) {
    //   //     data_array.push(null, null);
    //   // }
    //   //
    //   // for (var i = 0; i < lasers.length; i++) {
    //   //     data_array.push(lasers[i].position.x, lasers[i].position.y);
    //   // }
    //   // for (var i = 0; rats.length <= i < maxLasers; i++) {
    //   //     data_array.push(null, null);
    //   //  }
    //   console.log(data_array);
    // };
}

function AIPlayer() {

  this.getPositions = function(cat, mice, rats, lasers, counter) {
    data_array = [];
    data_array.push(cat.position.x, cat.position.y);

    for (var i = 0; i < mice.length; i++) {
        data_array.push(mice[i].position.x, mice[i].position.y);
    }
    for (var i = mice.length; i < maxMice; i++) {
        data_array.push(null, null);
    }

    for (var i = 0; i < rats.length; i++) {
        data_array.push(rats[i].position.x, rats[i].position.y);
    }
    for (var i = rats.length; i < maxRats; i++) {
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
  };
}

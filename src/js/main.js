

// Loading constants
// let constants = require('../../config/constants.json');
//     Object.keys(constants).forEach(function (key){
//         window[key] = constants[key];
//     });
//

// window.DEBUG = false;
//
// require("script-loader!./util/globals.js");
// require("script-loader!./util/resizer.js");
// require("script-loader!./util/round.js");
// require("script-loader!./util/dist.js");
// require("script-loader!./util/array-remove.js");
// require("script-loader!./util/between.js");
// require("script-loader!./util/normalize-angle.js");
// require("script-loader!./util/interp.js");
// require("script-loader!./util/rand.js");
// require("script-loader!./util/pick.js");
// require("script-loader!./util/angle-between.js");
// require("script-loader!./util/perlin.js");
// require("script-loader!./util/format-time.js");
//
// require("script-loader!./graphics/particle.js");
// require("script-loader!./graphics/square-focus.js");
// require("script-loader!./graphics/cache.js");
// require("script-loader!./graphics/font.js");
// require("script-loader!./graphics/indicator.js");
// require("script-loader!./graphics/announcement.js");
// require("script-loader!./graphics/fake-mouse.js");
// require("script-loader!./graphics/fake-cursor.js");
// require("script-loader!./graphics/select-help.js");
//
// require("script-loader!./units/unit.js");
//
// require("script-loader!./ai/behavior.js");
// require("script-loader!./ai/idle.js");
// require("script-loader!./ai/chase.js");
// require("script-loader!./ai/reach.js");
// require("script-loader!./ai/autonomous.js");
//
// require("script-loader!./cursors/cursor.js");
// require("script-loader!./cursors/chase-cursor.js");
// require("script-loader!./cursors/attack-cursor.js");
// require("script-loader!./cursors/heal-cursor.js");
// require("script-loader!./cursors/reach-cursor.js");
// require("script-loader!./cursors/selection-cursor.js");
//
// require("script-loader!./world/world.js");
// require("script-loader!./world/menu-world.js");
// require("script-loader!./world/gameplay-world.js");
// require("script-loader!./world/camera.js");
// require("script-loader!./world/polygon.js");
// require("script-loader!./world/cube.js");
// require("script-loader!./world/generate.js");
//
// require("script-loader!./time-data.js");
// require("script-loader!./beacon.js");
// require("script-loader!./teams.js");
// require("script-loader!./keyboard.js");
// require("script-loader!./mouse.js");
// require("script-loader!./game.js");
// require("script-loader!./main.js");


// Make Math global
const m = Math;
Object.getOwnPropertyNames(m).forEach(n => w[n] = w[n] || m[n]);

onload = () => {
   /* console.log();
    let {innerWidth: width, innerHeight: height} = w;*/
    C = D.querySelector('canvas');
    C.width = CANVAS_WIDTH      /*= width;*/
    C.height = CANVAS_HEIGHT    /*= height;*/
    R = C.getContext('2d',{ alpha: false });


    // Shortcut for all canvas methods
    const p = CanvasRenderingContext2D.prototype;
    p.wrap = function(f) {
        this.save();
        f();
        this.restore();

    };
    
    p.fr = p.fillRect;
    // assign canvas rendering context method to global variables
    // wrap = p.wrap
    Object.getOwnPropertyNames(p).forEach(n => {
        if (R[n] && R[n].call) {
            w[n] = p[n].bind(R);
        }
    });

    onresize();
    new Game({renderingContext: R, rendered: C});
};

onresize = () => {
    let mw = innerWidth,
        mh = innerHeight,

        ar = mw / mh, // available ratio
        br = CANVAS_WIDTH / CANVAS_HEIGHT, // base ratio
        // CH = CW / br
        width,
        height,
        style = D.getElementById('viewport').style;
    if (ar <= br) {
        width = mw;
        height = width / br;
    } else {
        height = mh;
        width = height * br;
    }

    style.width = width + 'px';
    style.height = height + 'px';
};

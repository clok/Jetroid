ig.module(
    'plugins.minimap'
)
    .requires(
    'impact.entity'
)
    .defines(function(){

        Minimap = ig.Class.extend({

            map: null,

            init: function(map)
            {
                this.map = ig.game.backgroundMaps[0];
                console.log("map reference", this.map);

                this.s = ig.system.scale; // we'll need this a lot

                // resize the tileset, so that one tile is 's' pixels wide and high
                this.ts = ig.$new('canvas');
                var tsctx = this.ts.getContext('2d');

                this.w = this.map.tiles.width * this.s;
                this.h = this.map.tiles.height * this.s;
                this.ws = this.w / this.map.tilesize;
                this.hs = this.h / this.map.tilesize;
                tsctx.drawImage( this.map.tiles.data, 0, 0, this.w, this.h, 0, 0, this.ws, this.hs );

                // create the minimap canvas
                /*var mapCanvas = ig.system.context;
                 mapCanvas.width = map.width * s;
                 mapCanvas.height = map.height * s;*/
                this.ctx = ig.system.context;
            },
            draw: function ()
            {
                //this.parent();

                console.log("Running");


                /*if( ig.game.clearColor ) {
                    ctx.fillStyle = ig.game.clearColor;
                    ctx.fillRect(0, 0, this.w, this.h);
                }*/

                // draw the map
                var tile = 0;
                for( var x = 0; x < this.map.width; x++ ) {
                    for( var y = 0; y < this.map.height; y++ ) {
                        if( (tile = this.map.data[y][x]) ) {
                            this.ctx.drawImage(
                                this.ts,
                                Math.floor(((tile-1) * this.s) % this.ws),
                                Math.floor((tile-1) * this.s / this.ws) * this.s,
                                this.s, this.s,
                                x * this.s, y * this.s,
                                this.s, this.s
                            );
                        }
                    }
                }
            }

        });
});
/*
* var s = ig.system.scale; // we'll need this a lot

 // resize the tileset, so that one tile is 's' pixels wide and high
 var ts = ig.$new('canvas');
 var tsctx = ts.getContext('2d');

 var w = map.tiles.width * s;
 var h = map.tiles.height * s;
 var this.ws = w / map.tilesize;
 var this.hs = h / map.tilesize;
 tsctx.drawImage( map.tiles.data, 0, 0, w, h, 0, 0, this.ws, this.hs );

 // create the minimap canvas
 var mapCanvas = ig.$new('canvas');
 mapCanvas.width = map.width * s;
 mapCanvas.height = map.height * s;
 var ctx = mapCanvas.getContext('2d');

 if( ig.game.clearColor ) {
 ctx.fillStyle = ig.game.clearColor;
 ctx.fillRect(0, 0, w, h);
 }

 // draw the map
 var tile = 0;
 for( var x = 0; x < map.width; x++ ) {
 for( var y = 0; y < map.height; y++ ) {
 if( (tile = map.data[y][x]) ) {
 ctx.drawImage(
 ts,
 Math.floor(((tile-1) * s) % this.ws),
 Math.floor((tile-1) * s / this.ws) * s,
 s, s,
 x * s, y * s,
 s, s
 );
 }
 }
 }
*
* */
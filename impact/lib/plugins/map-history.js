ig.module(
	'plugins.map-history'
)
.requires(
	'impact.background-map'
)
.defines(function() {
    ig.BackgroundMap.prototype.history = [];
    ig.BackgroundMap.prototype.activeTiles = [];
    
	ig.BackgroundMap.prototype.getTileID = function(row, column)
    {
        return (row * this.tilesize + column).floor();
    };
	ig.BackgroundMap.prototype.drawTiled = function() {
        var tile = 0,
			anim = null,
			tileOffsetX = (this.scroll.x / this.tilesize).toInt(),
			tileOffsetY = (this.scroll.y / this.tilesize).toInt(),
			pxOffsetX = this.scroll.x % this.tilesize,
			pxOffsetY = this.scroll.y % this.tilesize,
			pxMinX = -pxOffsetX - this.tilesize,
			pxMinY = -pxOffsetY - this.tilesize,
			pxMaxX = ig.system.width + this.tilesize - pxOffsetX,
			pxMaxY = ig.system.height + this.tilesize - pxOffsetY;


		// FIXME: could be sped up for non-repeated maps: restrict the for loops
		// to the map size instead of to the screen size and skip the 'repeat'
		// checks inside the loop.

		for( var mapY = -1, pxY = pxMinY; pxY < pxMaxY; mapY++, pxY += this.tilesize) {
			var tileY = mapY + tileOffsetY;

			// Repeat Y?
			if( tileY >= this.height || tileY < 0 ) {
				if( !this.repeat ) { continue; }
				tileY = tileY > 0
					? tileY % this.height
					: ((tileY+1) % this.height) + this.height - 1;
			}

			for( var mapX = -1, pxX = pxMinX; pxX < pxMaxX; mapX++, pxX += this.tilesize ) {
				var tileX = mapX + tileOffsetX;

				// Repeat X?
				if( tileX >= this.width || tileX < 0 ) {
					if( !this.repeat ) { continue; }
					tileX = tileX > 0
						? tileX % this.width
						: ((tileX+1) % this.width) + this.width - 1;
				}

				// Draw!
				if( (tile = this.data[tileY][tileX]) ) {
					if( (anim = this.anims[tile-1]) ) {
						anim.draw( pxX, pxY );
					}
					else {
                        ig.system.context.globalAlpha = 1;
                        var newTile = this.getTileID(tileY, tileX-1);
                        if(this.history[newTile]) {
                            if (!this.activeTiles[newTile]) {
                                ig.system.context.globalAlpha = .2;;
                            }
                            this.tiles.drawTile(pxX, pxY, tile - 1, this.tilesize);
                            //Always make sure we reset this before the next draw
                            if(ig.system.context.globalAlpha < 1)
                                ig.system.context.globalAlpha = 1;
                        }
					}
				}
			} // end for x
		} // end for y
	};
});

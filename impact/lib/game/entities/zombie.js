ig.module(
	'game.entities.zombie'
)
.requires(
	'impact.entity',
	'impact.sound'
)
.defines(function(){

EntityZombie = ig.Entity.extend({
    animSheet: new ig.AnimationSheet( 'media/zombie.png', 16, 16 ),
    size: {x: 8, y:14},
    offset: {x: 4, y: 2},
    maxVel: {x: 100, y: 100},
    flip: false,
    friction: {x: 150, y: 0},
    speed: 14,
    type: ig.Entity.TYPE.B,
    checkAgainst: ig.Entity.TYPE.A,
    collides: ig.Entity.COLLIDES.PASSIVE,
    spawner: null,
    ai: 0,
    deathSFX: new ig.Sound( 'media/sounds/Death.*' ),
    fallOutOfBoundsSFX: new ig.Sound( 'media/sounds/PlayerMonserFall.*' ),
    hitSoftSFX: new ig.Sound( 'media/sounds/HitSoft.*' ),
    map: null,
    init: function( x, y, settings ) {
    	this.parent( x, y, settings );
        this.spawner = settings.spawner;
        this.setupAnimation(settings.spriteOffset ? settings.spriteOffset : 0);
        this.ai = EntityZombie.AI.PLATFORMER;
        this.map = ig.game.backgroundMaps[0];

    },
    setupAnimation: function(offset){
        offset = offset * 8;
        this.addAnim('walk', .07, [0+offset,1+offset,2+offset,3+offset,4+offset,5+offset]);
    },
    update: function() {
        // near an edge? return!
        if (ig.game.collisionMap.getTile(
            this.pos.x + (this.flip ? +4 : this.size.x - 4),
            this.pos.y + this.size.y + 1
        ) == 0
            ) {
            this.flip = !this.flip;
        }
        var xdir = this.flip ? -1 : 1;
        this.vel.x = this.speed * xdir;
        this.currentAnim.flip.x = this.flip;
        this.parent();
    },
    handleMovementTrace: function( res ) {
    	this.parent( res );
    	// collision with a wall? return!
    	if( res.collision.x ) {
    		this.flip = !this.flip;
    	}
    },
    check: function( other ) {
    	//other.receiveDamage( 10, this );
    },
    receiveDamage: function(value, from){

        this.parent(value, from);
        if(this.health > 0)
        {
    		ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {particles: 2, colorOffset: 1});
            this.hitSoftSFX.play();
        }
        else
        {
            ig.game.stats.kills ++;
        }
    },
    kill: function(noAnimation){
        this.parent();
        if(!noAnimation)
        {
            ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {colorOffset: 1});
            this.deathSFX.play();
        }
        if(this.spawner)
            this.spawner.removeItem();

    },
    outOfBounds: function()
    {
        this.kill(true);
        if(this.spawner)
            this.spawner.outOfBounds();
        this.fallOutOfBoundsSFX.play();
    },
    collideWith: function( other, axis ) {

        // check for crushing damage from a moving platform (or any FIXED entity)
        if (other.collides == ig.Entity.COLLIDES.FIXED && this.touches(other)) {
            // we're still overlapping, but by how much?
            //console.log("collideWidth");
            var overlap;
            var size;
            if (axis == 'y') {
                size = this.size.y;
                if (this.pos.y < other.pos.y) overlap = this.pos.y+this.size.y - other.pos.y;
                else overlap = this.pos.y - (other.pos.y+other.size.y);
            }else{
                size = this.size.x;
                if (this.pos.x < other.pos.x) overlap = this.pos.x+this.size.x - other.pos.x;
                else overlap = this.pos.x - (other.pos.x+other.size.x);
            }
            overlap = Math.abs(overlap);

            // overlapping by more than 1/2 of our size?
            if (overlap > 3) {
                // we're being crushed - this is damage per-frame, so not 100% the same at different frame rates
                this.kill();
            }
        }
    },
    getTileX: function(value)
    {
        return ( this.pos.x / 20 ).floor()-1;
    },
    getTileY: function(value)
    {
        return ( this.pos.y / 20 ).floor();
    },
    draw:function()
    {
        var tx = this.getTileX();
        var ty = this.getTileY();
        //var newTile = this.map.getTileID(ty, tx);
        //TODO need to optimize this
        var map = ig.game.backgroundMaps[0];
        if(!map.activeTiles[map.getTileID(ty, tx)])
            return;
        this.parent();
    }
});

EntityZombie.AI = {
    WONDERER: 0,
    HUNTER: 1,
    FOLLOWER: 2,
    PLATFORMER: 3,
    JUMPER: 4
};
});

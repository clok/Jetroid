/*
This entity calls the triggeredBy( entity, trigger ) method of each of its
targets. #entity# is the entity that triggered this trigger and #trigger# 
is the trigger entity itself.


Keys for Weltmeister:

checks
	Specifies which type of entity can trigger this trigger. A, B or BOTH 
	Default: A

wait
	Time in seconds before this trigger can be triggered again. Set to -1
	to specify "never" - e.g. the trigger can only be triggered once.
	Default: -1
	
target.1, target.2 ... target.n
	Names of the entities whose triggeredBy() method will be called.
*/

ig.module(
	'game.entities.outofbounds'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityOutofbounds = ig.Entity.extend({
	size: {x: 20, y: 20},
	checkAgainst: ig.Entity.TYPE.A,
    gravityFactor:0,
    animSheet: new ig.AnimationSheet('media/exit.png', 20, 20),
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
        this.addAnim('idle', 1, [0]);
	},
	check: function( other ) {
		if(other.outOfBounds)
            other.outOfBounds();
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
    },
	//update: function(){}
});

});
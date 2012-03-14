/*
 Simpler spawner that will create an instance of a class based on a delay


 Keys for Weltmeister:

 delay
 Delay between each spawn in seconds. Default value is 4.

 spawnEntity
 Name of the Entity class to spawn. Example:
 spawnEntity: EntityZombie

 */
ig.module(
	'game.entities.powerupspawner'
)
.requires(
    'game.entities.spawner'
)
.defines(function(){

EntityPowerupspawner = EntitySpawner.extend({
    powerUp: 0,
    /*spawnEntity: "EntityZombie",*/
    init: function( x, y, settings ) {
    	this.parent( x, y, settings );
        this.idleTimer = new ig.Timer();
    },
    outOfBounds: function(){
        this.powerUp ++;
    },
    spawnNewEntity:function()
    {
        var settings = {flip:Math.round(Math.random()), spawner:this};
        if(this.powerUp > 0)
        {
            settings.spriteOffset = 1;
            settings.speed = 28;

            this.powerUp --;
            if(this.powerUp < 0)
                this.powerUp = 0;
        }
        this.parent(settings);
    }
});
});

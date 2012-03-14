ig.module(
    'game.entities.crate'
)
    .requires(
    'impact.entity',
    'impact.sound'
)
    .defines(function () {

        EntityCrate = ig.Entity.extend({
            animSheet:new ig.AnimationSheet('media/crate.png', 10, 10),
            size:{x:10, y:10},
            maxVel:{x:0, y:100},
            flip:false,
            friction:{x:0, y:0},
            type:ig.Entity.TYPE.NONE,
            checkAgainst:ig.Entity.TYPE.A,
            collides:ig.Entity.COLLIDES.ACTIVE,
            spawner:null,
            life:20,
            hitHardSFX: new ig.Sound( 'media/sounds/HitHard.*' ),
            spriteOffset: 0,
            labels: ["Some Air", "Some Power", "Some Health", "An Artifact", "A New Life Form", "Treasure"],
            deathSFX: new ig.Sound( 'media/sounds/Death.*' ),
            init:function (x, y, settings) {
                this.parent(x, y, settings);
                this.spawner = settings.spawner;
                console.log("spriteOffset", settings.spriteOffset);
                this.setupAnimation(settings.spriteOffset ? settings.spriteOffset : 0);
            },
            setupAnimation:function (offset) {
                //offset = offset * 8;
                this.addAnim('idle', .07, [0 + offset]);
            },
            receiveDamage:function (value) {
                this.parent(value);
                if (this.health > 0) {
                    ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {particles:2, colorOffset:3});
                    this.hitHardSFX.play();
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
            },
            check: function( other ) {
                this.kill();
                console.log("order", other);
                ig.game.displayInstructions("You Found "+this.labels[this.spriteOffset]);
                //TODO need to add logic to fill in values

                switch(this.spriteOffset)
                {
                    case 0:
                        //Found air
                        other.air = other.airMax;
                        break;
                    case 1:
                        //Found air
                        other.power = other.powerMax;
                        break;
                    case 2:
                        //Found air
                        other.life = other.lifeMax;
                        break;
                    case 3:
                        //Found air
                        ig.game.stats.artifact +=1;
                        break;
                    case 4:
                        //Found air
                        ig.game.stats.lifeform +=1;
                        break;
                    case 5:
                        //Found air
                        ig.game.stats.treasure +=1;
                        break;

                }
            }
        });
    });

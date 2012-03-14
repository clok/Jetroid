ig.module(
    'game.entities.player'
)
.requires(
    'impact.entity',
    'impact.sound'
)
.defines(function(){
    EntityPlayer = ig.Entity.extend({
        animSheet: new ig.AnimationSheet( 'media/player.png', 16, 16 ),
        size: {x: 8, y:14},
        offset: {x: 4, y: 2},
        flip: false,
        maxVel: {x: 100, y: 150},
        friction: {x: 600, y: 20},
        accelGround: 400,
        accelAir: 200,
        jump: 200,
        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.NONE,
        collides: ig.Entity.COLLIDES.PASSIVE,
        weapon: 0,
        activeWeapon: "none",
        startPosition: null,
        invincible: false,
        invincibleDelay: 2,
        instructionsTimer:null,
        emptySFX: new ig.Sound( 'media/sounds/Empty.*' ),
        jumpSFX: new ig.Sound( 'media/sounds/Jump.*' ),
        deathSFX: new ig.Sound( 'media/sounds/Death.*' ),
        fallOutOfBoundsSFX: new ig.Sound( 'media/sounds/PlayerMonserFall.*' ),
        powerUpSFX: new ig.Sound( 'media/sounds/Powerup.*' ),
        powerUp2SFX: new ig.Sound( 'media/sounds/Powerup2.*' ),
        shotPressed: false,
        fireDelay: null,
        fireRate: 0,
        currentDoor: null,
        inDoor: false,
        bounciness: 0.2,

        powerMax: 100,
        power: 0,
        powerTimer:null,
        powerDelay:.07,
        powerDownRate: 2,
        powerRechargeRate: 1,

        airMax: 100,
        air: 0,
        airTimer:null,
        airDelay:1,
        airDownRate: 1,

        healthMax: 10,
        health: 10,

        fallDistance: 0,
        maxFallDistance: 10000,
        init: function( x, y, settings ) {
        	this.parent( x, y, settings );

            this.power = this.powerMax;
            this.air = this.airMax;

            this.setupAnimation(this.weapon);
            this.startPosition = {x:x,y:y};
            this.instructionsTimer = new ig.Timer();
            this.fireDelay = new ig.Timer();

            this.powerTimer = new ig.Timer();
            this.airTimer = new ig.Timer();

            //TODO maybe this should be moved into the load level code of the game class
            // Make sure we are not in the editor
            /*if(typeof wm == "undefined")
            {

            }*/
        },
        setupAnimation: function(offset){
            offset = offset * 14;
            this.addAnim('idle', 1, [0+offset]);
            this.addAnim('run', .07, [0+offset,1+offset,2+offset,3+offset,4+offset,5+offset]);
            this.addAnim('jump',.07, [9+offset, 10+offset, 11+offset, 12+offset]);
            this.addAnim('jumpEmpty',1, [13+offset]);
            this.addAnim('fall', 0.4, [6+offset,7+offset]);
        },
        makeInvincible: function(){
            this.invincible = true;
            this.instructionsTimer.reset();
        },
        update: function() {
              // move left or right
        	if(!this.inDoor)
            {
                var accel = this.standing ? this.accelGround : this.accelAir;
                if( ig.input.state('left') ) {
                    this.accel.x = -accel;
                    this.flip = true;
                }else if( ig.input.state('right') ) {
                    this.accel.x = accel;
                    this.flip = false;
                }else{
                    this.accel.x = 0;
                }
                // jump
                if( ig.input.pressed('jump') ) {
                    console.log("fire rocket");
                    this.powerTimer.reset();
                    this.jumpPressed = true;
                }
                if( ig.input.released('jump') ) {
                    console.log("release rocket");
                    this.jumpPressed = false;
                }
                // shoot
                if( ig.input.pressed('shoot') ) {
                    this.fireWeapon();
                }

                if(this.shotPressed)
                {

                    if(( this.fireDelay.delta() > this.fireRate )&& (this.power > 0)) {
                        this.fireWeapon();
                        this.fireDelay.reset();
                    }
                }

                if(ig.input.released('shoot'))
                {
                    this.shotPressed = false;
                }

                // set the current animation, based on the player's speed
                if( this.vel.y < 0 ) {
                    this.currentAnim = this.anims.jump;
                    //TODO this needs to be cleaned up since fallDistance is reset
                    this.fallDistance = 0;
                }else if( this.vel.y > 0 ) {
                    if(this.power > 0 && this.jumpPressed)
                        this.currentAnim = this.anims.jump;
                    else
                        this.currentAnim = this.anims.fall;
                    this.fallDistance += this.vel.y;
                }else if( this.vel.x != 0 && this.standing) {
                    this.currentAnim = this.anims.run;
                    this.fallDistance = 0;
                }else {
                    if(this.power > 0 && this.jumpPressed)
                        this.currentAnim = this.anims.jump;
                    else
                        this.currentAnim = this.anims.idle;
                    this.fallDistance = 0;

                }

                this.currentAnim.flip.x = this.flip;
                if( this.instructionsTimer.delta() > this.invincibleDelay ) {
                    this.invincible = false;
                    this.currentAnim.alpha = 1;
                }
            }
            else
            {
                this.currentAnim.alpha = 0;
            }

            if(ig.input.pressed('up') && this.standing)
            {
                if(this.currentDoor && !this.inDoor)
                {
                    //console.log("Can Enter Door");
                    this.openDoor();
                }
                else
                {
                    //console.log("Can't Enter Door");
                    this.exitDoor();
                }
            }

            // Accelerate up
            if(ig.input.state("jump"))
            {
                if(this.power > 0)
                {
                    this.vel.y -= 9;
                    this.fallDistance -= this.vel.y;
                }

            }

            if( this.powerTimer.delta() > this.powerDelay ) {
                if(ig.input.state("jump"))
                {

                    if(this.power > 0)
                        this.power -= this.powerDownRate;
                }
                else
                {
                    if(this.power <= this.powerMax)
                    this.power += this.powerRechargeRate;
                }

                this.powerTimer.reset();
            }

            if( this.airTimer.delta() > this.airDelay ) {
                if(this.air > 0)
                    this.air -= this.powerDownRate;
                else
                    this.receiveDamage(1);

                this.airTimer.reset();
            }

            //console.log("Power", this.power, this.power/this.maxPower);

            //TODO need to handle recharge
            //console.log("this.fallDistance", this.fallDistance);
        	// move!
        	this.parent();
            this.currentDoor = null;
        },
        atDoor: function(door)
        {
            this.currentDoor = door;
        },
        openDoor: function()
        {
            if(this.currentDoor)
            {
                this.currentDoor.open(this);
                this.visible = false;
                this.inDoor = true;
                this.vel.x = this.vel.y = 0;
                this.accel.x = this.accel.y = 0;
            }
        },
        exitDoor: function()
        {
            if(this.currentDoor)
            {
                this.currentDoor.close();
                this.visible = true;
                this.inDoor = false;
                ig.game.stats.doors ++;
            }
        },
        equip:function(id, hideMessage)
        {
            var text = "";

            if(this.weapon == id)
            {
                ig.game.stats.ammo += 10;
                text = "You Found More Ammo";
            }
            else
            {

                this.weapon = id;
                if(this.weapon != 0)
                {
                    this.powerUpSFX.play();

                    ig.game.stats.ammo = 10;

                    switch(this.weapon){
                        case(1): default:
                            this.activeWeapon = "EntityBullet";
                            text = "You Found A Gun!";
                            break;
                        case(2):
                            this.activeWeapon = "EntityShotgunShell";
                            text = "You Found A Shotgun!";
                            break;
                        case(3):
                            this.activeWeapon = "EntityMachineGun";
                            text = "You Found A Machine Gun!";
                            break;
                        case(4):
                            this.activeWeapon = "EntityGrenade";
                            text = "You Found Grenades!";
                            break;
                        case(5):
                            this.activeWeapon = "EntityMine";
                            text = "You Found Land Mines!";
                            break;
                    }
                }
                else
                {
                    this.activeWeapon = "none";
                    text = "You Are Out Of Ammo, Find A Door!";
                }
                this.setupAnimation(this.weapon);
            }

            if(!hideMessage && text != "")
                ig.game.displayInstructions(text);

        },
        fireWeapon: function(){
            if(this.activeWeapon == "none")
                return;

            var entity = ig.game.spawnEntity( this.activeWeapon, this.pos.x, this.pos.y, {flip:this.flip} );
            //this.shootSFX.play();
            this.shotPressed = entity.automatic;

            this.fireRate = entity.automatic ? entity.fireRate : 0;

            var accel = this.standing ? this.accelGround : this.accelAir;
            if( !this.flip ) {
                this.accel.x = -accel * entity.recoil;
            }else {
                this.accel.x = accel * entity.recoil;
            }
            this.fireDelay.reset();

            //TODO need to let each weapon have its own power drain
            this.power --;
            /*if(ig.game.stats.ammo < 1)
            {
                this.equip(0);
                this.emptySFX.play();
            }*/
        },
        kill: function(noAnimation){

            this.parent();
            //TODO this is probably not needed anymore
            ig.game.respawnPosition = this.startPosition;

            if(!noAnimation)
            {
                ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {callBack:this.onDeath} );
                this.deathSFX.play();

                //TODO need to make this cleaner... just nulling out stats to not display them
                ig.game.stats = null;
            }
            else
            {
                this.onDeath();
            }
        },
        outOfBounds: function()
        {
            ig.game.setDeathMessage("You Return To The Surface!");
            this.kill(true);
            this.fallOutOfBoundsSFX.play();
        },
        onDeath: function(){
            ig.game.gameOver();
        },
        receiveDamage: function(amount, from){
            if(this.invincible || this.inDoor)
                return;

            //TODO need to calculate if the player is going to die and by what
            if(this.air < 1)
                ig.game.setDeathMessage("You Suffocated!");
            else
                ig.game.setDeathMessage("You Have Been Killed!");
            this.parent(amount, from);
        },
        draw: function(){
            if(this.invincible)
                this.currentAnim.alpha = this.instructionsTimer.delta()/this.invincibleDelay * 1 ;
            this.parent();
        },
        handleMovementTrace: function (res) {

            this.parent(res);

            //TODO need to add some kind of check to make sure we are not calling this too many times


            this.registerTile();

            if((res.collision.y) && (this.fallDistance > this.maxFallDistance))
            {
                ig.game.setDeathMessage("You Fell To Your Death!");
                this.kill();
            }
        },
        registerTile: function()
        {
            //console.log("tile", x,y, Math.round(this.pos.x/20))
            //var tileSize = ig.game.backgroundMaps[0].tilesize;
            var map = ig.game.backgroundMaps[0];

            var tx = this.getTileX();
            var ty = this.getTileY();
            var newTile = map.getTileID(ty, tx);

            if(newTile != this.lastTile)
            {
                this.lastTile = newTile;
                //Surrounding Tiles
                map.history[map.getTileID(ty-1, tx-1)]=1;
                map.history[map.getTileID(ty, tx-1)]=1;
                map.history[map.getTileID(ty+1, tx-1)]=1;
                map.history[map.getTileID(ty-1, tx)]=1;
                map.history[map.getTileID(ty, tx)]=1;
                map.history[map.getTileID(ty+1, tx)]=1;
                map.history[map.getTileID(ty-1, tx+1)]=1;
                map.history[map.getTileID(ty, tx+1)]=1;
                map.history[map.getTileID(ty+1, tx+1)]=1;

                //TODO this could be optimized
                map.activeTiles =[];
                map.activeTiles[map.getTileID(ty-1, tx-1)]=1;
                map.activeTiles[map.getTileID(ty, tx-1)]=1;
                map.activeTiles[map.getTileID(ty+1, tx-1)]=1;
                map.activeTiles[map.getTileID(ty-1, tx)]=1;
                map.activeTiles[map.getTileID(ty, tx)]=1;
                map.activeTiles[map.getTileID(ty+1, tx)]=1;
                map.activeTiles[map.getTileID(ty-1, tx+1)]=1;
                map.activeTiles[map.getTileID(ty, tx+1)]=1;
                map.activeTiles[map.getTileID(ty+1, tx+1)]=1;
            }
        },
        getTileX: function(value)
        {
            return ( this.pos.x / 20 ).floor()-1;
        },
        getTileY: function(value)
        {
            return ( this.pos.y / 20 ).floor();
        }
    });

    EntityDeathExplosion = ig.Entity.extend({
        delay: 1,
        callBack: null,
        particles: 25,
        init: function( x, y, settings ) {
            this.parent( x, y, settings );
                for(var i = 0; i < this.particles; i++)
                    ig.game.spawnEntity(EntityDeathExplosionParticle, x, y, {colorOffset: settings.colorOffset ? settings.colorOffset : 0});
                this.idleTimer = new ig.Timer();
            },
            update: function() {
                if( this.idleTimer.delta() > this.delay ) {
                    this.kill();
                    if(this.callBack)
                        this.callBack();
                    return;
                }
            }
    });
    EntityDeathExplosionParticle = ig.Entity.extend({
        size: {x: 2, y: 2},
        maxVel: {x: 160, y: 200},
        delay: 2,
        fadetime: 1,
        bounciness: 0,
        vel: {x: 100, y: 30},
        friction: {x:100, y: 0},
        collides: ig.Entity.COLLIDES.LITE,
        colorOffset: 0,
        totalColors: 7,
        animSheet: new ig.AnimationSheet( 'media/blood.png', 2, 2 ),
        init: function( x, y, settings ) {
            this.parent( x, y, settings );
            var frameID = Math.round(Math.random()*this.totalColors) + (this.colorOffset * (this.totalColors+1));
            this.addAnim( 'idle', 0.2, [frameID] );
            this.vel.x = (Math.random() * 2 - 1) * this.vel.x;
            this.vel.y = (Math.random() * 2 - 1) * this.vel.y;
            this.idleTimer = new ig.Timer();
        },
        update: function() {
            if( this.idleTimer.delta() > this.delay ) {
                this.kill();
                return;
            }
            this.currentAnim.alpha = this.idleTimer.delta().map(
                this.delay - this.fadetime, this.delay,
                1, 0
            );
            this.parent();
        }
    });

});

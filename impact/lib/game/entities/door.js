ig.module(
	'game.entities.door'
)
.requires(
	'impact.entity',
    'impact.sound'
)
.defines(function(){

EntityDoor = ig.Entity.extend({
    animSheet: new ig.AnimationSheet( 'media/door.png', 16, 32 ),
    size: {x: 16, y:32},
    maxVel: {x: 0, y: 0},
    friction: {x: 0, y: 0},
    type: ig.Entity.TYPE.NONE,
    checkAgainst: ig.Entity.TYPE.A,
    collides: ig.Entity.COLLIDES.NONE,
    zIndex:-1,
    locked: false,
    weapons: 5,
    isClosing: false,
    isOpening: false,
    doorSFX: new ig.Sound( 'media/sounds/OpenDoor.*' ),
    init: function( x, y, settings ) {
    	this.parent( x, y, settings );
        this.addAnim('idle', 1, [0], true);
        this.addAnim('open', .1, [0,1, 2, 3, 2, 1,0], true);
        this.addAnim('locked', 1, [4], true);
        this.activate(this.locked);
    },
    check: function( other ) {
        if(this.locked || this.isClosing || this.isOpening)
            return;

        if(other.atDoor && (other.pos.x > (this.pos.x)))
            other.atDoor(this);

    },
    receiveDamage: function(value){
        // Do nothing
    },
    open: function(target)
    {
        this.isOpening= true;
        //this.currentAnim
        this.target = target;
        this.currentAnim = this.anims.open;
        this.currentAnim.rewind();
        this.doorSFX.play();
    },
    onOpen: function()
    {
        this.isOpening= false;
        var wid = Math.floor(Math.random() * this.weapons) + 1;
        this.target.equip(wid);
    },
    update: function() {
        this.parent();
        if ( this.currentAnim == this.anims.open ){
            if ( this.currentAnim.loopCount ) {
//                //Shot has played through all the way. Go to idle animation

               // this.currentAnim = this.anims.idle;
                if(this.isClosing)
                    this.onClose();
                if(this.isOpening)
                    this.onOpen()
            }
        }
    },
    close: function()
    {
        this.isClosing = true;

        this.currentAnim = this.anims.open;
        this.currentAnim.rewind();
        this.doorSFX.play();

    },
    onClose: function()
    {
        //TODO this should
        this.isClosing = false;
        this.kill();
    },
    activate: function(value){
        if(!value)
        {
            this.currentAnim = this.anims.idle;
        }else{
                this.currentAnim = this.anims.locked;
        }
        this.locked = value;
    },
    kill: function()
    {
        this.parent();
        this.spawner.removeItem();
    }
});
});

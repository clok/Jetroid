ig.module(
	'game.entities.levelexit'
)
.requires(
	'impact.entity',
	'game.entities.door'
)
.defines(function(){

    EntityLevelexit = EntityDoor.extend({
        onOpen: function(){
        	if (this.level) {
        		var levelName = this.level.replace(/^(Level)?(\w)(\w*)/, function(m, l, a, b) {
        		return a.toUpperCase() + b;
        	});
            ig.game.currentLevelName = levelName;
        	ig.game.loadLevelDeferred(ig.global['Level' + levelName]);
        	}
        }
    });
});

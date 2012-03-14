ig.module(
    'game.menus.menu'
)
    .requires(
    'impact.entity',
    'plugins.impact-storage'
)
    .defines(function(){

        EntityPauseMenu = ig.Entity.extend({
            statText:new ig.Font('media/04b03.font.png'),
            init:function (x, y, settings) {
                this.parent(x, y, settings);
                this.addKeyListeners();
            },
            addKeyListeners:function () {

            }
        })

        EntityPauseMenu = EntityPauseMenu.extend({
            stats:null,
            ignorePause:true,
            title:"Pause",
            instructions:"Press Escape To Resume Or Q To Quit.",
            draw:function () {
                // Draw all entities and backgroundMaps
                this.parent();
                //if(this.showStats){
                ig.system.context.fillStyle = 'rgba(0,0,0,0.8)';
                ig.system.context.fillRect(0 * ig.system.scale, 0 * ig.system.scale, ig.system.width * ig.system.scale, ig.system.height * ig.system.scale);
                var x = ig.system.width / 2;
                var y = ig.system.height / 2 - 40;
                this.statText.draw(this.title, x, y, ig.Font.ALIGN.CENTER);
                this.statText.draw(this.instructions, x, ig.system.height - 10, ig.Font.ALIGN.CENTER);
                if (this.stats) {

                    // deaths:0, artifact:0, lifeform:0, treasure
                    //TODO need to add in 's' or remove it based on what was collected
                    this.statText.draw('Time: ' + this.stats.time.toString().padString(3)+" x10 pts", x, y + 30, ig.Font.ALIGN.CENTER);
                    this.statText.draw('Artifacts: ' + this.stats.artifact.toString().padString(2)+" x50 pts", x, y + 40, ig.Font.ALIGN.CENTER);
                    this.statText.draw('Life Forms: ' + this.stats.lifeform.toString().padString(2)+" x100 pts", x, y + 50, ig.Font.ALIGN.CENTER);
                    this.statText.draw('Treasure: ' + this.stats.treasure.toString().padString(2)+" x150 pts", x, y + 60, ig.Font.ALIGN.CENTER);
                    this.statText.draw('Score: ' + this.stats.score.toString().padString(6), x, y + 80, ig.Font.ALIGN.CENTER);
                }


            }

        })

        EntityGameOverMenu = EntityPauseMenu.extend({
            instructions:"Press Spacebar To Try Again Or Q To Quit.",
            init:function (x, y, settings) {
                this.parent(x, y, settings);
                //TODO this should be passed in and not taken from the game class
                this.title = ig.game.deathMessage;
            },
            addKeyListeners:function () {

            }

        })
    }
)
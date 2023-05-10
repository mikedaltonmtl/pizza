class Overworld {
 constructor(config) {
   this.element = config.element;
   this.canvas = this.element.querySelector(".game-canvas");
   this.ctx = this.canvas.getContext("2d");
   this.map = null;
 }

  startGameLoop() {
    const step = () => {
      //Clear off the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      //Establish the camera person
      const cameraPerson = this.map.gameObjects.hero;

      //Update all objects
      Object.values(this.map.gameObjects).forEach(object => {
        object.update({
          arrow: this.directionInput.direction,
          map: this.map,
        })
      })

      //Draw Lower layer
      this.map.drawLowerImage(this.ctx, cameraPerson);

      //Draw Game Objects
      Object.values(this.map.gameObjects).sort((a,b) => {
        return a.y - b.y;
      }).forEach(object => {
        object.sprite.draw(this.ctx, cameraPerson);
      })

      //Draw Upper layer
      this.map.drawUpperImage(this.ctx, cameraPerson);
      
      requestAnimationFrame(() => {
        step();   
      })
    }
    step();
 }

 bindActionInput() {
   new KeyPressListener("Enter", () => {
     //Is there a person here to talk to?
     this.map.checkForActionCutscene()
   })
 }

 bindHeroPositionCheck() {
   document.addEventListener("PersonWalkingComplete", e => {
     if (e.detail.whoId === "hero") {
       //Hero's position has changed
       this.map.checkForFootstepCutscene()
     }
   })
 }

 startMap(mapConfig) {
  this.map = new OverworldMap(mapConfig);
  this.map.overworld = this;
  this.map.mountObjects();
 }

 init() {
  this.startMap(window.OverworldMaps.Kitchen);

  this.bindActionInput();
  this.bindHeroPositionCheck();

  this.directionInput = new DirectionInput();
  this.directionInput.init();

  this.startGameLoop();

  this.map.startCutscene([
    { who: "hero", type: "stand",  direction: "right", time: 500 },
    { who: "hero", type: "walk",  direction: "right" },
    { who: "hero", type: "walk",  direction: "right" },
    { who: "hero", type: "walk",  direction: "right" },
    { who: "hero", type: "walk",  direction: "right" },
    { who: "hero", type: "walk",  direction: "right" },
    { who: "hero", type: "walk",  direction: "right" },
    { who: "hero", type: "walk",  direction: "right" },
    { who: "hero", type: "walk",  direction: "right" },
    { type: "textMessage", text: "You: Hey Andy, have you seen Frank anywhere?"},
    { who: "andy", type: "stand",  direction: "left" },
    { type: "textMessage", text: "Andy: No, he's probably sleeping out back. He said he was dying to have a lie-down after last night's party!"},
    { type: "textMessage", text: "You: Party? No-one invited me. Hmmmmmm..."},
    { who: "andy", type: "stand",  direction: "down" },
    { type: "textMessage", text: "Go over to Frank's body (he's the one lying in a pool of.... oh, you know who he is, you're a detective!) and hit ENTER."},
  ])
 }

}
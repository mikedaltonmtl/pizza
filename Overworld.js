class Overworld {
  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector('.game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.map = null;
  }

  startGameLoop() {
    const step = () => {

      // Clear the canvas before redrawing images
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Establish the camera person
      const cameraPerson = this.map.gameObjects.hero;

      // Update the objects before drawing them
      Object.values(this.map.gameObjects).forEach(object => {
        object.update({
          arrow: this.directionInput.direction,
          map: this.map
        })
      });

      // Draw lower level
      this.map.drawLowerImage(this.ctx, cameraPerson);

      // Draw game objects
      Object.values(this.map.gameObjects).sort((a,b) => {
        return a.y - b.y;
      }).forEach(object => {
        object.sprite.draw(this.ctx, cameraPerson);
      });

      // Draw upper level
      this.map.drawUpperImage(this.ctx, cameraPerson);


      // requestanimationFrame call the function every frame - avoids step calling step in an infinite loop
      requestAnimationFrame(() => {
        step();
      })
    }
    step();
  }

  init() {
    this.map = new OverworldMap(window.OverworldMaps.DemoRoom);
    this.map.mountObjects();

    this.directionInput = new DirectionInput();
    this.directionInput.init();
    this.directionInput.direction; // ex 'down' or undefined

    this.startGameLoop();

    this.map.startCutscene([
      { who: 'hero', type: 'walk', direction: 'down' },
      { who: 'hero', type: 'walk', direction: 'down' },
      { who: 'npcA', type: 'walk', direction: 'up' },
      { who: 'npcA', type: 'walk', direction: 'left' },
      { who: 'hero', type: 'stand', direction: 'right', time: 200 },
      { type: 'textMessage', text: 'Hello there!' }

      // { who: 'npcA', type: 'walk', direction: 'left' },
      // { who: 'npcA', type: 'walk', direction: 'left' },
      // { who: 'npcA', type: 'stand', direction: 'up', time: 800 }
    ])
  }

}
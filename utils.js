const utils = {
  withGrid(n) {
    return n * 16;
  },
  asGridCoord(x, y) {
    return `${x * 16},${y * 16}`;
  },
  nextPosition(initialX, initialY, direction) {
    let x = initialX;
    let y = initialY;
    const size = 16;
    switch (direction) {
    case 'left':
      x -= size;
      break;
    case 'right':
      x += size;
      break;
    case 'up':
      y -= size;
      break;
    case 'down':
      y += size;
      break;
    }
    return {x, y};
  },

  oppositeDirection(direction) {
    if (direction === 'left') {return 'right' }
    if (direction === 'right') {return 'left' }
    if (direction === 'up') {return 'down' }
    return 'up';
  },

  emitEvent(name, detail) {
    const event = new CustomEvent(name, {
      detail
    });
    document.dispatchEvent(event);
  }
}
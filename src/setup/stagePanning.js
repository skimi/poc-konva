export default ({ stage, mainLayer, transformer }) => {
  const handlePanning = (e) => {
    if (e.target === stage) {
      stage.draggable(true);
    } else {
      stage.draggable(false);
    }
  }

  stage.on('touchstart', handlePanning);
  stage.on('mousedown', handlePanning);
};

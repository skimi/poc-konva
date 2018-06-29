import Konva from 'konva';
import flow from 'lodash/flow';

export const HANDLE_NAME = 'individual-rotator';

const rotator = new Konva.Circle({
  radius: 5,
  fill: 'white',
  stroke: 'rgb(0, 161, 255)',
  strokeWidth: 1,
  offsetX: 10,
  offsetY: 10,
  scaleX: 2,
  scaleY: 2,
  y: 0,
  x: 0,
  name: HANDLE_NAME,
});

export default ({ stage, mainLayer, transformer, selectGroup }) => {
  transformer.add(rotator);

  let startPointerPost;
  let tablesOriginalRotations;

  const rotationStart = (e) => {
    startPointerPost = {
      left: e.evt.clientX !== undefined ? e.evt.clientX : e.evt.touches[0].clientX,
      top: e.evt.clientX !== undefined ? e.evt.clientY : e.evt.touches[0].clientY
    };
    tablesOriginalRotations = selectGroup.getChildren().map(table => table.rotation());

    stage.on('mousemove', rotation);
    stage.on('touchmove', rotation);
  }

  const rotation = (e) => {
    const tables = selectGroup.getChildren();
    const pointerPos = {
      left: e.evt.clientX !== undefined ? e.evt.clientX : e.evt.touches[0].clientX,
      top: e.evt.clientX !== undefined ? e.evt.clientY : e.evt.touches[0].clientY
    };
    const offset = {
      x: pointerPos.left - startPointerPost.left,
      y: pointerPos.top - startPointerPost.top,
    };

    const rotation = Konva.Util._radToDeg(offset.x / 100) / 2;

    tables.forEach((table, i) => {
      table.rotation(rotation + tablesOriginalRotations[i]);
    });

    transformer.fire('transform');
    transformer.forceUpdate();
    mainLayer.draw();
  };

  const rotationEnd = () => {
    startPointerPost = null;
    tablesOriginalRotations = null;

    stage.off('mousemove', rotation);
    stage.off('touchmove', rotation);
  }

  rotator.on('touchstart', rotationStart);
  rotator.on('mousedown', rotationStart);

  stage.on('touchend', rotationEnd);
  stage.on('mouseup', rotationEnd);

  mainLayer.draw();
};

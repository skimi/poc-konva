import React, { Component } from 'react';
import uniqueId from 'lodash/uniqueId';
import './App.css';
import Konva from 'konva';

const RESIZERS_NAMES = [
  'top-left',
  'top-center',
  'top-right',
  'middle-right',
  'middle-left',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'rotater',
];

class App extends Component {
  stage = null
  mainLayer = null
  transformer = null
  container = React.createRef()
  tableCount = 0

  commitTransformation = () => {
    const tables = this.selectGroup.getChildren();
    const transform = tables.map(node => ({
      rotation: this.selectGroup.rotation(),
      scale: node.getAbsoluteScale(),
      position: node.getAbsolutePosition(),
    }));
    this.selectGroup.removeChildren();
    this.selectGroup.position({ x: 0, y: 0 });
    this.selectGroup.scale({ x: 1, y: 1 });
    this.selectGroup.rotation(0);
    this.transformer.visible(false)
    this.mainLayer.add(this.selectGroup);
    tables.forEach((table, i) => {
      this.mainLayer.add(table);
      table.rotation(transform[i].rotation + table.rotation());
      table.scale(transform[i].scale);
      table.position(transform[i].position);
      this.stage.find(`#text-${table.getAttr('id')}`)[0].moveToTop();
      this.mainLayer.draw();
    })
  }

  selectTable = (table, text) => {
    const selectedTables = this.selectGroup.getChildren();

    if (selectedTables.length) {
      this.commitTransformation();
      selectedTables.forEach((selectedTable) => {
        this.selectGroup.add(selectedTable);
      })
    }

    this.selectGroup.add(table);

    this.selectGroup.visible(true)
    this.selectGroup.draggable(true)

    this.transformer.visible(true);
    this.transformer.moveToTop();
    this.transformer.forceUpdate();

    text.moveToTop();

    this.mainLayer.draw();
  }

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: 'container',
      width: this.container.current.getBoundingClientRect().width,
      height: this.container.current.getBoundingClientRect().height,
    });
    this.transformer = new Konva.Transformer({
      visible: false,
      boundBoxFunc: function (oldBoundBox, newBoundBox) {
        // disallow negative scaling
        if (newBoundBox.width < 0 || newBoundBox.height < 0) {
          return oldBoundBox;
        }

        return newBoundBox;
      }
    });
    this.mainLayer = new Konva.Layer();
    this.selectGroup = new Konva.Group({
      draggable: true,
      visible: false,
      id: 'selectGroup',
    });
    this.stage.add(this.mainLayer);
    this.mainLayer.add(this.transformer);
    this.mainLayer.add(this.selectGroup);
    // resize the handles
    this.transformer.getChildren()
      .filter(child => RESIZERS_NAMES.includes(child.getAttr('name')))
      .forEach(resizer => resizer.setScale({ x: 2, y: 2 }));
    this.transformer.attachTo(this.selectGroup);
    const rotator = new Konva.Circle({
      radius: 10,
      fill: 'white',
      stroke: 'rgb(0, 161, 255)',
      fill: 'white',
      strokeWidth: 2,
      offsetX: 5,
      offsetY: 5,
      y: -20,
      x: -20,
    });
    this.transformer.add(rotator);
    this.mainLayer.draw();

    const updateText = () => {
      const node = this.transformer.getNode();
      const tables = node === this.selectGroup ?
        this.selectGroup.getChildren() : [node]

      tables.forEach((table) => {
        const text = this.stage.find(`#text-${table.getAttr('id')}`)[0];
        text.moveToTop();
        text.position(table.getAbsolutePosition());
      });

      this.mainLayer.draw();
    };

    this.transformer.on('transform', updateText);
    this.selectGroup.on('dragmove', updateText);

    const handleClickStage = (e) => {
      if (e.target === this.stage) {
        this.commitTransformation();
        this.selectGroup.draggable(false);
        this.transformer.visible(false);
        this.mainLayer.draw();
      }
    };

    let startPointerPost;
    let tablesOriginalRotations;

    const handleRotation = (e) => {
      const node = this.transformer.getNode();
      const tables = node === this.selectGroup ?
        this.selectGroup.getChildren() : [node];
      const rotatorPos = rotator.position();
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

      this.transformer.forceUpdate();
      this.mainLayer.draw();
    }

    const makeHandleRotation = (e) => {
      startPointerPost = {
        left: e.evt.clientX !== undefined ? e.evt.clientX : e.evt.touches[0].clientX,
        top: e.evt.clientX !== undefined ? e.evt.clientY : e.evt.touches[0].clientY
      };
      const node = this.transformer.getNode();
      const tables = node === this.selectGroup ?
        this.selectGroup.getChildren() : [node];
      tablesOriginalRotations = tables.map(table => table.rotation());
      this.stage.on('mousemove', handleRotation);
      this.stage.on('touchmove', handleRotation);
    }

    const cancelHandleRotation = () => {
      this.stage.off('mousemove', handleRotation);
      this.stage.off('touchmove', handleRotation);
    }

    this.stage.on('click', handleClickStage);
    this.stage.on('tap', handleClickStage);
    rotator.on('touchstart', makeHandleRotation);
    rotator.on('mousedown', makeHandleRotation);
    this.stage.on('touchend', cancelHandleRotation);
    this.stage.on('mouseup', cancelHandleRotation);
  }

  handleAddTable = () => {
    this.tableCount++;

    var rect = new Konva.Rect({
      x: (this.container.current.getBoundingClientRect().width / 2) - (100 / 2),
      y: (this.container.current.getBoundingClientRect().height / 2) - (50 / 2),
      width: 100,
      height: 50,
      offsetX: 50,
      offsetY: 25,
      fill: Konva.Util.getRandomColor(),
      stroke: 'black',
      strokeWidth: 4,
      name: 'table',
      id: `table-${this.tableCount}`
    });

    var text = new Konva.Text({
      text: `T${this.tableCount}`,
      id: `text-table-${this.tableCount}`,
    });

    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);
    text.position(rect.position());

    const updateText = () => {
      text.position(rect.getAbsolutePosition());
      text.moveToTop();
      this.mainLayer.draw();
    };

    rect.on('click', () => this.selectTable(rect, text));
    rect.on('tap', () => this.selectTable(rect, text));
    rect.on('dragmove', updateText);

    this.mainLayer.add(rect);
    this.mainLayer.add(text);
    this.mainLayer.draw();
  }

  handleExport = () => {
    this.transformer.detach();
    this.mainLayer.draw();
    console.log(this.stage.toJSON());
  }

  render() {
    return (
      <div className="App">
        <div className="tools">
          <button
            type="button"
            onClick={this.handleAddTable}
          >
            Add Table
          </button>
          <button
            type="button"
            onClick={this.handleExport}
          >
            Export
          </button>
        </div>
        <div id="container" ref={this.container}></div>
      </div>
    );
  }
}

export default App;

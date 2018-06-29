import React, { Component } from 'react';
import flow from 'lodash/flow';
import './App.css';
import Konva from 'konva';

import biggerHandles from './setup/transformer/biggerHandles';
import individualRotation from './setup/transformer/individualRotation';
import stagePanning from './setup/stagePanning';

import { HANDLES_NAMES } from './setup/transformer/biggerHandles';
import { HANDLE_NAME as ROTATOR_HANDLE } from './setup/transformer/individualRotation';

class App extends Component {
  stage = null
  mainLayer = null
  transformer = null
  container = React.createRef()
  tableCount = 0

  state = {
    zoom: 100,
  }

  endTransformation = () => {
    this.selectGroup.removeChildren();
    this.selectGroup.position({ x: 0, y: 0 });
    this.selectGroup.scale({ x: 1, y: 1 });
    this.selectGroup.rotation(0);
    this.transformer.visible(false);
    this.mainLayer.draw();
  }

  selectTable = (table) => {
    const selectedTables = this.selectGroup.getChildren();
    const tableShape = table.find('.table-shape')[0].clone({
      id: 'selection-' + table.getAttr('id'),
      opacity: 0,
    });

    if (selectedTables.length) {
      this.endTransformation();
      selectedTables.forEach(transformedShape => {
        const tableId = transformedShape.getAttr('id').split('-').splice(1).join('-');
        const originalShape = this.stage.find(`#shape-${tableId}`)[0];
        this.selectGroup.add(originalShape.clone({
          id: 'selection-' + tableId,
          opacity: 0,
        }));
      });
    }

    this.selectGroup.add(tableShape);

    this.selectGroup.visible(true)
    this.selectGroup.draggable(true)
    this.selectGroup.moveToTop()

    this.transformer.visible(true);
    this.transformer.moveToTop();
    this.transformer.forceUpdate();

    this.mainLayer.draw();
  }

  componentDidMount() {
    const containerSize = this.container.current.getBoundingClientRect();
    this.stage = new Konva.Stage({
      container: 'container',
      width: containerSize.width,
      height: containerSize.height,
      offsetX: -containerSize.width / 2,
      offsetY: -containerSize.height / 2,
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
    this.transformer.attachTo(this.selectGroup);

    const onTransform = () => {
      this.selectGroup.getChildren().forEach(transformedShape => {
        const tableId = transformedShape.getAttr('id').split('-').splice(1).join('-');
        this.stage.find(`#${tableId}`)[0].fire('syncTransform');
      });
    };

    this.transformer.on('transform', onTransform);
    this.selectGroup.on('dragmove', onTransform);

    const handleClickStage = (e) => {
      if (e.target === this.stage) {
        this.endTransformation();
        this.selectGroup.draggable(false);
        this.transformer.visible(false);
        this.mainLayer.draw();
      }
    };

    this.stage.on('click', handleClickStage);
    this.stage.on('tap', handleClickStage);

    [
      biggerHandles,
      individualRotation,
      stagePanning,
    ].forEach(fn => fn({
      stage: this.stage,
      mainLayer: this.mainLayer,
      transformer: this.transformer,
      selectGroup: this.selectGroup,
    }))
  }

  handleAddTable = () => {
    this.tableCount++;

    const tableId = this.tableCount;

    const table = new Konva.Group({
      id: `table-${tableId}`,
      name: 'table',
    });

    const shape = new Konva.Rect({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      offsetX: 50,
      offsetY: 25,
      fill: Konva.Util.getRandomColor(),
      stroke: 'black',
      strokeWidth: 4,
      name: 'table-shape',
      id: `shape-table-${tableId}`
    });

    const text = new Konva.Text({
      text: `T${tableId}`,
      name: 'table-text',
      id: `text-table-${tableId}`,
    });

    table.add(shape);
    table.add(text);

    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);
    text.position(shape.position());

    table.on('click', () => this.selectTable(table));
    table.on('tap', () => this.selectTable(table));
    table.on('syncTransform', () => {
      const transformedShape = this.stage.find(`#selection-table-${tableId}`)[0];
      shape.rotation(this.selectGroup.rotation() + transformedShape.rotation());
      shape.scaleX(this.selectGroup.scaleX() * transformedShape.scaleX());
      shape.scaleY(this.selectGroup.scaleY() * transformedShape.scaleY());
      shape.setAbsolutePosition(transformedShape.getAbsolutePosition());
      text.setAbsolutePosition(transformedShape.getAbsolutePosition());
    });

    this.mainLayer.add(table);
    this.mainLayer.draw();
  }

  handleExport = () => {
    this.transformer.detach();
    this.mainLayer.draw();
    console.log(this.stage.toJSON());
  }

  handleChangeZoom = (e) => {
    const RESIZERS_NAMES = [...HANDLES_NAMES, ROTATOR_HANDLE];
    const zoom = e.target.value;
    const scale = zoom / 100;
    const invert = 1 / scale;
    this.setState({ zoom });
    this.mainLayer.scaleX(scale);
    this.mainLayer.scaleY(scale);
    this.transformer.getChildren()
      .filter(child => RESIZERS_NAMES.includes(child.getAttr('name')))
      .forEach(resizer => resizer.setScale({ x: 2 * invert, y: 2 * invert }));
    this.mainLayer.draw();
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
        <div id="zoomInput">
          {this.state.zoom}%{' '}
          <input
            type="range"
            name="volume"
            min={0}
            max={120}
            value={this.state.zoom}
            onChange={this.handleChangeZoom}
          />
        </div>
        <div id="container" ref={this.container}></div>
      </div>
    );
  }
}

export default App;

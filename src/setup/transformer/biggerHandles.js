export const HANDLES_NAMES = [
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

export default ({ stage, mainLayer, transformer }) => {
  transformer.getChildren()
    .filter(child => HANDLES_NAMES.includes(child.getAttr('name')))
    .forEach(resizer => resizer.setScale({ x: 2, y: 2 }));
};

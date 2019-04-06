/**
 * keysMap = {
    name: 'firstName',
    job: 'passion'
};

 obj = {
    name: 'Bobo',
    job: 'Front-End Master'
};

 renameKeys(keysMap, obj);
 // { firstName: 'Bobo', passion: 'Front-End Master' }
 * @param keysMap
 * @param obj
 */

export function renameKeys (keysMap: {[key: string]: any}, obj: any) {
  return Object
    .keys(obj)
    .reduce((acc, key) => ({
      ...acc,
      ...{ [keysMap[key] || key]: obj[key] }
    }), {});
}
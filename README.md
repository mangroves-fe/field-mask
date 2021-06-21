# field-mask

FieldMask hepler which offers some utils to get field mask or update object.

A mangroves-fe project.

# Install

## yarn

```bash
yarn add @mangroves/field-mask
```

## import

```typescript
import { getMaskFromObject } from '@mangroves/field-mask'
// Or
import * as FieldMask from '@mangroves/field-mask'
```

# Usage

## getMaskFromObject

Mainly in front-end scenarios. To get the mask by an object.

```typescript
const object = {
  a: {
    b: 1,
    c: 2,
  },
  d: 3,
}
const mask = FieldMask.getMaskFromObject(object)
console.log(mask) // ['a.b', 'a.c', 'd']
```

## getObjectByMask

To get partial object by the mask.

```typescript
const object = {
  a: {
    b: 1,
    c: 2,
  },
  d: 3,
}
const partial = FieldMask.getObjectByMask(object, ['a.b'])
console.log(partial) // { a: { b: 1 } }
```

## updateObjectByMask

To partial update an object.

```typescript
const object = {
  a: {
    b: 1,
    c: 2,
  },
  d: 3,
}

const update = {
  a: {
    b: 4,
  },
}

const updateCount = FieldMask.updateObjectByMask(object, update, ['a.b'])
console.log(updateCount) // 1
console.log(object.a.b) // 4
```

## filterMaskByObject

To filter mask according to the object.

```typescript
const object = {
  a: {
    b: 1,
    c: 2,
  },
  d: 3,
}

const filteredMask = FieldMask.filterMaskByObject(['a.b', 'a.c', 'a.d', 'notExist'], object)
console.log(filteredMask) // ['a.b', 'a.c']
```

## filterMaskByMask

To filter mask according to an allowed mask list.

```typescript
const mask = [
  'a.b',
  'c.d', // exact match
  'x.y.w', // not allowed
  'k', // not exist
]
const allowedMask = ['a', 'c.d', 'x.y.z']
const filteredMask = FieldMask.filterMaskByMask(mask, allowedMask)
console.log(filteredMask) // ['a.b', 'c.d']
```

# Reference

- [FieldMask](https://developers.google.com/protocol-buffers/docs/reference/google.protobuf#fieldmask)

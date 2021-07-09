import * as FieldMask from '.'

describe('getMaskFromObject', () => {
  const object = {
    f: {
      a: {
        b: {
          c: null,
          d: [],
        },
        'x.y': {
          z: 1,
        },
      },
      b: 123,
      c: 'abc',
    },
  }

  it('Returns correct mask', () => {
    const mask = FieldMask.getMaskFromObject(object)
    expect(mask).toEqual([
      'f.a.b.c',
      'f.a.b.d',
      'f.a.x\\.y.z',
      'f.b',
      'f.c',
    ])
  })

  it('Specify max level', () => {
    const mask1 = FieldMask.getMaskFromObject(object, 1)
    expect(mask1).toEqual(['f'])

    const mask2 = FieldMask.getMaskFromObject(object, 2)
    expect(mask2).toEqual(['f.a', 'f.b', 'f.c'])

    const mask3 = FieldMask.getMaskFromObject(object, 3)
    expect(mask3).toEqual(['f.a.b', 'f.a.x\\.y', 'f.b', 'f.c'])

    const mask4 = FieldMask.getMaskFromObject(object, 4)
    expect(mask4).toEqual([
      'f.a.b.c',
      'f.a.b.d',
      'f.a.x\\.y.z',
      'f.b',
      'f.c',
    ])

    const mask5 = FieldMask.getMaskFromObject(object, 5)
    expect(mask5).toEqual([
      'f.a.b.c',
      'f.a.b.d',
      'f.a.x\\.y.z',
      'f.b',
      'f.c',
    ])
  })

  it('Multiple fields in the first layer', () => {
    const object = {
      a: {
        b: 1,
        c: 2,
      },
      b: {
        c: 3,
      },
      c: 4,
    }
    const mask = FieldMask.getMaskFromObject(object)
    expect(mask).toEqual([
      'a.b',
      'a.c',
      'b.c',
      'c',
    ])
  })
})

describe('getObjectByMask', () => {
  const object = {
    f: {
      a: {
        b: {
          c: null,
          d: [],
        },
        'x.y': {
          z: 1,
        },
      },
      b: 123,
      c: 'abc',
    },
  }
  it('Returns correct object', () => {
    const result = FieldMask.getObjectByMask(object, [
      'f.a.b.c',
      'f.a.x\\.y',
      'f.c',
      'f.not.exist',
      'f.a.b.not',
    ])
    expect(result).toEqual({
      f: {
        a: {
          b: {
            c: null,
          },
          'x.y': {
            z: 1,
          },
        },
        c: 'abc',
      },
    })
    expect(result.f.a.b.d).toBeUndefined()
  })
})

describe('updateObjectByMask', () => {
  it('Empty update object', () => {
    const target = {
      f: {
        a: {
          b: {
            c: null,
            d: [],
          },
          'x.y': {
            z: 1,
          },
        },
        b: 123,
        c: 'abc',
      },
    }

    const updateCount = FieldMask.updateObjectByMask(target, {}, ['f.a.b.d'])
    expect(updateCount).toBe(0)
  })

  it('Nothing updated', () => {
    const target = {
      f: {
        a: {
          b: {
            c: null,
            d: [],
          },
          'x.y': {
            z: 1,
          },
        },
        b: 123,
        c: 'abc',
      },
    }

    const update = {
      f: {
        a: {
          b: {
            c: null,
            d: [],
          },
          'x.y': {
            z: 1,
          },
        },
        b: 123,
        c: 'abc',
      },
    }

    const updateCount = FieldMask.updateObjectByMask(target, update, ['f.a.b.c', 'f.b', 'f.c', 'f.a.x\\.y.z'])
    expect(updateCount).toBe(0)
  })

  it('Update correctly', () => {
    const target = {
      f: {
        a: {
          b: {
            c: null,
            d: [],
          },
          'x.y': {
            z: 1,
          },
        },
        b: 123,
        c: 'abc',
      },
    }

    const update = {
      f: {
        a: {
          b: {
            c: 666,
            d: [],
          },
          'x.y': {
            w: 2,
          },
        },
        b: 789,
        c: null,
      },
    }

    const updateCount = FieldMask.updateObjectByMask(target, update, [
      'f.a.b.c',
      'f.a.b.d',
      'f.a.x\\.y',
      'f.b',
      'f.c',
    ])
    expect(updateCount).toBe(5)
    expect(update.f.a.b.c).toBe(666)
    expect(target.f.a.b.c).toBe(update.f.a.b.c)
    expect(target.f.a.b.d).toBe(update.f.a.b.d)
    expect(target.f.a['x.y'].z).toBeUndefined()
    expect(update.f.a['x.y'].w).toBe(2)
    expect((target.f.a['x.y'] as any).w).toBe(update.f.a['x.y'].w)
    expect(update.f.b).toBe(789)
    expect(target.f.b).toBe(update.f.b)
    expect(update.f.c).toBe(null)
    expect(target.f.c).toBe(update.f.c)
  })
})

describe('filterMaskByMask', () => {
  it('All path passed', () => {
    const mask = ['f.a.b.c', 'f.x.y.z', 'f.1.2.3.4']
    const allowedMask = ['f.a', 'f.x.y', 'f.1.2.3.4']

    const filteredMask = FieldMask.filterMaskByMask(mask, allowedMask)
    expect(filteredMask).toEqual(mask)
  })

  it('Partial allowed', () => {
    const mask = ['f.a.b.c', 'f.x.y.z', 'f.1.2.3.4']
    const allowedMask = ['f.a.b.c.d', 'f.x.y', 'f.1.2.3.4']

    const filteredMask = FieldMask.filterMaskByMask(mask, allowedMask)
    expect(filteredMask).toEqual(['f.x.y.z', 'f.1.2.3.4'])
  })

  it('No path allowed', () => {
    const mask = ['f.a.b.c', 'f.x.y.z', 'f.1.2.3.4']
    const allowedMask = ['f.a.b.c.d', 'f.x.y.w', 'f.1.2.3.5']

    const filteredMask = FieldMask.filterMaskByMask(mask, allowedMask)
    expect(filteredMask).toEqual([])
  })

  it('Empty allowed mask', () => {
    const mask = ['f.a.b.c', 'f.x.y.z', 'f.1.2.3.4']
    const allowedMask: string[] = []

    const filteredMask = FieldMask.filterMaskByMask(mask, allowedMask)
    expect(filteredMask).toEqual([])
  })
})

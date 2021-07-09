const escapeDot = (key: string): string => {
  return key.replace(/\./g, '\\.')
}

const removeEscape = (key: string): string => {
  return key.replace(/\\/g, '')
}

const splitPath = (path: string): string[] => {
  return path.split(/(?<!\\)\./).map(removeEscape)
}

/**
 * Get all paths from an object
 * @param object - Object to process
 * @param level - Depth of paths to get, default to get paths of all depth
 * @returns Array of path string
 * 
 * @example
 * ```
 * const object = {
 *   a: {
 *     b: 1,
 *     c: 2,
 *   },
 *   d: 3,
 * }
 * const mask = FieldMask.getMaskFromObject(object)
 * console.log(mask) // ['a.b', 'a.c', 'd']
 * ```
 * 
 * @public
 */
export const getMaskFromObject = (object: Record<string, any>, level = Infinity): string[] => {
  const result: string[] = []
  const stack: Array<{ value: any; prefix: string; level: number }> = [{ value: object, prefix: '', level: 0 }]
  while (stack.length) {
    const element = stack.pop() as { value: Record<string, any>; prefix: string; level: number }
    if (element.level === level) {
      result.push(element.prefix)
      continue
    }
    if (typeof element.value !== 'object' || element.value === null || Array.isArray(element.value)) {
      result.push(element.prefix)
    } else {
      const entries = Object.entries(element.value)
      const nextLevel = element.level + 1
      while (entries.length) {
        const [key, value] = entries.pop() as [string, any]
        const prefix = `${element.prefix ? `${element.prefix}.` : ''}${escapeDot(key)}`
        stack.push({ value, prefix, level: nextLevel })
      }
    }
  }
  return result
}

/**
 * Filter all paths that exist in the given object
 * @param mask - Array of path string
 * @param object - Given object to filter with
 * @returns Array of filtered path string
 * 
 * @example
 * ```
 * const object = {
 *   a: {
 *     b: 1,
 *     c: 2,
 *   },
 *   d: 3,
 * }
 * 
 * const filteredMask = FieldMask.filterMaskByObject(['a.b', 'a.c', 'a.d', 'notExist'], object)
 * console.log(filteredMask) // ['a.b', 'a.c']
 * ```
 * 
 * @public
 */
export const filterMaskByObject = (mask: string[], object: Record<string, any>): string[] => {
  return mask.filter((path) => {
    const pathArray = splitPath(path)
    const length = pathArray.length
    let currentLayer = object
    return pathArray.every((field, index) => {
      if (
        index !== length - 1 &&
        (typeof currentLayer[field] !== 'object' ||
        currentLayer[field] === null ||
        Array.isArray(currentLayer[field]))
      ) return false
      if (Object.prototype.hasOwnProperty.call(currentLayer, field)) {
        currentLayer = currentLayer[field]
        return true
      }
      return false
    })
  })
}

/**
 * Get partial object by a given mask
 * @param object - Object to process
 * @param mask - The given mask
 * @returns Partial object
 * 
 * @example
 * ```
 * const object = {
 *   a: {
 *     b: 1,
 *     c: 2,
 *   },
 *   d: 3,
 * }
 * const partial = FieldMask.getObjectByMask(object, ['a.b'])
 * console.log(partial) // { a: { b: 1 } }
 * ```
 * 
 * @public
 */
export const getObjectByMask = (object: Record<string, any>, mask: string[]): Record<string, any> => {
  const result: Record<string, any> = {}
  mask = filterMaskByObject(mask, object)
  mask.forEach((path) => {
    const pathArray = splitPath(path)
    const length = pathArray.length
    let currentObjectLayer = object
    let currentResultLayer = result
    pathArray.forEach((field, index) => {
      if (index !== length - 1) {
        if (!currentResultLayer[field]) {
          currentResultLayer[field] = {}
        }
        currentObjectLayer = currentObjectLayer[field]
        currentResultLayer = currentResultLayer[field]
      } else {
        currentResultLayer[field] = currentObjectLayer[field]
      }
    })
  })
  return result
}

/**
 * Update an object with a given mask
 * @param target - Target object to update
 * @param update - Update object
 * @param mask - Array of path string
 * @returns Updated target object
 * 
 * @example
 * ```
 * const object = {
 *   a: {
 *     b: 1,
 *     c: 2,
 *   },
 *   d: 3,
 * }
 * 
 * const update = {
 *   a: {
 *     b: 4,
 *   },
 * }
 * 
 * const updateCount = FieldMask.updateObjectByMask(object, update, ['a.b'])
 * console.log(updateCount) // 1
 * console.log(object.a.b) // 4
 * ```
 * 
 * @public
 */
export const updateObjectByMask = (target: Record<string, any>, update: Record<string, any>, mask: string[]): number => {
  mask = filterMaskByObject(mask, target)
  mask = filterMaskByObject(mask, update)
  let updateCount = 0
  mask.forEach((path) => {
    const pathArray = splitPath(path)
    const length = pathArray.length
    let currentTargetLayer = target
    let currentUpdateLayer = update
    pathArray.forEach((field, index) => {
      if (index !== length - 1) {
        currentTargetLayer = currentTargetLayer[field]
        currentUpdateLayer = currentUpdateLayer[field]
      } else {
        if (
          (typeof currentUpdateLayer[field] === 'object' && currentUpdateLayer[field] !== null) ||
          currentTargetLayer[field] !== currentUpdateLayer[field]
        ) {
          currentTargetLayer[field] = currentUpdateLayer[field]
          updateCount++
        }
      }
    })
  })
  return updateCount
}

/**
 * Filter a mask according to a list of allowed mask
 * @param mask - Mask to filter
 * @param allowedMask - Allowed mask
 * @returns Filtered mask
 * 
 * @example
 * ```
 * const mask = [
 *   'a.b',
 *   'c.d', // exact match
 *   'x.y.w', // not allowed
 *   'k', // not exist
 * ]
 * const allowedMask = ['a', 'c.d', 'x.y.z']
 * const filteredMask = FieldMask.filterMaskByMask(mask, allowedMask)
 * console.log(filteredMask) // ['a.b', 'c.d']
 * ```
 * 
 * @public
 */
export const filterMaskByMask = (mask: string[], allowedMask: string[]): string[] => {
  return mask.filter((path) => {
    return allowedMask.some((allowedPath) => path.indexOf(allowedPath) === 0)
  })
}

type IObject = Record<string, any>

const escapeDot = (key: string): string => {
  return key.replace(/\./g, '\\.')
}

const removeEscape = (key: string): string => {
  return key.replace(/\\/g, '')
}

const splitPath = (path: string): string[] => {
  return path.split(/(?<!\\)\./).map(removeEscape)
}

export const FieldMask = {
  getMaskFromObject (object: IObject, level = Infinity): string[] {
    const result: string[] = []
    const stack: Array<{ value: any; prefix: string; level: number }> = [{ value: object, prefix: '', level: 0 }]
    while (stack.length) {
      const element = stack.pop() as { value: IObject; prefix: string; level: number }
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
  },

  filterMaskByObject (mask: string[], object: IObject): string[] {
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
  },

  getObjectByMask (object: IObject, mask: string[]): IObject {
    const result: IObject = {}
    mask = FieldMask.filterMaskByObject(mask, object)
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
  },

  updateObjectByMask (target: IObject, update: IObject, mask: string[]): number {
    mask = FieldMask.filterMaskByObject(mask, target)
    mask = FieldMask.filterMaskByObject(mask, update)
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
  },

  filterMaskByMask (mask: string[], allowedMask: string[]): string[] {
    return mask.filter((path) => {
      return allowedMask.some((allowedPath) => path.indexOf(allowedPath) === 0)
    })
  },
}

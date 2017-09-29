import moment from 'moment'

const EPSILON = 0.001

// so we could use both immutable.js objects and regular objects
export function _get (object, key) {
  return typeof object.get === 'function' ? object.get(key) : object[key]
}

export function _length (object) {
  return typeof object.count === 'function' ? object.count() : object.length
}

export function arraysEqual (array1, array2) {
  return (_length(array1) === _length(array2)) && array1.every((element, index) => {
    return element === _get(array2, index)
  })
}

export function iterateTimes (start, end, unit, timeSteps, callback) {
  let time = moment(start).startOf(unit)

  if (timeSteps[unit] && timeSteps[unit] > 1) {
    let value = time.get(unit)
    time.set(unit, value - (value % timeSteps[unit]))
  }

  while (time.valueOf() < end) {
    let nextTime = moment(time).add(timeSteps[unit] || 1, `${unit}s`)
    callback(time, nextTime)
    time = nextTime
  }
}

export function getMinUnit (zoom, width, timeSteps) {
  let timeDividers = {
    second: 1000,
    minute: 60,
    hour: 60,
    day: 24,
    month: 30,
    year: 12
  }

  let minUnit = 'year'
  let breakCount = zoom
  const minCellWidth = 17

  Object.keys(timeDividers).some(unit => {
    breakCount = breakCount / timeDividers[unit]
    const cellCount = breakCount / timeSteps[unit]
    const countNeeded = width / (timeSteps[unit] && timeSteps[unit] > 1 ? 3 * minCellWidth : minCellWidth)

    if (cellCount < countNeeded) {
      minUnit = unit
      return true
    }
  })

  return minUnit
}

export function getNextUnit (unit) {
  let nextUnits = {
    second: 'minute',
    minute: 'hour',
    hour: 'day',
    day: 'month',
    month: 'year'
  }

  return nextUnits[unit] || ''
}

export function getParentPosition (element) {
  var xPosition = 0
  var yPosition = 0
  var first = true

  while (element) {
    xPosition += (element.offsetLeft - (first ? 0 : element.scrollLeft) + element.clientLeft)
    yPosition += (element.offsetTop - (first ? 0 : element.scrollTop) + element.clientTop)
    element = element.offsetParent
    first = false
  }
  return { x: xPosition, y: yPosition }
}

export function coordinateToTimeRatio (canvasTimeStart, canvasTimeEnd, canvasWidth) {
  return (canvasTimeEnd - canvasTimeStart) / canvasWidth
}

export function calculateDimensions ({
                                       itemTimeStart,
                                       itemTimeEnd,
                                       isDragging,
                                       isResizing,
                                       canvasTimeStart,
                                       canvasTimeEnd,
                                       canvasWidth,
                                       dragSnap,
                                       dragTime,
                                       resizingItem,
                                       resizingEdge,
                                       resizeTime,
                                       fullUpdate,
                                       visibleTimeStart,
                                       visibleTimeEnd
                                     }) {
  const itemStart = (isResizing && resizingEdge === 'left' ? resizeTime : itemTimeStart)
  const itemEnd = (isResizing && resizingEdge === 'right' ? resizeTime : itemTimeEnd)

  let x = isDragging ? dragTime : itemStart

  let w = Math.max(itemEnd - itemStart, dragSnap)

  let collisionX = itemStart
  let collisionW = w

  if (isDragging) {
    if (itemTimeStart >= dragTime) {
      collisionX = dragTime
      collisionW = Math.max(itemTimeEnd - dragTime, dragSnap)
    } else {
      collisionW = Math.max(dragTime - itemTimeStart + w, dragSnap)
    }
  }

  let clippedLeft = false
  let clippedRight = false

  if (fullUpdate) {
    if (!isDragging && (visibleTimeStart > x + w || visibleTimeEnd < x)) {
      return null
    }

    if (visibleTimeStart > x) {
      w -= (visibleTimeStart - x)
      x = visibleTimeStart
      if (isDragging && w < 0) {
        x += w
        w = 0
      }
      clippedLeft = true
    }
    if (x + w > visibleTimeEnd) {
      w -= ((x + w) - visibleTimeEnd)
      clippedRight = true
    }
  }

  const ratio = 1 / coordinateToTimeRatio(canvasTimeStart, canvasTimeEnd, canvasWidth)

  const dimensions = {
    left: (x - canvasTimeStart) * ratio,
    width: Math.max(w * ratio, 3),
    collisionLeft: collisionX,
    originalLeft: itemTimeStart,
    collisionWidth: collisionW,
    clippedLeft,
    clippedRight
  }

  return dimensions
}

export function getGroupOrders (groups, keys) {
  const { groupIdKey } = keys

  let groupOrders = {}

  for (let i = 0; i < groups.length; i++) {
    groupOrders[_get(groups[i], groupIdKey)] = i
  }

  return groupOrders
}

export function getVisibleItems (items, canvasTimeStart, canvasTimeEnd, keys) {
  const { itemTimeStartKey, itemTimeEndKey } = keys

  return items.filter(item => {
    return _get(item, itemTimeStartKey) <= canvasTimeEnd && _get(item, itemTimeEndKey) >= canvasTimeStart
  })
}

export function collision (a, b, lineHeight) {
  // var verticalMargin = (lineHeight - a.height)/2;
  var verticalMargin = 0
  return ((a.collisionLeft + EPSILON) < (b.collisionLeft + b.collisionWidth) &&
  (a.collisionLeft + a.collisionWidth - EPSILON) > b.collisionLeft &&
  (a.top - verticalMargin + EPSILON) < (b.top + b.height) &&
  (a.top + a.height + verticalMargin - EPSILON) > b.top)
}

export function stack (items, groupOrders, lineHeight, headerHeight, force) {
  var i, iMax
  var totalHeight = headerHeight

  var groupHeights = []
  var groupTops = []

  var groupedItems = getGroupedItems(items, groupOrders)

  if (force) {
    // reset top position of all items
    for (i = 0, iMax = items.length; i < iMax; i++) {
      items[i].dimensions.top = null
    }
  }

  groupedItems.forEach(function (group, index, array) {
    // calculate new, non-overlapping positions
    groupTops.push(totalHeight)

    var groupHeight = 0
    var verticalMargin = 0
    for (i = 0, iMax = group.length; i < iMax; i++) {
      var item = group[i]
      verticalMargin = (lineHeight - item.dimensions.height)

      if (item.dimensions.stack && item.dimensions.top === null) {
        item.dimensions.top = totalHeight + verticalMargin
        groupHeight = Math.max(groupHeight, lineHeight)
        do {
          var collidingItem = null
          for (var j = 0, jj = group.length; j < jj; j++) {
            var other = group[j]
            if (other.dimensions.top !== null && other !== item && other.dimensions.stack && collision(item.dimensions, other.dimensions, lineHeight)) {
              collidingItem = other
              break
            } else {
              // console.log('dont test', other.top !== null, other !== item, other.stack);
            }
          }

          if (collidingItem != null) {
            // There is a collision. Reposition the items above the colliding element
            item.dimensions.top = collidingItem.dimensions.top + lineHeight
            groupHeight = Math.max(groupHeight, item.dimensions.top + item.dimensions.height - totalHeight)
          }
        } while (collidingItem)
      }
    }

    groupHeights.push(Math.max(groupHeight + verticalMargin, lineHeight))
    totalHeight += Math.max(groupHeight + verticalMargin, lineHeight)
  })
  return {
    height: totalHeight,
    groupHeights,
    groupTops
  }
}

export function nostack (items, groupOrders, lineHeight, headerHeight, force) {
  var i, iMax

  var totalHeight = headerHeight

  var groupHeights = []
  var groupTops = []

  var groupedItems = getGroupedItems(items, groupOrders)

  if (force) {
    // reset top position of all items
    for (i = 0, iMax = items.length; i < iMax; i++) {
      items[i].dimensions.top = null
    }
  }

  groupedItems.forEach(function (group, index, array) {
    // calculate new, non-overlapping positions
    groupTops.push(totalHeight)

    var groupHeight = 0
    for (i = 0, iMax = group.length; i < iMax; i++) {
      var item = group[i]
      var verticalMargin = (lineHeight - item.dimensions.height) / 2

      if (item.dimensions.top === null) {
        item.dimensions.top = totalHeight + verticalMargin
        groupHeight = Math.max(groupHeight, lineHeight)
      }
    }

    groupHeights.push(Math.max(groupHeight, lineHeight))
    totalHeight += Math.max(groupHeight, lineHeight)
  })
  return {
    height: totalHeight,
    groupHeights,
    groupTops,
    groupedItems
  }
}

function horizontalCollision(a, b) {
  // NOTE: 20px is our mininum width for timeline events - check timelineView.scss
  a.width = a.width < 20 ? 20 : a.width;
  b.width = b.width < 20 ? 20 : b.width;

  const aRight = a.left + a.width;
  const bRight = b.left + b.width;
  return !( aRight < b.left || a.left > bRight );
}

export function stackFixedGroupHeight (items, groupOrders, lineHeight, headerHeight, force, groupHeight, showMoreButtons) {
  const itemSpacing = 3;
  let i;
  let totalHeight = headerHeight;

  let groupHeights = [];
  let groupTops = [];

  let groupedItems = getGroupedItems(items, groupOrders)

  groupedItems.forEach(function (group, index, array) {
    // calculate new, non-overlapping positions
    groupTops.push(totalHeight);

    // first set them all to the same top position
    // default height to groupHeight
    group.forEach((item, idx) => {
      item.dimensions.top = totalHeight + itemSpacing
      item.dimensions.height = (groupHeight / 2)
    });

    let collidingItems = {};

    // loop through each item in the group and check if it collides with any others
    for (i = 0; i < group.length; i++) {
      let item = group[i]

      for (var j = 0; j < group.length; j++) {
        var other = group[j]
        if (other !== item && horizontalCollision(item.dimensions, other.dimensions)) {
          collidingItems[item.id] = collidingItems[item.id] || [item];
          collidingItems[item.id].push(other);
        }
      }
    }

    // Make a sorted list of collidingItems by comparing the length of each list.
    // The longer lists need to be dealt with last since having more
    // collisding items will make the line height smaller for each item.
    const list = Object.keys(collidingItems).sort((a, b) => {
      const itemGroupA = collidingItems[a];
      const itemGroupB = collidingItems[b];
      const diff = itemGroupA.length - itemGroupB.length;

      if (diff === 0) {
        return 0;
      } else if (diff < 0) {
        return -1;
      } else {
        return 1;
      }
    });

    // loop through the sorted collided items
    list.forEach(itemId => {
      let items = collidingItems[itemId];

      let groupId = null;
      for (let key in groupOrders) {
        if (groupOrders[key] == index) {
            groupId = key;
        }
      }

      // See if we have a show more button in the column to hide the record below
      const hasShowMore = showMoreButtons.filter(button => button.groupId === parseInt(groupId));

      // sort each item by id so they are in a consistent order
      items = items.sort((a, b) => a.id < b.id ? -1 : 1 );

      // adjusted height after accounting for itemVerticalMargin
      let groupHeightAdjusted = groupHeight - (itemSpacing * (4));

      // dynamic line height to fit items into the group height
      let divideBy = items.length > 3 ? 4 : items.length;

      let lineHeight = Math.floor(groupHeightAdjusted / divideBy);

      let itemSpacingTotal = itemSpacing;

      // Loop through this set of collided items
      // and set the new dimensions for each one.
      // Bump each one down to the next lineHeight so they stack.
      for (i = 0; i < items.length; i++) {
        const item = items[i];
        // top offset relative to this group
        const topOffset = (lineHeight * i) + itemSpacingTotal;

        if (item) {
            // set the new dimensions to stack them
            item.dimensions.top = totalHeight + topOffset;
            item.dimensions.height = lineHeight;
        }

        // Hide if greater than 3 for the date and there is a show more button
        if (i > 2 && hasShowMore && hasShowMore.length) {
            hasShowMore.forEach(showMore => {
                showMore.items.some(showMoreItem => {
                    if (showMoreItem.id === item.id) {
                        item.dimensions.hide = true;
                        return true;
                    }
                });
            });
        }

        // Do some more fancy stuffs with collision
        if (i >= 4 && hasShowMore && !item.dimensions.hide) {
            collidingItems[itemId].some(collidingItem => {
                if (!horizontalCollision(collidingItem.dimensions, item.dimensions)) {
                    item.dimensions.top = collidingItem.dimensions.top;
                    return true;
                }
            });
        }

        itemSpacingTotal += itemSpacing;
      }
    });

    groupHeights.push(groupHeight)
    totalHeight += groupHeight
  });

  return {
    height: totalHeight,
    groupHeights,
    groupTops,
    groupedItems
  }
}

export function keyBy (value, key) {
  let obj = {}

  value.forEach(function (element, index, array) {
    obj[element[key]] = element
  })

  return obj
}

export function getGroupedItems (items, groupOrders) {
  var arr = []

  // Initialize with empty arrays for each group
  for (let i = 0; i < Object.keys(groupOrders).length; i++) {
    arr[i] = []
  }
  // Populate groups
  for (let i = 0; i < items.length; i++) {
    if (items[i].dimensions.order !== undefined) {
      arr[items[i].dimensions.order].push(items[i])
    }
  }

  return arr
}

export function hasSomeParentTheClass (element, classname) {
  if (element.className && element.className.split(' ').indexOf(classname) >= 0) return true
  return element.parentNode && hasSomeParentTheClass(element.parentNode, classname)
}

export function deepObjectCompare (obj1, obj2) {
  for (var p in obj1) {
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false

    switch (typeof (obj1[p])) {
      case 'object':
        if (!Object.compare(obj1[p], obj2[p])) return false
        break
      case 'function':
        if (typeof (obj2[p]) === 'undefined' || (p !== 'compare' && obj1[p].toString() !== obj2[p].toString())) return false
        break
      default:
        if (obj1[p] !== obj2[p]) return false
    }
  }

  for (var r in obj2) {
    if (typeof (obj1[r]) === 'undefined') return false
  }
  return true
};

import moment from 'moment';

const EPSILON = 0.001;

// so we could use both immutable.js objects and regular objects
export function _get (object, key) {
  return typeof object.get === 'function' ? object.get(key) : object[key];
}

export function _length (object) {
  return typeof object.count === 'function' ? object.count() : object.length;
}

export function arraysEqual (array1, array2) {
  return (_length(array1) === _length(array2)) && array1.every((element, index) => {
    return element === _get(array2, index);
  });
}

export function iterateTimes (start, end, unit, timeSteps, callback) {
  let time = moment(start).startOf(unit);

  if (timeSteps[unit] && timeSteps[unit] > 1) {
    let value = time.get(unit);
    time.set(unit, value - (value % timeSteps[unit]));
  }

  while (time.valueOf() < end) {
    let nextTime = moment(time).add(timeSteps[unit] || 1, `${unit}s`);
    callback(time, nextTime);
    time = nextTime;
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
  };

  let minUnit = 'year';
  let breakCount = zoom;
  const minCellWidth = 17;

  Object.keys(timeDividers).some(unit => {
    breakCount = breakCount / timeDividers[unit];
    const cellCount = breakCount / timeSteps[unit];
    const countNeeded = width / (timeSteps[unit] && timeSteps[unit] > 1 ? 3 * minCellWidth : minCellWidth);

    if (cellCount < countNeeded) {
      minUnit = unit;
      return true;
    }
  });

  return minUnit;
}

export function getNextUnit (unit) {
  let nextUnits = {
    second: 'minute',
    minute: 'hour',
    hour: 'day',
    day: 'month',
    month: 'year'
  };

  return nextUnits[unit] || '';
}

export function getParentPosition (element) {
  var xPosition = 0;
  var yPosition = 0;
  var first = true;

  while (element) {
    xPosition += (element.offsetLeft - (first ? 0 : element.scrollLeft) + element.clientLeft);
    yPosition += (element.offsetTop - (first ? 0 : element.scrollTop) + element.clientTop);
    element = element.offsetParent;
    first = false;
  }
  return { x: xPosition, y: yPosition };
}

export function coordinateToTimeRatio (canvasTimeStart, canvasTimeEnd, canvasWidth) {
  return (canvasTimeEnd - canvasTimeStart) / canvasWidth;
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
  const itemStart = (isResizing && resizingEdge === 'left' ? resizeTime : itemTimeStart);
  const itemEnd = (isResizing && resizingEdge === 'right' ? resizeTime : itemTimeEnd);

  let x = isDragging ? dragTime : itemStart;

  let w = Math.max(itemEnd - itemStart, dragSnap);

  let collisionX = itemStart;
  let collisionW = w;

  if (isDragging) {
    if (itemTimeStart >= dragTime) {
      collisionX = dragTime;
      collisionW = Math.max(itemTimeEnd - dragTime, dragSnap);
    } else {
      collisionW = Math.max(dragTime - itemTimeStart + w, dragSnap);
    }
  }

  let clippedLeft = false;
  let clippedRight = false;

  if (fullUpdate) {
    if (!isDragging && (visibleTimeStart > x + w || visibleTimeEnd < x)) {
      return null;
    }

    if (visibleTimeStart > x) {
      w -= (visibleTimeStart - x);
      x = visibleTimeStart;
      if (isDragging && w < 0) {
        x += w;
        w = 0;
      }
      clippedLeft = true;
    }
    if (x + w > visibleTimeEnd) {
      w -= ((x + w) - visibleTimeEnd);
      clippedRight = true;
    }
  }

  const ratio = 1 / coordinateToTimeRatio(canvasTimeStart, canvasTimeEnd, canvasWidth);

  const dimensions = {
    left: (x - canvasTimeStart) * ratio,
    width: Math.max(w * ratio, 3),
    collisionLeft: collisionX,
    originalLeft: itemTimeStart,
    collisionWidth: collisionW,
    clippedLeft,
    clippedRight
  };

  return dimensions;
}

export function getGroupOrders (groups, keys) {
  const { groupIdKey } = keys;

  let groupOrders = {};

  for (let i = 0; i < groups.length; i++) {
    groupOrders[_get(groups[i], groupIdKey)] = i;
  }

  return groupOrders;
}

export function getVisibleItems (items, canvasTimeStart, canvasTimeEnd, keys) {
  const { itemTimeStartKey, itemTimeEndKey } = keys;

  return items.filter(item => {
    return _get(item, itemTimeStartKey) <= canvasTimeEnd && _get(item, itemTimeEndKey) >= canvasTimeStart;
  });
}

export function collision (a, b, lineHeight) {
  var verticalMargin = 0;
  return ((a.collisionLeft + EPSILON) < (b.collisionLeft + b.collisionWidth) &&
  (a.collisionLeft + a.collisionWidth - EPSILON) > b.collisionLeft &&
  (a.top - verticalMargin + EPSILON) < (b.top + b.height) &&
  (a.top + a.height + verticalMargin - EPSILON) > b.top);
}

export function stack (items, groupOrders, lineHeight, headerHeight, force) {
  var i, iMax;
  var totalHeight = headerHeight;

  var groupHeights = [];
  var groupTops = [];

  var groupedItems = getGroupedItems(items, groupOrders);

  if (force) {
    // reset top position of all items
    for (i = 0, iMax = items.length; i < iMax; i++) {
      items[i].dimensions.top = null;
    }
  }

  groupedItems.forEach(function (group, index, array) {
    // calculate new, non-overlapping positions
    groupTops.push(totalHeight);

    var groupHeight = 0;
    var verticalMargin = 0;
    for (i = 0, iMax = group.length; i < iMax; i++) {
      var item = group[i];
      verticalMargin = (lineHeight - item.dimensions.height);

      if (item.dimensions.stack && item.dimensions.top === null) {
        item.dimensions.top = totalHeight + verticalMargin;
        groupHeight = Math.max(groupHeight, lineHeight);
        do {
          var collidingItem = null;
          for (var j = 0, jj = group.length; j < jj; j++) {
            var other = group[j];
            if (other.dimensions.top !== null && other !== item && other.dimensions.stack && collision(item.dimensions, other.dimensions, lineHeight)) {
              collidingItem = other;
              break;
            } else {
              // console.log('dont test', other.top !== null, other !== item, other.stack);
            }
          }

          if (collidingItem != null) {
            // There is a collision. Reposition the items above the colliding element
            item.dimensions.top = collidingItem.dimensions.top + lineHeight;
            groupHeight = Math.max(groupHeight, item.dimensions.top + item.dimensions.height - totalHeight);
          }
        } while (collidingItem);
      }
    }

    groupHeights.push(Math.max(groupHeight + verticalMargin, lineHeight));
    totalHeight += Math.max(groupHeight + verticalMargin, lineHeight);
  });
  return {
    height: totalHeight,
    groupHeights,
    groupTops
  };
}

export function nostack (items, groupOrders, lineHeight, headerHeight, force) {
  var i, iMax;

  var totalHeight = headerHeight;

  var groupHeights = [];
  var groupTops = [];

  var groupedItems = getGroupedItems(items, groupOrders);

  if (force) {
    // reset top position of all items
    for (i = 0, iMax = items.length; i < iMax; i++) {
      items[i].dimensions.top = null;
    }
  }

  groupedItems.forEach(function (group, index, array) {
    // calculate new, non-overlapping positions
    groupTops.push(totalHeight);

    var groupHeight = 0;
    for (i = 0, iMax = group.length; i < iMax; i++) {
      var item = group[i];
      var verticalMargin = (lineHeight - item.dimensions.height) / 2;

      if (item.dimensions.top === null) {
        item.dimensions.top = totalHeight + verticalMargin;
        groupHeight = Math.max(groupHeight, lineHeight);
      }
    }

    groupHeights.push(Math.max(groupHeight, lineHeight));
    totalHeight += Math.max(groupHeight, lineHeight);
  });
  return {
    height: totalHeight,
    groupHeights,
    groupTops,
    groupedItems
  };
}

export function stackFixedGroupHeight (items, groupOrders, lineHeight, headerHeight, force, groupHeight, itemHeight, timeframe, timeSteps) {
  const itemSpacing = 4;

  let totalHeight = headerHeight;

  let groupHeights = [];
  let groupTops = [];
  let groupedItems = getGroupedItems(items, groupOrders);

  let showMoreDataSlots = {};

  let format = 'YYYY-MM-DD';
  if (timeframe === 'hour') {
      format = null; // defaults to ISO format
  }

  let hiddenItemIds = [];

  // hide an item in the group and make it available in a show more popup
  function hideItem(groupId, item) {
    if (hiddenItemIds.includes(item.id)) return;

    item.dimensions.hide = true;

    iterateTimes(item.start_time, item.end_time, timeframe, timeSteps, (time) => {
      const slot = time.format(format);
      // initialize object for this group
      showMoreDataSlots[groupId] = showMoreDataSlots[groupId] || {};
      // initialize array for this group/date
      showMoreDataSlots[groupId][slot] = showMoreDataSlots[groupId][slot] || [];
      // add the item to this group/date list
      showMoreDataSlots[groupId][slot].push(item);
    });

    hiddenItemIds.push(item.id);
  }

  // reset top position of all items
  for (let i = 0; i < items.length; i++) {
    items[i].dimensions.top = null;
  }

  groupedItems.forEach(function (group, index) {
    // calculate new, non-overlapping positions
    groupTops.push(totalHeight);

    // figure out the groupId from groupOrders object,
    // which is a key/value - [groupId: number]: order: number
    let groupId;
    for (let key in groupOrders) {
      if (groupOrders[key] === index) {
          groupId = key;
      }
    }

    // Loop through all items and do some collision detection.
    // Reposition items top position until no more are colliding.
    for (let i = 0; i < group.length; i++) {
      let item = group[i];

      if (item.dimensions.top === null) {
        item.dimensions.top = totalHeight + itemSpacing;

        do {
          var collidingItem = null;
          for (let j = 0; j < group.length; j++) {
            let other = group[j];
            if (other.dimensions.top !== null && other !== item && collision(item.dimensions, other.dimensions)) {
              collidingItem = other;
              break;
            }
          }

          if (collidingItem !== null) {
            // There is a collision. Reposition the items below the colliding element
            item.dimensions.top = collidingItem.dimensions.top + itemHeight + itemSpacing;
          }
        } while (collidingItem);
      }

      // Check if the item is outside of the group height
      if (item.dimensions.top + item.dimensions.height > totalHeight + groupHeight) {
        // Item is outside of the fixed group heigh, so hide it and add it to a show more button
        hideItem(groupId, item);

        // Once there is a hidden item in a group we have to hide the previous item
        // to make room for the show more button at the bottom of the group.
        if (i !== 0) {
          hideItem(groupId, group[i - 1]);
        }
      }
    }

    groupHeights.push(groupHeight);
    totalHeight += groupHeight;
  });

  // now build a list of show more buttons to be displayed
  let showMoreButtons = [];
  for (let groupId in showMoreDataSlots) {
    for (let slot in showMoreDataSlots[groupId]) {
      showMoreButtons.push({
        id: `${groupId}-${slot}`,
        groupId: parseInt(groupId),
        timeframe,
        slot,
        items: showMoreDataSlots[groupId][slot]
      });
    }
  }

  return {
    height: totalHeight,
    groupHeights,
    groupTops,
    groupedItems,
    showMoreButtons
  };
}

export function keyBy (value, key) {
  let obj = {};

  value.forEach(function (element, index, array) {
    obj[element[key]] = element;
  });

  return obj;
}

export function getGroupedItems (items, groupOrders) {
  var arr = [];

  // Initialize with empty arrays for each group
  for (let i = 0; i < Object.keys(groupOrders).length; i++) {
    arr[i] = [];
  }
  // Populate groups
  for (let i = 0; i < items.length; i++) {
    if (items[i].dimensions.order !== undefined) {
      arr[items[i].dimensions.order].push(items[i]);
    }
  }

  return arr;
}

export function hasSomeParentTheClass (element, classname) {
  if (element.className && element.className.split(' ').indexOf(classname) >= 0) return true;
  return element.parentNode && hasSomeParentTheClass(element.parentNode, classname);
}

export function deepObjectCompare (obj1, obj2) {
  for (var p in obj1) {
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

    switch (typeof (obj1[p])) {
      case 'object':
        if (!Object.compare(obj1[p], obj2[p])) return false;
        break;
      case 'function':
        if (typeof (obj2[p]) === 'undefined' || (p !== 'compare' && obj1[p].toString() !== obj2[p].toString())) return false;
        break;
      default:
        if (obj1[p] !== obj2[p]) return false;
    }
  }

  for (var r in obj2) {
    if (typeof (obj1[r]) === 'undefined') return false;
  }
  return true;
}

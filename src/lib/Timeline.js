import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';
import './Timeline.scss';

import Items from './items/Items';
import InfoLabel from './layout/InfoLabel';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import VerticalLines from './lines/VerticalLines';
import HorizontalLines from './lines/HorizontalLines';
import TodayLine from './lines/TodayLine';
import CursorLine from './lines/CursorLine';
import ShowMoreButton from './layout/ShowMoreButton';

import windowResizeDetector from '../resize-detector/window';

import WatchForClickOut from 'xv/util/WatchForClickOut';

import { getMinUnit, getParentPosition, _get, _length, stack, nostack, stackFixedGroupHeight, calculateDimensions, getGroupOrders, getVisibleItems, hasSomeParentTheClass } from './utils.js';

export const defaultKeys = {
  groupIdKey: 'id',
  groupTitleKey: 'title',
  groupRightTitleKey: 'rightTitle',
  itemIdKey: 'id',
  itemTitleKey: 'title',
  itemDivTitleKey: 'title',
  itemGroupKey: 'group',
  itemTimeStartKey: 'start_time',
  itemTimeEndKey: 'end_time'
};

export const defaultTimeSteps = {
  second: 1,
  minute: 1,
  hour: 1,
  day: 1,
  month: 1,
  year: 1
};

export const defaultHeaderLabelFormats = {
  yearShort: 'YY',
  yearLong: 'YYYY',
  monthShort: 'MM/YY',
  monthMedium: 'MM/YYYY',
  monthMediumLong: 'MMM YYYY',
  monthLong: 'MMMM YYYY',
  dayShort: 'L',
  dayLong: 'dddd, LL',
  hourShort: 'HH',
  hourMedium: 'HH:00',
  hourMediumLong: 'L, HH:00',
  hourLong: 'dddd, LL, HH:00',
  time: 'LLL'
};

export const defaultSubHeaderLabelFormats = {
  yearShort: 'YY',
  yearLong: 'YYYY',
  monthShort: 'MM',
  monthMedium: 'MMM',
  monthLong: 'MMMM',
  dayShort: 'D',
  dayMedium: 'dd D',
  dayMediumLong: 'ddd, Do',
  dayLong: 'dddd, Do',
  hourShort: 'HH',
  hourLong: 'HH:00',
  minuteShort: 'mm',
  minuteLong: 'HH:mm'
};

const padding = 10;

export default class ReactCalendarTimeline extends Component {
  static propTypes = {
    groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    items: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    sidebarWidth: PropTypes.number,
    sidebarContent: PropTypes.node,
    rightSidebarWidth: PropTypes.number,
    rightSidebarContent: PropTypes.node,
    dragSnap: PropTypes.number,
    minResizeWidth: PropTypes.number,
    fixedHeader: PropTypes.oneOf(['fixed', 'sticky', 'none']),
    stickyOffset: PropTypes.number,
    fullUpdate: PropTypes.bool,
    lineHeight: PropTypes.number,
    headerLabelGroupHeight: PropTypes.number,
    headerLabelHeight: PropTypes.number,
    itemHeightRatio: PropTypes.number,

    minZoom: PropTypes.number,
    maxZoom: PropTypes.number,

    clickTolerance: PropTypes.number,

    canChangeGroup: PropTypes.bool,
    canMove: PropTypes.bool,
    canResize: PropTypes.oneOf([true, false, 'left', 'right', 'both']),
    useResizeHandle: PropTypes.bool,
    canSelect: PropTypes.bool,

    stackItems: PropTypes.bool,
    groupHeight: PropTypes.number,

    traditionalZoom: PropTypes.bool,
    showCursorLine: PropTypes.bool,

    itemTouchSendsClick: PropTypes.bool,

    onItemMove: PropTypes.func,
    onItemResize: PropTypes.func,
    onItemClick: PropTypes.func,
    onItemSelect: PropTypes.func,
    onItemDeselect: PropTypes.func,
    onCanvasClick: PropTypes.func,
    onItemDoubleClick: PropTypes.func,
    onItemContextMenu: PropTypes.func,
    onCanvasDoubleClick: PropTypes.func,
    onCanvasContextMenu: PropTypes.func,
    onCanvasMouseEnter: PropTypes.func,
    onCanvasMouseLeave: PropTypes.func,
    onCanvasMouseMove: PropTypes.func,
    onHeaderClick: PropTypes.func,

    moveResizeValidator: PropTypes.func,
    timeFrame: PropTypes.string,

    itemRenderer: PropTypes.func,
    groupRenderer: PropTypes.func,

    dayBackground: PropTypes.func,

    style: PropTypes.object,

    keys: PropTypes.shape({
      groupIdKey: PropTypes.string,
      groupTitleKey: PropTypes.string,
      groupRightTitleKey: PropTypes.string,
      itemIdKey: PropTypes.string,
      itemTitleKey: PropTypes.string,
      itemDivTitleKey: PropTypes.string,
      itemGroupKey: PropTypes.string,
      itemTimeStartKey: PropTypes.string,
      itemTimeEndKey: PropTypes.string
    }),

    timeSteps: PropTypes.shape({
      second: PropTypes.number,
      minute: PropTypes.number,
      hour: PropTypes.number,
      day: PropTypes.number,
      month: PropTypes.number,
      year: PropTypes.number
    }),

    defaultTimeStart: PropTypes.object,
    defaultTimeEnd: PropTypes.object,

    visibleTimeStart: PropTypes.number,
    visibleTimeEnd: PropTypes.number,
    onTimeChange: PropTypes.func,
    onTimeInit: PropTypes.func,
    onBoundsChange: PropTypes.func,

    selected: PropTypes.array,

    headerLabelFormats: PropTypes.shape({
      yearShort: PropTypes.string,
      yearLong: PropTypes.string,
      monthShort: PropTypes.string,
      monthMedium: PropTypes.string,
      monthMediumLong: PropTypes.string,
      monthLong: PropTypes.string,
      dayShort: PropTypes.string,
      dayLong: PropTypes.string,
      hourShort: PropTypes.string,
      hourMedium: PropTypes.string,
      hourMediumLong: PropTypes.string,
      hourLong: PropTypes.string
    }),

    subHeaderLabelFormats: PropTypes.shape({
      yearShort: PropTypes.string,
      yearLong: PropTypes.string,
      monthShort: PropTypes.string,
      monthMedium: PropTypes.string,
      monthLong: PropTypes.string,
      dayShort: PropTypes.string,
      dayMedium: PropTypes.string,
      dayMediumLong: PropTypes.string,
      dayLong: PropTypes.string,
      hourShort: PropTypes.string,
      hourLong: PropTypes.string,
      minuteShort: PropTypes.string,
      minuteLong: PropTypes.string
    }),

    resizeDetector: PropTypes.shape({
      addListener: PropTypes.func,
      removeListener: PropTypes.func
    }),

    scrollContainerClassname: PropTypes.string,
    itemStyles: PropTypes.object,
    children: PropTypes.node
  }

  static defaultProps = {
    sidebarWidth: 150,
    rightSidebarWidth: 0,
    dragSnap: 1000 * 60 * 15, // 15min
    minResizeWidth: 20,
    fixedHeader: 'sticky', // fixed or sticky or none
    fullUpdate: true,
    lineHeight: 30,
    headerLabelGroupHeight: 30,
    headerLabelHeight: 30,
    itemHeightRatio: 0.65,

    minZoom: 60 * 60 * 1000, // 1 hour
    maxZoom: 5 * 365.24 * 86400 * 1000, // 5 years

    clickTolerance: 3, // how many pixels can we drag for it to be still considered a click?

    canChangeGroup: true,
    canMove: true,
    canResize: 'right',
    useResizeHandle: false,
    canSelect: true,

    stackItems: false,
    groupHeight: false,

    traditionalZoom: false,
    showCursorLine: false,

    onItemMove: null,
    onItemResize: null,
    onItemClick: null,
    onItemSelect: null,
    onItemDeselect: null,
    onCanvasClick: null,
    onItemDoubleClick: null,
    onItemContextMenu: null,
    onCanvasMouseEnter: null,
    onCanvasMouseLeave: null,
    onCanvasMouseMove: null,
    onHeaderClick: null,

    moveResizeValidator: null,

    dayBackground: null,

    defaultTimeStart: null,
    defaultTimeEnd: null,

    itemTouchSendsClick: false,

    style: {},
    keys: defaultKeys,
    timeSteps: defaultTimeSteps,

    // if you pass in visibleTimeStart and visibleTimeEnd, you must also pass onTimeChange(visibleTimeStart, visibleTimeEnd),
    // which needs to update the props visibleTimeStart and visibleTimeEnd to the ones passed
    visibleTimeStart: null,
    visibleTimeEnd: null,
    onTimeChange: function (visibleTimeStart, visibleTimeEnd, updateScrollCanvas) {
      updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
    },
    // called after the calendar loads and the visible time has been calculated
    onTimeInit: null,
    // called when the canvas area of the calendar changes
    onBoundsChange: null,
    children: null,

    headerLabelFormats: defaultHeaderLabelFormats,
    subHeaderLabelFormats: defaultSubHeaderLabelFormats,

    selected: null
  }

  constructor (props) {
    super(props);

    let visibleTimeStart = null;
    let visibleTimeEnd = null;

    if (this.props.defaultTimeStart && this.props.defaultTimeEnd) {
      visibleTimeStart = this.props.defaultTimeStart.valueOf();
      visibleTimeEnd = this.props.defaultTimeEnd.valueOf();
    } else if (this.props.visibleTimeStart && this.props.visibleTimeEnd) {
      visibleTimeStart = this.props.visibleTimeStart;
      visibleTimeEnd = this.props.visibleTimeEnd;
    } else {
      visibleTimeStart = Math.min(...this.props.items.map(item => _get(item, 'start').getTime()));
      visibleTimeEnd = Math.max(...this.props.items.map(item => _get(item, 'end').getTime()));

      if (!visibleTimeStart || !visibleTimeEnd) {
        visibleTimeStart = new Date().getTime() - 86400 * 7 * 1000;
        visibleTimeEnd = new Date().getTime() + 86400 * 7 * 1000;
      }

      if (this.props.onTimeInit) {
        this.props.onTimeInit(visibleTimeStart, visibleTimeEnd);
      }
    }

    this.showMoreRef = React.createRef();

    this.state = {
      width: 1000,

      visibleTimeStart: visibleTimeStart,
      visibleTimeEnd: visibleTimeEnd,
      canvasTimeStart: visibleTimeStart - (visibleTimeEnd - visibleTimeStart),

      headerPosition: 'top',

      selectedItem: null,
      dragTime: null,
      dragGroupTitle: null,
      resizeTime: null,
      isDragging: false,
      topOffset: 0,
      resizingItem: null,
      resizingEdge: null,

      showMore: null,

      scrollOffset: 0,

      timeframe: props.timeframe ? props.timeframe : 'day'
    };

    const {
      dimensionItems, height, groupHeights, groupTops, groupedItems, showMoreButtons
    } = this.stackItems(props.items, props.groups, this.state.canvasTimeStart, this.state.visibleTimeStart, this.state.visibleTimeEnd, this.state.width);

    this.state.dimensionItems = dimensionItems;
    this.state.height = height;
    this.state.groupHeights = groupHeights;
    this.state.groupTops = groupTops;
    this.state.groupedItems = groupedItems;
    this.state.showMoreButtons = showMoreButtons;
    this.state.showMorePosition = { top: null, left: null, diffLeft: 0, diffTop: 0, width: 0 };
  }

  componentDidMount () {
    this.resize(this.props);

    if (this.props.resizeDetector && this.props.resizeDetector.addListener) {
      this.props.resizeDetector.addListener(this);
    }

    windowResizeDetector.addListener(this);

    this.lastTouchDistance = null;

    const scrollContainer = document.querySelector(this.props.scrollContainerClassname);
    if (this.props.scrollContainerClassname && scrollContainer) {
        scrollContainer.addEventListener('scroll', this.scrollEventListener);
    } else {
        window.addEventListener('scroll', this.scrollEventListener);
    }

    this.refs.scrollComponent.addEventListener('touchstart', this.touchStart);
    this.refs.scrollComponent.addEventListener('touchmove', this.touchMove);
    this.refs.scrollComponent.addEventListener('touchend', this.touchEnd);
  }

  componentWillUnmount () {
    if (this.props.resizeDetector && this.props.resizeDetector.addListener) {
      this.props.resizeDetector.removeListener(this);
    }

    windowResizeDetector.removeListener(this);
    const scrollContainer = document.querySelector(this.props.scrollContainerClassname);

    if (this.props.scrollContainerClassname && scrollContainer) {
        scrollContainer.removeEventListener('scroll', this.scrollEventListener);
    } else {
        window.removeEventListener('scroll', this.scrollEventListener);
    }

    this.refs.scrollComponent.removeEventListener('touchstart', this.touchStart);
    this.refs.scrollComponent.removeEventListener('touchmove', this.touchMove);
    this.refs.scrollComponent.removeEventListener('touchend', this.touchEnd);
  }

  componentDidUpdate() {
    if (this.showMoreRef.current) {
      let top = parseInt(this.showMoreRef.current.style.top);
      let left = parseInt(this.showMoreRef.current.style.left);
      const boundingRect = this.showMoreRef.current.getBoundingClientRect();
      const width = boundingRect.width;
      const height = boundingRect.height;

      const maxHeightWithPadding = window.innerHeight - padding;
      const maxWidthWithPadding = window.innerWidth - padding;

      const currentMaxX = boundingRect.x + width;
      const currentMaxY = boundingRect.y + height;

      if (currentMaxX > maxWidthWithPadding) {
        left -= currentMaxX - maxWidthWithPadding;
      }

      if (currentMaxY > maxHeightWithPadding) {
        top -= currentMaxY - maxHeightWithPadding;
      }

      this.showMoreRef.current.style.top = `${top}px`;
      this.showMoreRef.current.style.left = `${left}px`;
    }
  }

  // called on window scroll. it's job is to figure out if we should fix or float the header
  scrollEventListener = (e) => {
    const { headerLabelGroupHeight, headerLabelHeight, stickyOffset, scrollContainerClassname } = this.props;
    const headerHeight = headerLabelGroupHeight + headerLabelHeight;

    const rect = this.refs.container.getBoundingClientRect();
    const topOffset = stickyOffset ? stickyOffset : 0;
    const scrollOffset = scrollContainerClassname ? e.target.scrollTop : 0;

    this.setState({ showMore: null });

    if (rect.top > topOffset) {
      this.setState({ headerPosition: 'top', scrollOffset });
    } else if (rect.bottom < headerHeight) {
      this.setState({ headerPosition: 'bottom', scrollOffset });
    } else {
      this.setState({ headerPosition: 'fixed', scrollOffset });
    }

    this.calcTopOffset();
  }

  touchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();

      this.lastTouchDistance = Math.abs(e.touches[0].screenX - e.touches[1].screenX);
      this.singleTouchStart = null;
      this.lastSingleTouch = null;
    } else if (e.touches.length === 1) {
      let x = e.touches[0].clientX;
      let y = e.touches[0].clientY;

      this.lastTouchDistance = null;
      this.singleTouchStart = {x: x, y: y, screenY: window.pageYOffset};
      this.lastSingleTouch = {x: x, y: y, screenY: window.pageYOffset};
    }
  }

  touchMove = (e) => {
    if (this.state.dragTime || this.state.resizeTime) {
      e.preventDefault();
      return;
    }
    if (this.lastTouchDistance && e.touches.length === 2) {
      e.preventDefault();

      let touchDistance = Math.abs(e.touches[0].screenX - e.touches[1].screenX);

      let parentPosition = getParentPosition(e.currentTarget);
      let xPosition = (e.touches[0].screenX + e.touches[1].screenX) / 2 - parentPosition.x;

      if (touchDistance !== 0 && this.lastTouchDistance !== 0) {
        this.changeZoom(this.lastTouchDistance / touchDistance, xPosition / this.state.width);
        this.lastTouchDistance = touchDistance;
      }
    } else if (this.lastSingleTouch && e.touches.length === 1) {
      e.preventDefault();

      let x = e.touches[0].clientX;
      let y = e.touches[0].clientY;

      let deltaX = x - this.lastSingleTouch.x;
      // let deltaY = y - this.lastSingleTouch.y

      let deltaX0 = x - this.singleTouchStart.x;
      let deltaY0 = y - this.singleTouchStart.y;

      this.lastSingleTouch = {x: x, y: y};

      let moveX = Math.abs(deltaX0) * 3 > Math.abs(deltaY0);
      let moveY = Math.abs(deltaY0) * 3 > Math.abs(deltaX0);

      if (deltaX !== 0 && moveX) {
        this.refs.scrollComponent.scrollLeft -= deltaX;
      }
      if (moveY) {
        window.scrollTo(window.pageXOffset, this.singleTouchStart.screenY - deltaY0);
      }
    }
  }

  touchEnd = (e) => {
    if (this.lastTouchDistance) {
      e.preventDefault();

      this.lastTouchDistance = null;
    }
    if (this.lastSingleTouch) {
      this.lastSingleTouch = null;
      this.singleTouchStart = null;
    }
  }

  resize = (props = this.props) => {
      this.calcTopOffset();
      if (this.refs.container) {
          const { width: containerWidth } = this.refs.container.getBoundingClientRect();
          let width = containerWidth - props.sidebarWidth - props.rightSidebarWidth;

          const {
            dimensionItems, height, groupHeights, groupTops, groupedItems
          } = this.stackItems(props.items, props.groups, this.state.canvasTimeStart, this.state.visibleTimeStart, this.state.visibleTimeEnd, width);

          this.setState({
            width: width,
            dimensionItems: dimensionItems,
            height: height,
            groupHeights: groupHeights,
            groupTops: groupTops,
            groupedItems: groupedItems
          });
          this.refs.scrollComponent.scrollLeft = width;
      }
  }

  calcTopOffset = () => {
    if (this.refs.container) {
      const { top: containerTop } = this.refs.container.getBoundingClientRect();

      this.setState({
        topOffset: containerTop + window.pageYOffset,
      });
    }
  }

  onScroll = () => {
    const scrollComponent = this.refs.scrollComponent;
    const canvasTimeStart = this.state.canvasTimeStart;
    const scrollX = scrollComponent.scrollLeft ? scrollComponent.scrollLeft : 0;
    const zoom = this.state.visibleTimeEnd - this.state.visibleTimeStart;
    const canvasWidth = this.state.width;
    const visibleTimeStart = canvasTimeStart + (zoom * scrollX / canvasWidth);

    this.setState({ showMore: null });

    // move the virtual canvas if needed, close the popup
    if (scrollX < this.state.width * 0.5) {
      this.setState({
        canvasTimeStart: this.state.canvasTimeStart - zoom
      });
      scrollComponent.scrollLeft += this.state.width;
    }
    if (scrollX > this.state.width * 1.5) {
      this.setState({
        canvasTimeStart: this.state.canvasTimeStart + zoom
      });
      scrollComponent.scrollLeft -= this.state.width;
    }

    if (this.state.visibleTimeStart !== visibleTimeStart || this.state.visibleTimeEnd !== visibleTimeStart + zoom) {
      this.props.onTimeChange(visibleTimeStart, visibleTimeStart + zoom, this.updateScrollCanvas);
    }

    this.calcTopOffset();
  }

  componentWillReceiveProps (nextProps) {
    const { visibleTimeStart, visibleTimeEnd, items, groups, sidebarWidth, timeframe } = nextProps;

    if (visibleTimeStart && visibleTimeEnd) {
      this.updateScrollCanvas(visibleTimeStart, visibleTimeEnd, items !== this.props.items || groups !== this.props.groups, items, groups);
    } else if (items !== this.props.items || groups !== this.props.groups) {
      this.updateDimensions(items, groups);
    }

    if (timeframe) {
        this.setState({ timeframe });
    }

    // resize if the sidebar width changed
    if (sidebarWidth !== this.props.sidebarWidth && items && groups) {
      this.resize(nextProps);
    }
  }

  updateDimensions (items, groups) {
    const { canvasTimeStart, visibleTimeStart, visibleTimeEnd, width } = this.state;
    const {
      dimensionItems, height, groupHeights, groupTops, groupedItems, showMoreButtons
    } = this.stackItems(items, groups, canvasTimeStart, visibleTimeStart, visibleTimeEnd, width);

    this.setState({ dimensionItems, height, groupHeights, groupTops, groupedItems, showMoreButtons });
  }

  // called when the visible time changes
  updateScrollCanvas = (visibleTimeStart, visibleTimeEnd, forceUpdateDimensions, updatedItems, updatedGroups) => {
    const oldCanvasTimeStart = this.state.canvasTimeStart;
    const oldZoom = this.state.visibleTimeEnd - this.state.visibleTimeStart;
    const newZoom = visibleTimeEnd - visibleTimeStart;
    const items = updatedItems || this.props.items;
    const groups = updatedGroups || this.props.groups;
    const { fullUpdate } = this.props;

    let newState = {
      visibleTimeStart: visibleTimeStart,
      visibleTimeEnd: visibleTimeEnd
    };

    let resetCanvas = false;

    const canKeepCanvas = visibleTimeStart >= oldCanvasTimeStart + oldZoom * 0.5 &&
                          visibleTimeStart <= oldCanvasTimeStart + oldZoom * 1.5 &&
                          visibleTimeEnd >= oldCanvasTimeStart + oldZoom * 1.5 &&
                          visibleTimeEnd <= oldCanvasTimeStart + oldZoom * 2.5;

    // if new visible time is in the right canvas area
    if (canKeepCanvas) {
      // but we need to update the scroll
      const newScrollLeft = Math.round(this.state.width * (visibleTimeStart - oldCanvasTimeStart) / newZoom);
      if (this.refs.scrollComponent.scrollLeft !== newScrollLeft) {
        resetCanvas = true;
      }
    } else {
      resetCanvas = true;
    }

    if (resetCanvas) {
      // Todo: need to calculate new dimensions
      newState.canvasTimeStart = visibleTimeStart - newZoom;
      this.refs.scrollComponent.scrollLeft = this.state.width;

      if (this.props.onBoundsChange) {
        this.props.onBoundsChange(newState.canvasTimeStart, newState.canvasTimeStart + newZoom * 3);
      }
    }

    if (resetCanvas || forceUpdateDimensions || fullUpdate) {
      const canvasTimeStart = newState.canvasTimeStart ? newState.canvasTimeStart : oldCanvasTimeStart;
      const {
        dimensionItems, height, groupHeights, groupTops, groupedItems, showMoreButtons
      } = this.stackItems(items, groups, canvasTimeStart, visibleTimeStart, visibleTimeEnd, this.state.width, fullUpdate);
      newState.dimensionItems = dimensionItems;
      newState.height = height;
      newState.groupHeights = groupHeights;
      newState.groupTops = groupTops;
      newState.groupedItems = groupedItems;
      newState.showMoreButtons = showMoreButtons;
    }

    this.setState(newState);
  }

  zoomWithWheel = (speed, xPosition, deltaY) => {
    this.changeZoom(1.0 + speed * deltaY / 500, xPosition / this.state.width);
  }

  zoomIn (e) {
    e.preventDefault();

    this.changeZoom(0.75);
  }

  zoomOut (e) {
    e.preventDefault();

    this.changeZoom(1.25);
  }

  changeZoom (scale, offset = 0.5) {
    const { minZoom, maxZoom } = this.props;
    const oldZoom = this.state.visibleTimeEnd - this.state.visibleTimeStart;
    const newZoom = Math.min(Math.max(Math.round(oldZoom * scale), minZoom), maxZoom); // min 1 min, max 20 years
    const newVisibleTimeStart = Math.round(this.state.visibleTimeStart + (oldZoom - newZoom) * offset);

    this.props.onTimeChange(newVisibleTimeStart, newVisibleTimeStart + newZoom, this.updateScrollCanvas);
  }

  onHeaderClick = (from, unit, e) => {
    this.props.onHeaderClick(from, unit, e);
  }

  selectItem = (item, clickType, e) => {
    if (this.state.selectedItem === item || (this.props.itemTouchSendsClick && clickType === 'touch')) {
      if (item && this.props.onItemClick) {
        this.props.onItemClick(item, e);
      }
    } else {
      this.setState({selectedItem: item});
      if (item && this.props.onItemSelect) {
        this.props.onItemSelect(item, e);
      } else if (item === null && this.props.onItemDeselect) {
        this.props.onItemDeselect(e);
      }
    }
  }

  rowAndTimeFromEvent = (e) => {
    const { headerLabelGroupHeight, headerLabelHeight, dragSnap } = this.props;
    const { width, groupHeights, visibleTimeStart, visibleTimeEnd } = this.state;
    const lineCount = _length(this.props.groups);

    // get coordinates relative to the component
    const parentPosition = getParentPosition(e.currentTarget);
    const x = e.clientX - parentPosition.x;
    const y = e.clientY - parentPosition.y;

    // calculate the y coordinate from `groupHeights` and header heights
    let row = 0;
    let remainingHeight = y - headerLabelGroupHeight - headerLabelHeight;

    while (row < lineCount && remainingHeight - groupHeights[row] > 0) {
      remainingHeight -= groupHeights[row];
      row += 1;
    }

    // calculate the x (time) coordinate taking the dragSnap into account
    let time = Math.round(visibleTimeStart + x / width * (visibleTimeEnd - visibleTimeStart));
    time = Math.floor(time / dragSnap) * dragSnap;

    return [row, time];
  }

  scrollAreaClick = (e) => {
    // if not clicking on an item

    if (!hasSomeParentTheClass(e.target, 'rct-item')) {
      if (this.state.selectedItem) {
        this.selectItem(null);
      } else if (this.props.onCanvasClick) {
        const [row, time] = this.rowAndTimeFromEvent(e);
        if (row >= 0 && row < this.props.groups.length) {
          const groupId = _get(this.props.groups[row], this.props.keys.groupIdKey);
          this.props.onCanvasClick(groupId, time, e);
        }
      }
    }
  }

  dragItem = (item, dragTime, newGroupOrder) => {
    let newGroup = this.props.groups[newGroupOrder];
    const keys = this.props.keys;
    this.setState({
      showMore: null,
      draggingItem: item,
      dragTime: dragTime,
      newGroupOrder: newGroupOrder,
      dragGroupTitle: newGroup ? _get(newGroup, keys.groupTitleKey) : ''
    });
  }

  dropItem = (item, dragTime, newGroupOrder) => {
    this.setState({draggingItem: null, dragTime: null, dragGroupTitle: null});
    if (this.props.onItemMove) {
      this.props.onItemMove(item, dragTime, newGroupOrder);
    }
  }

  resizingItem = (item, resizeTime, edge) => {
    this.setState({
      showMore: null,
      resizingItem: item,
      resizingEdge: edge,
      resizeTime: resizeTime
    });
  }

  resizedItem = (item, resizeTime, edge) => {
    this.setState({resizingItem: null, resizingEdge: null, resizeTime: null});
    if (this.props.onItemResize) {
      this.props.onItemResize(item, resizeTime, edge);
    }
  }

  handleMouseDown = (e) => {
    const { topOffset } = this.state;
    const { pageY } = e;
    const { headerLabelGroupHeight, headerLabelHeight } = this.props;
    const headerHeight = headerLabelGroupHeight + headerLabelHeight;

    this.calcTopOffset();

    if (pageY - topOffset > headerHeight && e.button === 0) {
      this.setState({isDragging: true, dragStartPosition: e.pageX, dragLastPosition: e.pageX});
    }
  }

  handleMouseMove = (e) => {
    if (this.state.isDragging && !this.state.draggingItem && !this.state.resizingItem) {
      this.refs.scrollComponent.scrollLeft += this.state.dragLastPosition - e.pageX;
      this.setState({dragLastPosition: e.pageX});
    }

    if (this.state.isDragging) {
      this.calcTopOffset();
    }
  }

  handleMouseUp = (e) => {
    const { dragStartPosition } = this.state;

    if (Math.abs(dragStartPosition - e.pageX) <= this.props.clickTolerance) {
      this.scrollAreaClick(e);
    }

    this.setState({isDragging: false, dragStartPosition: null, dragLastPosition: null});
  }

  handleCanvasMouseEnter = (e) => {
    const { showCursorLine } = this.props;
    if (showCursorLine) {
      this.setState({mouseOverCanvas: true});
    }

    if (this.props.onCanvasMouseEnter) {
      this.props.onCanvasMouseEnter(e);
    }
  }

  handleCanvasMouseLeave = (e) => {
    const { showCursorLine } = this.props;
    if (showCursorLine) {
      this.setState({mouseOverCanvas: false});
    }

    if (this.props.onCanvasMouseLeave) {
      this.props.onCanvasMouseLeave(e);
    }
  }

  handleCanvasMouseMove = (e) => {
    const { showCursorLine } = this.props;
    const { canvasTimeStart, width, visibleTimeStart, visibleTimeEnd, cursorTime } = this.state;
    const zoom = visibleTimeEnd - visibleTimeStart;
    const canvasTimeEnd = canvasTimeStart + zoom * 3;
    const canvasWidth = width * 3;
    const { pageX } = e;
    const ratio = (canvasTimeEnd - canvasTimeStart) / canvasWidth;
    const boundingRect = this.refs.scrollComponent.getBoundingClientRect();
    let timePosition = visibleTimeStart + ratio * (pageX - boundingRect.left);

    if (this.props.dragSnap) {
      timePosition = Math.round(timePosition / this.props.dragSnap) * this.props.dragSnap;
    }

    if (this.props.onCanvasMouseMove) {
      this.props.onCanvasMouseMove(e);
    }

    if (cursorTime !== timePosition && showCursorLine) {
      this.setState({cursorTime: timePosition, mouseOverCanvas: true});
    }
  }

  todayLine (canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, height, headerHeight) {
    return (
      <TodayLine canvasTimeStart={canvasTimeStart}
                 canvasTimeEnd={canvasTimeEnd}
                 canvasWidth={canvasWidth}
                 lineHeight={this.props.lineHeight}
                 lineCount={_length(this.props.groups)}
                 height={height}
                 headerHeight={headerHeight}
      />
    );
  }

  cursorLine (cursorTime, canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, height, headerHeight) {
    return (
      <CursorLine cursorTime={ cursorTime }
                  canvasTimeStart={canvasTimeStart}
                  canvasTimeEnd={canvasTimeEnd}
                  canvasWidth={canvasWidth}
                  lineHeight={this.props.lineHeight}
                  lineCount={_length(this.props.groups)}
                  height={height}
                  headerHeight={headerHeight}
      />
    );
  }

  verticalLines (canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, timeSteps, height, headerHeight) {
    return (
      <VerticalLines canvasTimeStart={canvasTimeStart}
                     canvasTimeEnd={canvasTimeEnd}
                     canvasWidth={canvasWidth}
                     lineHeight={this.props.lineHeight}
                     lineCount={_length(this.props.groups)}
                     minUnit={minUnit}
                     timeSteps={timeSteps}
                     fixedHeader={this.props.fixedHeader}
                     height={height}
                     headerHeight={headerHeight}
      />
    );
  }

  horizontalLines (canvasWidth, groupHeights, headerHeight) {
    return (
      <HorizontalLines canvasWidth={canvasWidth}
                       lineCount={_length(this.props.groups)}
                       groupHeights={groupHeights}
                       headerHeight={headerHeight}
      />
    );
  }

  items (canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, dimensionItems, groupHeights, groupTops, items, scrollOffset, itemStyles) {
    return (
      <Items itemStyles={itemStyles}
             scrollOffset={scrollOffset}
             canvasTimeStart={canvasTimeStart}
             canvasTimeEnd={canvasTimeEnd}
             canvasWidth={canvasWidth}
             lineCount={_length(this.props.groups)}
             dimensionItems={dimensionItems}
             minUnit={minUnit}
             groupHeights={groupHeights}
             groupTops={groupTops}
             items={items}
             groups={this.props.groups}
             keys={this.props.keys}
             selectedItem={this.state.selectedItem}
             dragSnap={this.props.dragSnap}
             minResizeWidth={this.props.minResizeWidth}
             canChangeGroup={this.props.canChangeGroup}
             canMove={this.props.canMove}
             canResize={this.props.canResize}
             useResizeHandle={this.props.useResizeHandle}
             canSelect={this.props.canSelect}
             moveResizeValidator={this.props.moveResizeValidator}
             topOffset={this.state.topOffset}
             itemSelect={this.selectItem}
             itemDrag={this.dragItem}
             itemDrop={this.dropItem}
             onItemDoubleClick={this.props.onItemDoubleClick}
             onItemContextMenu={this.props.onItemContextMenu}
             itemResizing={this.resizingItem}
             itemResized={this.resizedItem}
             itemRenderer={this.props.itemRenderer}
             selected={this.props.selected} />
    );
  }

  infoLabel () {
    let label = null;

    if (this.state.dragTime) {
      label = `${moment(this.state.dragTime).format('LLL')}, ${this.state.dragGroupTitle}`;
    } else if (this.state.resizeTime) {
      label = moment(this.state.resizeTime).format('LLL');
    }

    return label ? <InfoLabel label={label} /> : '';
  }

  header (canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, timeSteps, headerLabelGroupHeight, headerLabelHeight) {
    return (
      <Header onHeaderClick={this.props.onHeaderClick}
              canvasTimeStart={canvasTimeStart}
              hasRightSidebar={this.props.rightSidebarWidth > 0}
              canvasTimeEnd={canvasTimeEnd}
              canvasWidth={canvasWidth}
              lineHeight={this.props.lineHeight}
              minUnit={minUnit}
              timeSteps={timeSteps}
              headerLabelGroupHeight={headerLabelGroupHeight}
              headerLabelHeight={headerLabelHeight}
              width={this.state.width}
              zoom={zoom}
              visibleTimeStart={this.state.visibleTimeStart}
              visibleTimeEnd={this.state.visibleTimeEnd}
              headerPosition={this.state.headerPosition}
              fixedHeader={this.props.fixedHeader}
              stickyOffset={this.props.stickyOffset}
              headerLabelFormats={this.props.headerLabelFormats}
              subHeaderLabelFormats={this.props.subHeaderLabelFormats} />
    );
  }

  sidebar (height, groupHeights, headerHeight) {
    return (
      <Sidebar groups={this.props.groups}
               groupRenderer={this.props.groupRenderer}
               keys={this.props.keys}

               width={this.props.sidebarWidth}
               lineHeight={this.props.lineHeight}
               groupHeights={groupHeights}
               height={height}
               headerHeight={headerHeight}
               stickyOffset={this.props.stickyOffset}
               headerPosition={this.state.headerPosition}
               fixedHeader={this.props.fixedHeader}>
        {this.props.sidebarContent}
      </Sidebar>
    );
  }

  rightSidebar (height, groupHeights, headerHeight) {
    return (
      <Sidebar groups={this.props.groups}
               keys={this.props.keys}
               isRightSidebar

               width={this.props.rightSidebarWidth}
               lineHeight={this.props.lineHeight}
               groupHeights={groupHeights}
               height={height}
               headerHeight={headerHeight}

               headerPosition={this.state.headerPosition}
               fixedHeader={this.props.fixedHeader}>
        {this.props.rightSidebarContent}
      </Sidebar>
    );
  }

  stackItems (items, groups, canvasTimeStart, visibleTimeStart, visibleTimeEnd, width) {
    // if there are no groups return an empty array of dimensions
    if (groups.length === 0) {
      return {
        dimensionItems: [],
        height: 0,
        groupHeights: [],
        groupTops: []
      };
    }

    const { keys, dragSnap, lineHeight, headerLabelGroupHeight, headerLabelHeight, stackItems, fullUpdate, itemHeightRatio, groupHeight, timeSteps } = this.props;
    const { draggingItem, dragTime, resizingItem, resizingEdge, resizeTime, newGroupOrder, timeframe } = this.state;
    const zoom = visibleTimeEnd - visibleTimeStart;
    const canvasTimeEnd = canvasTimeStart + zoom * 3;
    const canvasWidth = width * 3;
    const headerHeight = headerLabelGroupHeight + headerLabelHeight;

    const visibleItems = getVisibleItems(items, canvasTimeStart, canvasTimeEnd, keys);
    const groupOrders = getGroupOrders(groups, keys);

    const itemHeight = 20;

    let dimensionItems = visibleItems.reduce((memo, item) => {
      const itemId = _get(item, keys.itemIdKey);
      const isDragging = (itemId === draggingItem);
      const isResizing = (itemId === resizingItem);

      let dimension = calculateDimensions({
        itemTimeStart: _get(item, keys.itemTimeStartKey),
        itemTimeEnd: _get(item, keys.itemTimeEndKey),
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
      });

      if (dimension) {
        dimension.top = null;
        dimension.order = isDragging ? newGroupOrder : groupOrders[_get(item, keys.itemGroupKey)];
        dimension.stack = !item.isOverlay;
        dimension.isDragging = isDragging;

        if (groupHeight) {
          dimension.height = itemHeight;
        } else {
          dimension.height = lineHeight * itemHeightRatio;
        }

        memo.push({
          id: itemId,
          start_time: _get(item, keys.itemTimeStartKey),
          end_time: _get(item, keys.itemTimeEndKey),
          dimensions: dimension
        });
      }

      return memo;
    }, []);

    let stackingMethod = nostack;

    if (stackItems) {
      stackingMethod = groupHeight ? stackFixedGroupHeight : stack;
    }

    const { height, groupHeights, groupTops, groupedItems, showMoreButtons } = stackingMethod(
      dimensionItems,
      groupOrders,
      lineHeight,
      headerHeight,
      false,
      groupHeight,
      itemHeight,
      timeframe,
      timeSteps
    );

    return { dimensionItems, height, groupHeights, groupTops, groupedItems, showMoreButtons };
  }

  handleDoubleClick = (e) => {
    const { canvasTimeStart, width, visibleTimeStart, visibleTimeEnd, groupTops, topOffset } = this.state;
    const zoom = visibleTimeEnd - visibleTimeStart;
    const canvasTimeEnd = canvasTimeStart + zoom * 3;
    const canvasWidth = width * 3;
    const { pageX, pageY } = e;
    const ratio = (canvasTimeEnd - canvasTimeStart) / canvasWidth;
    const boundingRect = this.refs.scrollComponent.getBoundingClientRect();
    let timePosition = visibleTimeStart + ratio * (pageX - boundingRect.left);
    if (this.props.dragSnap) {
      timePosition = Math.round(timePosition / this.props.dragSnap) * this.props.dragSnap;
    }

    let groupIndex = 0;
    for (var key of Object.keys(groupTops)) {
      var item = groupTops[key];
      if (pageY - topOffset > item) {
        groupIndex = parseInt(key, 10);
      } else {
        break;
      }
    }

    if (this.props.onCanvasDoubleClick) {
      this.props.onCanvasDoubleClick(this.props.groups[groupIndex], timePosition, e);
    }
  }

  handleCanvasContextMenu = (e) => {
    const { canvasTimeStart, width, visibleTimeStart, visibleTimeEnd, groupTops, topOffset } = this.state;
    const zoom = visibleTimeEnd - visibleTimeStart;
    const canvasTimeEnd = canvasTimeStart + zoom * 3;
    const canvasWidth = width * 3;
    const { pageX, pageY } = e;
    const ratio = (canvasTimeEnd - canvasTimeStart) / canvasWidth;
    const boundingRect = this.refs.scrollComponent.getBoundingClientRect();
    let timePosition = visibleTimeStart + ratio * (pageX - boundingRect.left);
    if (this.props.dragSnap) {
      timePosition = Math.round(timePosition / this.props.dragSnap) * this.props.dragSnap;
    }

    let groupIndex = 0;
    for (var key of Object.keys(groupTops)) {
      var item = groupTops[key];
      if (pageY - topOffset > item) {
        groupIndex = parseInt(key, 10);
      } else {
        break;
      }
    }

    if (this.props.onCanvasContextMenu) {
      e.preventDefault();
      this.props.onCanvasContextMenu(this.props.groups[groupIndex], timePosition, e);
    }
  }

  childrenWithProps (canvasTimeStart, canvasTimeEnd, canvasWidth, dimensionItems, groupHeights, groupTops, height, headerHeight, visibleTimeStart, visibleTimeEnd, minUnit, timeSteps) {
    if (!this.props.children) {
      return null;
    }

    // convert to an array and remove the nulls
    const childArray = Array.isArray(this.props.children) ? this.props.children.filter(c => c) : [this.props.children];

    const childProps = {
      canvasTimeStart,
      canvasTimeEnd,
      canvasWidth,
      visibleTimeStart,
      visibleTimeEnd,
      dimensionItems,
      items: this.props.items,
      groups: this.props.groups,
      keys: this.props.keys,
      // TODO: combine these two
      groupHeights,
      groupTops,
      selected: this.state.selectedItem && !this.props.selected ? [this.state.selectedItem] : (this.props.selected || []),
      height,
      headerHeight,
      minUnit,
      timeSteps
    };

    return React.Children.map(childArray, child => React.cloneElement(child, childProps));
  }

  renderShowMoreButtons(showMoreButtons, canvasTimeStart, canvasTimeEnd, canvasWidth, headerHeight, groups) {
    const ratio = canvasWidth / (canvasTimeEnd - canvasTimeStart);

    if (showMoreButtons.length) {
      return showMoreButtons.map(button => {

        const time = moment(button.slot);
        button.left = Math.round((time.valueOf() - canvasTimeStart) * ratio, -2) + 6;

        // top position
        let index = groups.findIndex(group => group.id === button.groupId);
        button.top = headerHeight + this.props.groupHeight * (index + 1) - 18;

        return <ShowMoreButton
                key={button.id}
                moreLength={button.items.length}
                button={button}
                onClick={this.handleShowMoreClick}
                />;
      });
    } else {
      return null;
    }
  }

  onClickOut() {
     this.setState({ showMore: null });
  }

  onShowMoreItemClick(item, evt) {
    this.props.onItemClick(item.id, evt);
  }

  showMorePopup = (showMoreButtonProps, dimensions, timeframe) => {

    if (showMoreButtonProps && dimensions && dimensions.left && dimensions.top) {
      const { top, left, diffTop, diffLeft, width } = dimensions;
      let format;

      // set the current timeframe and format
      switch (timeframe) {
          case 'hour':
            format = 'llll';
            break;
          case 'day':
            format = 'dddd, LL';
            break;
          case 'week':
            format = '[Week #]w, YYYY';
            break;
          case 'month':
            format = 'MMMM, YYYY';
            break;
          case 'quarter':
            format = '[Q]Q, YYYY';
            break;
          case 'year':
            format = 'YYYY';
            break;
      }

      return (
          <WatchForClickOut onClickOut={this.onClickOut.bind(this)}>
              <div className="Timeline__showMoreMenu"
                   ref={this.showMoreRef}
                   style={{
                       zIndex: 110,
                       backgroundColor: 'white',
                       position: 'fixed',
                       top: top + diffTop,
                       left: left - diffLeft + width + 4}}>
                  <p className="mbs">{moment(showMoreButtonProps.slot).startOf(timeframe).format(format)}</p>
                  <div>{
              showMoreButtonProps.items.map(item => {
                            return (
                                <a className="Diagram__menu-item"
                                    onClick={this.onShowMoreItemClick.bind(this, item)}
                                    key={item.id}>
                                    {this.props.itemRenderer({ item })}
                                </a>
                            );
                        })
                        }
                  </div>
              </div>
          </WatchForClickOut>
      );
    } else {
      return null;
    }
  }

  handleShowMoreClick = (evt, buttonsProps) => {
    const parent = evt.currentTarget.closest('[data-dashboard-panel]');
    const boundingRect = evt.currentTarget.getBoundingClientRect();

    let left = boundingRect.left;
    let top = boundingRect.top + boundingRect.height;

    if (parent) {
      const parentBoundingRect = parent.getBoundingClientRect();

      left -= parentBoundingRect.left;
      top -= parentBoundingRect.top;
    }

    this.setState({
      showMore: buttonsProps,
      showMorePosition: { top, left, diffLeft: 0, diffTop: 0, width: boundingRect.width }
    });
  }

  render () {
    const { items, groups, headerLabelGroupHeight, headerLabelHeight, sidebarWidth, rightSidebarWidth, timeSteps, showCursorLine, itemStyles } = this.props;
    const { draggingItem, resizingItem, isDragging, width, visibleTimeStart, visibleTimeEnd, canvasTimeStart, mouseOverCanvas, cursorTime, showMore, showMorePosition, timeframe, scrollOffset } = this.state;
    let { dimensionItems, height, groupHeights, groupTops, groupedItems, showMoreButtons } = this.state;

    const zoom = visibleTimeEnd - visibleTimeStart;
    const canvasTimeEnd = canvasTimeStart + zoom * 3;
    const canvasWidth = width * 3;
    const minUnit = getMinUnit(zoom, width, timeSteps);
    const headerHeight = headerLabelGroupHeight + headerLabelHeight;

    const stackResults = this.stackItems(items, groups, canvasTimeStart, visibleTimeStart, visibleTimeEnd, width, showMoreButtons);
    dimensionItems = stackResults.dimensionItems;
    height = stackResults.height;
    groupHeights = stackResults.groupHeights;
    groupTops = stackResults.groupTops;
    groupedItems = stackResults.groupedItems;
    showMoreButtons = stackResults.showMoreButtons;

    showMoreButtons = this.renderShowMoreButtons(showMoreButtons, canvasTimeStart, canvasTimeEnd, canvasWidth, headerHeight, groups, timeframe);

    const outerComponentStyle = {
      height: `${height}px`
    };

    const scrollComponentStyle = {
      width: `${width}px`,
      height: `${height + 20}px`,
      cursor: isDragging ? 'move' : 'default'
    };

    const canvasComponentStyle = {
      width: `${canvasWidth}px`,
      height: `${height}px`
    };

    return (
      <div style={this.props.style} ref="container" className="react-calendar-timeline">
        <div style={outerComponentStyle} className="rct-outer">
          {sidebarWidth > 0 ? this.sidebar(height, groupHeights, headerHeight) : null}
          <div ref="scrollComponent"
               className="rct-scroll"
               style={scrollComponentStyle}
               onScroll={this.onScroll}
               onMouseDown={this.handleMouseDown}
               onMouseMove={this.handleMouseMove}
               onMouseUp={this.handleMouseUp}
          >
            <div ref="canvasComponent"
                 className="rct-canvas"
                 style={canvasComponentStyle}
                 onDoubleClick={ this.handleDoubleClick }
                 onMouseEnter={ this.handleCanvasMouseEnter }
                 onMouseLeave={ this.handleCanvasMouseLeave }
                 onMouseMove={ this.handleCanvasMouseMove }
                 onContextMenu={ this.handleCanvasContextMenu }
            >
              {this.items(canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, dimensionItems, groupHeights, groupTops, items, scrollOffset, itemStyles)}
              {this.verticalLines(canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, timeSteps, height, headerHeight)}
              {this.horizontalLines(canvasWidth, groupHeights, headerHeight)}
              {this.todayLine(canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, height, headerHeight)}
              {mouseOverCanvas && showCursorLine
                ? this.cursorLine(cursorTime, canvasTimeStart, zoom, canvasTimeEnd, canvasWidth, minUnit, height, headerHeight)
                : null}
              {this.infoLabel()}
              {showMoreButtons}
              {this.header(
                canvasTimeStart,
                zoom,
                canvasTimeEnd,
                canvasWidth,
                minUnit,
                timeSteps,
                headerLabelGroupHeight,
                headerLabelHeight
              )}
              {this.childrenWithProps(canvasTimeStart, canvasTimeEnd, canvasWidth, dimensionItems, groupHeights, groupTops, height, headerHeight, visibleTimeStart, visibleTimeEnd, minUnit, timeSteps)}
            </div>
          </div>
          {this.showMorePopup(showMore, showMorePosition, timeframe)}
          {rightSidebarWidth > 0 ? this.rightSidebar(height, groupHeights, headerHeight) : null}
        </div>
      </div>
    );
  }
}

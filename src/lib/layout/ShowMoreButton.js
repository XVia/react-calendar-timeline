import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class showMoreButton extends Component {

  handleClick(evt) {
    this.props.onClick(evt, this.props.button);
  }

  render () {

    const { button } = this.props

    return (
      <div className='rct-show-more-button'
           style={{ position: 'absolute', top: button.top, left: button.left, zIndex: 100, userSelect: 'none' }}>
        <a onClick={this.handleClick.bind(this)}>{button.items.length - 3}+ more </a>
      </div>
    )
  }
}

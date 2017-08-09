import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class showMoreButton extends Component {

  handleClick(evt) {
    this.props.onClick(evt, this.props.button);
  }

  render () {

    const { button } = this.props

    return (
      <div className='rct-show-more-buton'
           style={{ position: 'absolute', top: button.top, left: button.left, zIndex: 100 }}>
        <a onClick={this.handleClick.bind(this)}>Show more +</a>
      </div>
    )
  }
}

import React, { Component } from 'react';

export default class showMoreButton extends Component {

  handleClick = (evt) => {
    this.props.onClick(evt, this.props.button);
  }

  render () {
    let { button, moreLength } = this.props;
    moreLength = moreLength || '';

    return (
      <div className="rct-show-more-button"
           style={{ position: 'absolute', top: button.top, left: button.left - 2, zIndex: 50, userSelect: 'none' }}>
        <a onClick={this.handleClick}>+{moreLength} more </a>
      </div>
    );
  }
}

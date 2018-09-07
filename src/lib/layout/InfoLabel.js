import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

export default class InfoLabel extends PureComponent {
    static propTypes = {
        label: PropTypes.string.isRequired
    };

    static defaultProps = {
        label: ''
    };

    render() {
        return <div className="rct-infolabel">{this.props.label}</div>;
    }
}

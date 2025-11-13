import * as PropTypes from 'prop-types';
import { NextTopLoaderProps } from './index.js';
import 'react';

declare const PagesTopLoader: {
    ({ color: propColor, height: propHeight, showSpinner, crawl, crawlSpeed, initialPosition, easing, speed, shadow, template, zIndex, showAtBottom, }: NextTopLoaderProps): JSX.Element;
    propTypes: {
        color: PropTypes.Requireable<string>;
        height: PropTypes.Requireable<number>;
        showSpinner: PropTypes.Requireable<boolean>;
        crawl: PropTypes.Requireable<boolean>;
        crawlSpeed: PropTypes.Requireable<number>;
        initialPosition: PropTypes.Requireable<number>;
        easing: PropTypes.Requireable<string>;
        speed: PropTypes.Requireable<number>;
        template: PropTypes.Requireable<string>;
        shadow: PropTypes.Requireable<NonNullable<string | boolean | null | undefined>>;
        zIndex: PropTypes.Requireable<number>;
        showAtBottom: PropTypes.Requireable<boolean>;
    };
};

export { PagesTopLoader };

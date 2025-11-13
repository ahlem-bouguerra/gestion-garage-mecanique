import * as PropTypes from 'prop-types';
import * as React from 'react';

type NextTopLoaderProps = {
    /**
     * Color for the TopLoader.
     * @default "#29d"
     */
    color?: string;
    /**
     * The initial position for the TopLoader in percentage, 0.08 is 8%.
     * @default 0.08
     */
    initialPosition?: number;
    /**
     * The increament delay speed in milliseconds.
     * @default 200
     */
    crawlSpeed?: number;
    /**
     * The height for the TopLoader in pixels (px).
     * @default 3
     */
    height?: number;
    /**
     * Auto increamenting behaviour for the TopLoader.
     * @default true
     */
    crawl?: boolean;
    /**
     * To show spinner or not.
     * @default true
     */
    showSpinner?: boolean;
    /**
     * Animation settings using easing (a CSS easing string).
     * @default "ease"
     */
    easing?: string;
    /**
     * Animation speed in ms for the TopLoader.
     * @default 200
     */
    speed?: number;
    /**
     * Defines a shadow for the TopLoader.
     * @default "0 0 10px ${color},0 0 5px ${color}"
     *
     * @ you can disable it by setting it to `false`
     */
    shadow?: string | false;
    /**
     * Defines a template for the TopLoader.
     * @default "<div class="bar" role="bar"><div class="peg"></div></div>
     * <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>"
     */
    template?: string;
    /**
     * Defines zIndex for the TopLoader.
     * @default 1600
     *
     */
    zIndex?: number;
    /**
     * To show the TopLoader at bottom.
     * @default false
     *
     */
    showAtBottom?: boolean;
    /**
     * To show the TopLoader for hash anchors.
     * @default true
     *
     */
    showForHashAnchor?: boolean;
};
/**
 *
 * NextTopLoader
 * @license MIT
 * @param {NextTopLoaderProps} props The properties to configure NextTopLoader
 * @returns {React.JSX.Element}
 *
 */
declare const NextTopLoader: {
    ({ color: propColor, height: propHeight, showSpinner, crawl, crawlSpeed, initialPosition, easing, speed, shadow, template, zIndex, showAtBottom, showForHashAnchor, }: NextTopLoaderProps): React.JSX.Element;
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

export { NextTopLoaderProps, NextTopLoader as default };

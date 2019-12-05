/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 *
 * @see _breakpoints.scss
 *
 * @type {Object}
 */
export const BREAKPOINTS = {
	huge: 1440,
	wide: 1280,
	large: 960,
	medium: 782,
	small: 600,
	mobile: 480,
};

/**
 * Hash of query operators with corresponding condition for media query.
 *
 * @type {Object}
 */
export const OPERATORS = {
	'<': 'max-width',
	'>=': 'min-width',
};

const OPERATOR_EVALUATORS = {
	'<': ( breakpointValue, width ) => ( width < breakpointValue ),
	'>=': ( breakpointValue, width ) => ( width >= breakpointValue ),
};

const ViewportMatchWidthContext = createContext( null );

/**
 * Component that makes all withViewportMatch usages descendents of its children,
 * evaluate as if the viewport had the width specific as a prop.
 */
export const ViewportMatchWidthProvider = ViewportMatchWidthContext.Provider;

function GlobalViewportResult( { queries, children } ) {
	const globalQueriesResult = useSelect( ( select ) => {
		return mapValues( queries, ( query ) => {
			return select( 'core/viewport' ).isViewportMatch( query );
		} );
	}, [ queries ] );
	return children( globalQueriesResult );
}

function ContextViewportResult( { queries, children } ) {
	const width = useContext( ViewportMatchWidthContext );
	const queriesResult = mapValues( queries, ( query ) => {
		const [ operator, breakpointName ] = query.split( ' ' );
		return OPERATOR_EVALUATORS[ operator ](
			BREAKPOINTS[ breakpointName ],
			width
		);
	} );
	return children( queriesResult );
}

/**
 * Higher-order component creator, creating a new component which renders with
 * the given prop names, where the value passed to the underlying component is
 * the result of the query assigned as the object's value.
 *
 * @see isViewportMatch
 *
 * @param {Object} queries  Object of prop name to viewport query.
 *
 * @example
 *
 * ```jsx
 * function MyComponent( { isMobile } ) {
 * 	return (
 * 		<div>Currently: { isMobile ? 'Mobile' : 'Not Mobile' }</div>
 * 	);
 * }
 *
 * MyComponent = withViewportMatch( { isMobile: '< small' } )( MyComponent );
 * ```
 *
 * @return {Function} Higher-order component.
 */
const withViewportMatch = ( queries ) => createHigherOrderComponent(
	( WrappedComponent ) => {
		return ( props ) => {
			const width = useContext( ViewportMatchWidthContext );
			const ComponentToUse = width ? ContextViewportResult : GlobalViewportResult;
			return (
				<ComponentToUse queries={ queries }>
					{ ( queriesResult ) => (
						<WrappedComponent
							{ ...props }
							{ ...queriesResult }
						/>
					) }
				</ComponentToUse>
			);
		};
	},
	'withViewportMatch'
);

export default withViewportMatch;

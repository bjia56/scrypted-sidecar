import * as React from 'react'
import { useLoggedIn } from '../util/loggedIn'

export default RequireLoggedIn = ({ children }) ->
	[refreshLogin, setRefreshLogin] = React.useState true
	isLoggedIn = useLoggedIn refreshLogin

	React.useEffect ->
		if refreshLogin
			setRefreshLogin false
			setTimeout (-> setRefreshLogin true), 10000

	React.useEffect ->
		if isLoggedIn? && not isLoggedIn
			window.location = '/login'

	isLoggedIn? && isLoggedIn && children

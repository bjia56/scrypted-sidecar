import * as React from 'react'
import axios from 'axios'

export useLoggedIn = (refreshState) ->
	[isLoggedIn, setIsLoggedIn] = React.useState null

	React.useEffect ->
		if refreshState
			axios.get "/api/loggedIn"
			.then () =>
				setIsLoggedIn true
			.catch () =>
				setIsLoggedIn false

	isLoggedIn
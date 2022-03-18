import * as React from 'react'
import { useRouter } from 'next/router'
import { useLoggedIn } from '../util/loggedIn'

export default RequireLoggedIn = ({ children }) ->
    router = useRouter()
    [refreshLogin, setRefreshLogin] = React.useState true
    isLoggedIn = useLoggedIn refreshLogin

    React.useEffect ->
        setRefreshLogin false
    , []

    React.useEffect ->
        if isLoggedIn? && not isLoggedIn
            router.push {
                pathname: '/login'
            }

    isLoggedIn? && isLoggedIn && children
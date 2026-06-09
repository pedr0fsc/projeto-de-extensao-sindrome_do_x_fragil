import { useNavigate } from 'react-router-dom'
import { flushSync } from 'react-dom'
import type { NavigateOptions, To } from 'react-router-dom'

export function useTransitionNavigate() {
    const navigate = useNavigate()

    return function (to: To | number, options?: NavigateOptions) {
        if (!document.startViewTransition) {
            typeof to === 'number' ? navigate(to) : navigate(to, options)
            return
        }
        document.startViewTransition(() => {
            flushSync(() => {
                typeof to === 'number' ? navigate(to) : navigate(to, options)
            })
        })
    }
}

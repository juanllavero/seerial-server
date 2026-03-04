import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/routes'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './localization/i18n'
import { updateAppLanguage } from './helpers/language_helpers'
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation'

function App() {
	const { i18n } = useTranslation()

	init({
		debug: true,
	})

	setFocus('continueWatching')

	useEffect(() => {
		updateAppLanguage(i18n)
	}, [i18n])

	return (
		<BrowserRouter>
			<AppRoutes />
		</BrowserRouter>
	)
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)

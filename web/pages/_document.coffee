import Document, { Html, Head, Main, NextScript } from 'next/document'
import createEmotionServer from '@emotion/server/create-instance'
import theme from '../src/theme'
import createEmotionCache from '../src/createEmotionCache'

export default class MyDocument extends Document
	render: () => 
		<Html lang="en">
			<Head>
				{### PWA primary color ###}
				<meta name="theme-color" content={theme.palette.primary.main} />
				<link rel="shortcut icon" href="/static/favicon.ico" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
				/>
				{### Inject MUI styles first to match with the prepend: true configuration. ###}
				{this.props.emotionStyleTags}
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>

# `getInitialProps` belongs to `_document` (instead of `_app`)
# it's compatible with static-site generation (SSG)
MyDocument.getInitialProps = (ctx) =>
	# Resolution order
	#
	# On the server:
	# 1. app.getInitialProps
	# 2. page.getInitialProps
	# 3. document.getInitialProps
	# 4. app.render
	# 5. page.render
	# 6. document.render
	#
	# On the server with error:
	# 1. document.getInitialProps
	# 2. app.render
	# 3. page.render
	# 4. document.render
	#
	# On the client
	# 1. app.getInitialProps
	# 2. page.getInitialProps
	# 3. app.render
	# 4. page.render

	originalRenderPage = ctx.renderPage

	# You can consider sharing the same emotion cache between all the SSR requests to speed up performance
	# However, be aware that it can have global side effects
	cache = createEmotionCache()
	{ extractCriticalToChunks } = createEmotionServer cache

	ctx.renderPage = () =>
		originalRenderPage {
			enhanceApp: (App) => (props) =>
				<App emotionCache={cache} {...props} />
		}

	initialProps = await Document.getInitialProps(ctx)
	# This is important. It prevents emotion to render invalid HTML
	# See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
	emotionStyles = extractCriticalToChunks(initialProps.html)
	emotionStyleTags = emotionStyles.styles.map (style) =>
		<style
			data-emotion={style.key+" "+style.ids.join(' ')}
			key={style.key}
			dangerouslySetInnerHTML={{ __html: style.css }}
		/>

	{
		...initialProps,
		emotionStyleTags,
	}

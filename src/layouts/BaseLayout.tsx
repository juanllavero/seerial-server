import TopBar from './components/TopBar'

const BaseLayout = ({ children }: { children: React.ReactNode }) => {
	const background = 'black'
	return (
		<div
			className={`w-full h-full m-0 bg-${background} flex flex-col items-cente`}
		>
			<TopBar />
			{children}
		</div>
	)
}

export default BaseLayout

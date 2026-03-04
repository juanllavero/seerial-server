import { useState, useEffect } from 'react'
import '@/styles/animations.css'

const LogoIntro = () => {
	const [animationStage, setAnimationStage] = useState('initial')
	const [showMainContent, setShowMainContent] = useState(false)

	useEffect(() => {
		const timer1 = setTimeout(() => {
			setAnimationStage('logo-appear')
		}, 100)

		const timer2 = setTimeout(() => {
			setAnimationStage('logo-move')
		}, 1200)

		const timer3 = setTimeout(() => {
			setAnimationStage('text-appear')
		}, 1400)

		const timer4 = setTimeout(() => {
			setAnimationStage('fade-out')
		}, 4000)

		const timer5 = setTimeout(() => {
			setShowMainContent(true)
		}, 5000)

		return () => {
			clearTimeout(timer1)
			clearTimeout(timer2)
			clearTimeout(timer3)
			clearTimeout(timer4)
			clearTimeout(timer5)
		}
	}, [])

	if (showMainContent) return null

	return (
		<div className='fixed z-999 inset-0 bg-black flex items-center justify-center overflow-hidden'>
			<div
				className={`relative ${animationStage === 'fade-out' ? 'opacity-0' : 'opacity-100'}`}
				style={{
					transition: 'opacity 1s ease-out',
				}}
			>
				<div className='flex items-center justify-center'>
					{/* Logo Container */}
					<div
						className={`origin-center transition-all duration-500 ease-in-out ${
							animationStage === 'initial'
								? 'scale-0'
								: animationStage === 'logo-appear'
									? 'scale-100'
									: 'scale-100'
						}`}
						style={{
							transition:
								animationStage === 'logo-appear'
									? 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
									: 'transform 0.6s ease-out',
						}}
					>
						<img
							src='/Seerial_logo.svg'
							alt='Logo'
							className='w-[20dvh]'
						/>
					</div>

					{/* Text Container */}
					<div
						className={`text-container ${
							animationStage === 'text-appear' ||
							animationStage === 'fade-out'
								? 'opacity-100 translate-x-0'
								: 'opacity-0 translate-x-8'
						}`}
						style={{
							transition:
								'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
						}}
					>
						<span className='text-7xl font-black text-white'>eerial</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default LogoIntro

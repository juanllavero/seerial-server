import { memo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import FlexBox from '@/components/ui/FlexBox'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import NavigationButton from '@/components/navigation/NavigationButton'

function TopBar() {
	const navigate = useNavigate()

	const goBack = async () => {
		invoke('stop')
		invoke('embed_mpv').catch(console.error)
		navigate(-1)
	}
	return (
		<FlexBox
			width={'100%'}
			justify='center'
			padding='3rem 1rem'
			css={{
				background:
					'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 3%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0) 100%)',
			}}
		>
			<FlexBox className='max-w-[170dvh]' width={'100%'} justify='start'>
				<NavigationButton transparent onClick={goBack}>
					<ArrowLeft />
				</NavigationButton>
			</FlexBox>
		</FlexBox>
	)
}

export default memo(TopBar)

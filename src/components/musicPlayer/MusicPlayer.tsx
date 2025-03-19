import useMusicStore from '@/context/music.context'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import React from 'react'
import { useIsMobile } from '../hooks/use-mobile'
import FlexBox from '../ui/FlexBox'
import MusicControls from './controls/MusicControls'
import MusicControlsMobile from './controls/MusicControlsMobile'
import CoverImage from './CoverImage'

function MusicPlayer() {
  const { musicPlayerShown } = useMusicStore()
  const isMobile = useIsMobile()

  const containerVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  }

  if (isMobile) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        className="z-100"
        animate={musicPlayerShown ? 'visible' : 'hidden'}
        style={{ position: 'absolute', bottom: 0, width: '100%' }}
      >
        <FlexBox direction="column">
          <FlexBox direction="row">
            <CoverImage isMobile={isMobile} />
            <Menu />
          </FlexBox>

          <MusicControlsMobile />
        </FlexBox>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      className="z-100"
      animate={musicPlayerShown ? 'visible' : 'hidden'}
      style={{ position: 'absolute', bottom: 0, width: '100%' }}
    >
      <FlexBox direction="column">
        <CoverImage isMobile={isMobile} />
        <MusicControls />
        <Menu />
      </FlexBox>
    </motion.div>
  )
}

export default MusicPlayer

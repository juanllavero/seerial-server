import useMusicStore from '@/context/music.context'
import { motion } from 'framer-motion'
import React from 'react'
import { useIsMobile } from '../hooks/use-mobile'
import FlexBox from '../ui/FlexBox'
import MusicControls from './controls/MusicControls'
import MusicControlsMobile from './controls/MusicControlsMobile'
import CoverImage from './CoverImage'
import Menu from './menu/Menu'

function MusicPlayer() {
  const { musicPlayerShown, musicPlayerContracted } = useMusicStore()
  const isMobile = useIsMobile()

  // Variantes para el contenedor principal con altura dinámica
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
      height: musicPlayerContracted ? 'auto' : 'auto', // Ajustaremos esto dinámicamente
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        height: { duration: 0.3 }, // Animación específica para la altura
      },
    },
  }

  // Variantes para los componentes internos (CoverImage y Menu)
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0,
      height: 0, // Colapsamos la altura cuando se oculta
      margin: 0, // Evitamos márgenes residuales
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    visible: {
      y: 0,
      opacity: 1,
      height: 'auto', // Restauramos la altura natural
      margin: 'initial', // Restauramos márgenes por defecto
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  }

  if (!isMobile) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        className="z-100 flex w-full flex-col justify-end"
        animate={musicPlayerShown ? 'visible' : 'hidden'}
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '100dvh',
          overflow: 'hidden',
          backgroundColor: 'var(--background)',
        }}
      >
        {/* Animamos el FlexBox que contiene CoverImage y Menu */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={musicPlayerContracted ? 'hidden' : 'visible'}
        >
          <FlexBox
            direction="row"
            justify="center"
            align="center"
            width={'100%'}
            height={'100dvh'}
          >
            <CoverImage isMobile={isMobile} />
            <Menu />
          </FlexBox>
        </motion.div>

        <MusicControls />
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      className="z-100 bg-black"
      animate={musicPlayerShown ? 'visible' : 'hidden'}
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <FlexBox direction="column">
        {/* Animamos CoverImage y Menu individualmente */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={musicPlayerContracted ? 'hidden' : 'visible'}
        >
          <CoverImage isMobile={isMobile} />
        </motion.div>

        <MusicControlsMobile />

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={musicPlayerContracted ? 'hidden' : 'visible'}
        >
          <Menu />
        </motion.div>
      </FlexBox>
    </motion.div>
  )
}

export default MusicPlayer

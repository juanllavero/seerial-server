// import useMusicStore from '@/context/music.context'
// import { useIsMobile } from '../hooks/use-mobile'
// import FlexBox from '../ui/FlexBox'
// import MusicControls from './controls/MusicControls'
// import MusicControlsMobile from './controls/MusicControlsMobile'
// import CoverImage from './CoverImage'
// import { motion } from 'framer-motion' // Usamos framer-motion
// import Menu from './menu/Menu'

// function MusicPlayer() {
//   const { musicPlayerShown, musicPlayerContracted } = useMusicStore()
//   const isMobile = useIsMobile()

//   // Variantes para el contenedor principal
//   const containerVariants = {
//     hidden: {
//       y: '100%',
//       opacity: 0,
//       transition: {
//         duration: 0.5,
//         ease: [0.43, 0.13, 0.23, 0.96], // Curva de easing moderna
//       },
//     },
//     visible: {
//       y: 0,
//       opacity: 1,
//       height: 'auto', // Simplificamos, ya que 'auto' funciona en ambos estados
//       transition: {
//         duration: 0.5,
//         ease: [0.43, 0.13, 0.23, 0.96],
//         height: { duration: 0.3 },
//       },
//     },
//   }

//   // Variantes para los componentes internos
//   const itemVariants = {
//     hidden: {
//       y: 20,
//       opacity: 0,
//       height: 0,
//       margin: 0,
//       transition: {
//         duration: 0.3,
//         ease: [0.43, 0.13, 0.23, 0.96],
//       },
//     },
//     visible: {
//       y: 0,
//       opacity: 1,
//       height: 'auto',
//       margin: 'initial',
//       transition: {
//         duration: 0.3,
//         ease: [0.43, 0.13, 0.23, 0.96],
//       },
//     },
//   }

//   if (!isMobile) {
//     return (
//       <motion.div
//         variants={containerVariants}
//         initial="hidden"
//         animate={musicPlayerShown ? 'visible' : 'hidden'}
//         className="z-[100] flex w-full flex-col justify-end"
//         style={{
//           position: 'absolute',
//           bottom: 0,
//           width: '100%',
//           height: '100dvh',
//           overflow: 'hidden',
//           backgroundColor: 'var(--background)',
//         }}
//       >
//         <motion.div
//           variants={itemVariants}
//           animate={musicPlayerContracted ? 'hidden' : 'visible'}
//         >
//           <FlexBox
//             direction="row"
//             justify="center"
//             align="center"
//             width="100%"
//             height="100dvh"
//           >
//             <CoverImage isMobile={isMobile} />
//             <Menu />
//           </FlexBox>
//         </motion.div>

//         <MusicControls />
//       </motion.div>
//     )
//   }

//   return (
//     <motion.div
//       variants={containerVariants}
//       initial="hidden"
//       animate={musicPlayerShown ? 'visible' : 'hidden'}
//       className="z-[100] bg-black"
//       style={{
//         position: 'absolute',
//         bottom: 0,
//         width: '100%',
//         overflow: 'hidden',
//       }}
//     >
//       <FlexBox direction="column">
//         <motion.div
//           variants={itemVariants}
//           animate={musicPlayerContracted ? 'hidden' : 'visible'}
//         >
//           <CoverImage isMobile={isMobile} />
//         </motion.div>

//         <MusicControlsMobile />

//         <motion.div
//           variants={itemVariants}
//           animate={musicPlayerContracted ? 'hidden' : 'visible'}
//         >
//           <Menu />
//         </motion.div>
//       </FlexBox>
//     </motion.div>
//   )
// }

// export default MusicPlayer

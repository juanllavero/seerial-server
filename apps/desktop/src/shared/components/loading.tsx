import { motion, type Variants } from 'motion/react';

function Loading() {
  const dotVariants: Variants = {
    pulse: {
      scale: [1, 1.5, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      animate="pulse"
      transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
      className="container"
    >
      <motion.div className="dot" variants={dotVariants} />
      <motion.div className="dot" variants={dotVariants} />
      <motion.div className="dot" variants={dotVariants} />
      <StyleSheet />
    </motion.div>
  );
}

/**
 * ==============   Styles   ================
 */
function StyleSheet() {
  return (
    <style>
      {`
            .container {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
                gap: 20px;
            }

            .dot {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: var(--app-color);
                will-change: transform;
            }
            `}
    </style>
  );
}

export default Loading;

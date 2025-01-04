import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  index: number
}

const AnimatedContainer = ({ children, index }: Props) => {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.7,
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      layout
      style={{ originX: 0 }}
      transition={{
        layout: {
          bounce: 0.4,
          duration: index * 0.15 + 0.85,
          type: 'spring',
        },
        opacity: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedContainer

import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  index: number
}

const AnimatedContainer = ({ index, children }: Props) => {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      initial={{ opacity: 0, scale: 0.7 }}
      exit={{
        opacity: 0,
        scale: 0.7,
      }}
      transition={{
        opacity: { duration: 0.2 },
        layout: {
          type: 'spring',
          bounce: 0.4,
          duration: index * 0.15 + 0.85,
        },
      }}
      style={{ originX: 0 }}
      layout
    >
      {children}
    </motion.div>
  )
}

export default AnimatedContainer

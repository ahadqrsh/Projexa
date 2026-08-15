import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

export const StaggerList = ({ children, className }) => (
  <motion.div variants={container} initial="hidden" animate="show" className={className}>
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }) => (
  <motion.div variants={item} className={className}>
    {children}
  </motion.div>
);

export default StaggerList;

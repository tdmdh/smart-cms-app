
import {
  motion
} from 'framer-motion';

export function HomeBackground() {
  return (
    <div className="background">
      <motion.div
        className="background__triangle"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0 }}
      >
        <motion.div
          className="background__triangle--mini"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        />
        <motion.div
          className="background__triangle--minimini"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />    
        <motion.div
          className="background__triangle--miniminimini"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        />
        <motion.div
          className="background__triangle--miniminiminimini"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        />
      </motion.div>
      <div className="background__blurlayer" />
    </div>
  );
}
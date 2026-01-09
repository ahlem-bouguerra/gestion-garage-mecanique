import { Variants } from 'framer-motion';

export const menu: Variants = {
  open: {
    width: '250px',
    height: '300px',
    top: '-25px',
    right: '-25px',
    transition: { duration: 0.75, type: 'tween' as const, ease: [0.76, 0, 0.24, 1] as const },
  },

  closed: {
    width: '55px',
    height: '40px',
    top: '0px',
    right: '-4px',
    transition: {
      duration: 0.75,
      delay: 0.35,
      type: 'tween' as const,
      ease: [0.76, 0, 0.24, 1] as const,
    },
  },
};
export const links = [
  {
    url: '/',
    linkTo: 'Solutions',
  },
  {
    url: '/',
    linkTo: 'Learn',
  },
  {
    url: '/',
    linkTo: 'About',
  },
];

'use client';

import { ReactLenis } from 'lenis/react';
import StyledComponentsRegistry from '../../libs/register';
import { GlobalStyles } from './GlobalStyles';
import { Footer, Header } from '../UI';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledComponentsRegistry>
      <ReactLenis
        root
        options={{
          lerp: 0.1,
          duration: 1.2,
          smoothWheel: true,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        }}
      >
        <GlobalStyles />
        <div>
          <Header />
          {children}
          <Footer />
        </div>
      </ReactLenis>
    </StyledComponentsRegistry>
  );
};

export default Layout;
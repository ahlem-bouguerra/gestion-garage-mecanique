import Link from 'next/link';
import { FaLocationArrow } from 'react-icons/fa'; // Ajouté
import { LinkTo } from './styles';

const GetStartedButton = ({ padding }: { padding: string }) => {
  return (
    <LinkTo
      style={{
        padding: padding,
      }}
      href="/recherche-global"
    >
       <FaLocationArrow style={{ marginRight: '8px' }} />
      Localiser-moi
    </LinkTo>
  );
};

export default GetStartedButton;

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  baseSepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Zora Hackathon',
  projectId: '4e641768f3967217044a02bffbda5387',
  chains: [baseSepolia],
  ssr: true,
}); 
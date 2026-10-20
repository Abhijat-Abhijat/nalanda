import { example } from '../helpers';

export const py = (title: string, src: string, output?: string, md?: string) => example('python', title, src, output, md);
export const sh = (title: string, src: string, output?: string, md?: string) => example('bash', title, src, output, md);
export const toml = (title: string, src: string) => example('toml', title, src);

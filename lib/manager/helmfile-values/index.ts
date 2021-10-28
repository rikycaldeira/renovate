export { extractPackageFile } from './extract';

export const defaultConfig = {
  aliases: {
    stable: 'https://charts.helm.sh/stable',
  },
  commitMessageTopic: 'helmfile values {{depName}}',
  fileMatch: ['(^|/)helmfile.yaml$'],
};

export type HelmfileDockerImageDependency = {
  registry?: string;
  repository: string;
  tag: string;
};

export interface HelmfileSection {
  values?: unknown[];
}

export interface Doc {
  releases?: HelmfileSection[];
  environments?: unknown;
  helmfiles?: HelmfileSection[];
}

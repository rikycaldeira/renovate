import is from '@sindresorhus/is';
import { loadAll } from 'js-yaml';
import { id as dockerDatasource } from '../../datasource/docker';
import { logger } from '../../logger';
import { id as dockerVersioning } from '../../versioning/docker';
import { getDep } from '../dockerfile/extract';
import type { PackageDependency, PackageFile } from '../types';
import type {
  Doc,
  HelmfileDockerImageDependency,
  HelmfileSection,
} from './types';
import {
  matchesHelmfileValuesDockerHeuristic,
  matchesHelmfileValuesDockerHeuristicMulti,
} from './util';

/**
 * Sanitizes a parsed image dependency.
 *
 * @returns the same parsed image dependency, but sanitized
 */
function sanitizeDependency(
  imageDependency: HelmfileDockerImageDependency
): HelmfileDockerImageDependency {
  let registry: string = imageDependency.registry;
  registry = registry ? `${registry}/` : '';

  const repository = String(imageDependency.repository);
  const tag = String(imageDependency.tag);

  return { registry, repository, tag };
}

/**
 * Converts a full (not in-line) parsed image dependency to a PackageDependency instance.
 *
 * @param imageDependency the parsed image dependency
 * @returns a PackageDependency that represents the parsed image
 */
function getHelmDep(
  imageDependency: HelmfileDockerImageDependency
): PackageDependency {
  const dep = getDep(
    `${imageDependency.registry}${imageDependency.repository}:${imageDependency.tag}`,
    false
  );
  dep.replaceString = imageDependency.tag;
  dep.versioning = dockerVersioning;
  dep.autoReplaceStringTemplate =
    '{{newValue}}{{#if newDigest}}@{{newDigest}}{{/if}}';
  return dep;
}

/**
 * Processes a parsed image dependency by converting it into a PackageDependency
 *
 * @param imageDependency the parsed image dependency
 * @returns a PackageDependency that represents the parsed image
 */
function processDependency(
  imageDependency: HelmfileDockerImageDependency | string
): PackageDependency {
  if (typeof imageDependency === 'string') {
    return getDep(imageDependency);
  }

  if (typeof imageDependency === 'object') {
    return getHelmDep(sanitizeDependency(imageDependency));
  }

  return null;
}

function extractDependencies(
  helmfileSection: HelmfileSection
): Array<PackageDependency> {
  const deps = [];

  if (!(helmfileSection.values && is.array(helmfileSection.values))) {
    return deps;
  }

  Object.values(helmfileSection.values).forEach((valuesEntry) => {
    Object.keys(valuesEntry).forEach((key) => {
      const entry = valuesEntry[key];
      if (matchesHelmfileValuesDockerHeuristic(key, entry)) {
        const image = entry;
        deps.push(...[processDependency(image)]);
      } else if (matchesHelmfileValuesDockerHeuristicMulti(key, entry)) {
        Object.keys(entry).forEach((imageName) => {
          const image = entry[imageName];
          deps.push(...[processDependency(image)]);
        });
      }
    });
  });

  return deps;
}

export function extractPackageFile(
  content: string,
  fileName: string
): PackageFile {
  const deps = [];
  let docs: Doc[];
  try {
    docs = loadAll(content, null, { json: true });
  } catch (err) {
    logger.debug({ err, fileName }, 'Failed to parse helmfile helmfile.yaml');
    return null;
  }

  for (const doc of docs) {
    if (doc.releases && is.array(doc.releases)) {
      doc.releases.forEach((release) =>
        deps.push(...extractDependencies(release))
      );
    }

    if (doc.helmfiles && is.array(doc.helmfiles)) {
      doc.helmfiles.forEach((nestedState) =>
        deps.push(...extractDependencies(nestedState))
      );
    }
  }

  if (!deps.length) {
    logger.debug(
      { fileName },
      'helmfile.yaml has no image dependencies in in-line values'
    );
    return null;
  }

  return { deps, datasource: dockerDatasource } as PackageFile;
}

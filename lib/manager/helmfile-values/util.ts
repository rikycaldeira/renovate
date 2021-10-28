import { hasKey } from '../../util/object';
import { regEx } from '../../util/regex';
import { HelmfileDockerImageDependency } from './types';

const parentKeyRe = regEx(/image$/i);
const parentKeyReMulti = regEx(/images$/i);

/**
 * Type guard to determine whether a given Helmfile values section potentially
 * defines a Helm Docker dependency in its in-line values
 *
 * There is no exact standard of how Docker dependencies are defined in Helm
 * values, this function defines a
 * heuristic based on the most commonly used format in the Helm charts:
 *
 * image:
 *   repository: 'something'
 *   tag: v1.0.0
 */
export function matchesHelmfileValuesDockerHeuristic(
  parentKey: string,
  data: unknown
): data is HelmfileDockerImageDependency | string {
  return (
    parentKeyRe.test(parentKey) &&
    data &&
    ((typeof data === 'object' &&
      hasKey('repository', data) &&
      hasKey('tag', data)) ||
      typeof data === 'string')
  );
}

/**
 * Type guard to determine whether a given Helmfile values section potentially
 * defines multiple Helm Docker dependencies in its in-line values
 *
 * There is no exact standard of how Docker dependencies are defined in Helm
 * values, this function defines a
 * heuristic to catch the following multi-image format:
 *
 * images:
 *   <image-1>:
 *     repository: 'foo'
 *     tag: v1.0.0
 *   <image-2>:
 *     repository: 'bar'
 *     tag: v2.0.0
 *   <image-3>: 'registry.com/foo:v1.0.0'
 */
export function matchesHelmfileValuesDockerHeuristicMulti(
  parentKey: string,
  data: unknown
): data is HelmfileDockerImageDependency | string {
  return (
    parentKeyReMulti.test(parentKey) &&
    data &&
    typeof data === 'object' &&
    Object.keys(data).every((imageName) => {
      const image = data[imageName];
      return (
        image &&
        ((typeof image === 'object' &&
          hasKey('repository', image) &&
          hasKey('tag', image)) ||
          typeof image === 'string')
      );
    })
  );
}

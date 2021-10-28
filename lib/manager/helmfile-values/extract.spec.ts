import { loadFixture } from '../../../test/util';
import { extractPackageFile } from '.';

const multidocYaml = loadFixture('multidoc.yaml');
const fileName = 'helmfile.yaml';

describe('manager/helmfile-values/extract', () => {
  describe('extractPackageFile()', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('returns null if no sections with values', () => {
      const content = `
      releases:
        - name: testRelease
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toBeNull();
    });

    it('do not crash on invalid helmfile.yaml', () => {
      const content = `
      releases: [
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toBeNull();
    });

    it('parse release image', () => {
      const content = `
      releases:
        - name: testRelease
          values:
            - image:
                registry: container.registry.com
                repository: some/repository
                tag: 0.0.1
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toMatchSnapshot({
        datasource: 'docker',
        deps: [
          {
            depName: 'container.registry.com/some/repository',
            currentValue: '0.0.1',
          },
        ],
      });
    });

    it('parse release multi images', () => {
      const content = `
      releases:
        - name: testRelease
          values:
            - images:
                foo:
                  registry: container.registry.com
                  repository: some/repository
                  tag: 0.0.1
                bar:
                  repository: another/repository
                  tag: 0.1.0
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toMatchSnapshot({
        datasource: 'docker',
        deps: [
          {
            depName: 'container.registry.com/some/repository',
            currentValue: '0.0.1',
          },
          { depName: 'another/repository', currentValue: '0.1.0' },
        ],
      });
    });

    it('parse inline image', () => {
      const content = `
      releases:
        - name: testRelease
          values:
            - image: container.registry.com/some/repository:0.0.1
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toMatchSnapshot({
        datasource: 'docker',
        deps: [
          {
            depName: 'container.registry.com/some/repository',
            currentValue: '0.0.1',
          },
        ],
      });
    });

    it('parse inline multi images', () => {
      const content = `
      releases:
        - name: testRelease
          values:
            - images:
                foo: container.registry.com/some/repository:0.0.1
                bar: another/repository:0.1.0
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toMatchSnapshot({
        datasource: 'docker',
        deps: [
          {
            depName: 'container.registry.com/some/repository',
            currentValue: '0.0.1',
          },
          { depName: 'another/repository', currentValue: '0.1.0' },
        ],
      });
    });

    it('parse nested state multi images', () => {
      const content = `
      helmfiles:
        - path: another/helmfile.yaml
          values:
            - images:
                foo:
                  registry: container.registry.com
                  repository: some/repository
                  tag: 0.0.1
                bar:
                  repository: another/repository
                  tag: 0.1.0
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toMatchSnapshot({
        datasource: 'docker',
        deps: [
          {
            depName: 'container.registry.com/some/repository',
            currentValue: '0.0.1',
          },
          { depName: 'another/repository', currentValue: '0.1.0' },
        ],
      });
    });

    it('parse helmfile with all sections', () => {
      const content = `
      environments:
        default:
          values:
            foo:
              registry: container.registry.com
              repository: some/repository
              tag: 0.0.1

      helmfiles:
        - path: another/helmfile.yaml
          values:
            - images:
                bar:
                  repository: another/repository
                  tag: 0.1.0
      releases:
        - name: testRelease
          values:
            - images:
                bar:
                  registry: container.registry.com
                  repository: yetanother/repository
                  tag: 1.0.0
      `;
      const result = extractPackageFile(content, fileName);
      expect(result).toMatchSnapshot({
        datasource: 'docker',
        deps: [
          {
            depName: 'container.registry.com/yetanother/repository',
            currentValue: '1.0.0',
          },
          { depName: 'another/repository', currentValue: '0.1.0' },
          // { depName: 'container.registry.com/some/repository', currentValue: '0.0.1' },
        ],
      });
    });

    it('parses multidoc yaml', () => {
      const result = extractPackageFile(multidocYaml, fileName);
      expect(result).toMatchSnapshot({
        datasource: 'docker',
        deps: [
          // { depName: 'container.registry.com/some/repository', currentValue: '0.0.1' },
          { depName: 'another/repository', currentValue: '0.1.0' },
          {
            depName: 'container.registry.com/yetanother/repository',
            currentValue: '1.0.0',
          },
        ],
      });
    });
  });
});

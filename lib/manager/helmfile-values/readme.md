Renovate supports updating of Docker dependencies within in-line values of Helmfile `helmfile.yaml` state files or other YAML files that use the same format (via `fileMatch` configuration).
Updates are performed if the in-line values follow the conventional format used in most Helm charts that allow configuring the used container images:

```yaml
releases:
  - name: foo
    ...
    values:
      ...
      - image:
          repository: 'some-docker/dependency'
          tag: v1.0.0
          registry: registry.example.com
```

The following locations where in-line values can be provided will be checked:

- Releases
- Environments
- Nested state files
- Templates

If you need to change the versioning format, read the [versioning](https://docs.renovatebot.com/modules/versioning/) documentation to learn more.

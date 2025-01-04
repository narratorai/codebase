# Contributing

## First Steps
You should first make sure that you have run the following steps prior to pushing changes.

1. [Install](https://pre-commit.com/#installation) the `pre-commit` package manager. We are using `pre-commit` to run pre-commit hooks for formatting before commiting changes to the repository.  
2. `git clone git@github.com:narratorai/platform-iac.git && cd platform-iac/`  
3. `pre-commit install` [.pre-commit-config.yaml](.pre-commit-config.yaml) to your local `.git/hooks`.
4. [Configure](https://help.github.com/en/github/authenticating-to-github/managing-commit-signature-verification) your Github Settings so that you sign your commits before pushing them to this repo.


When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

**Note:**
There is the chance that you will want to skip a certain hook from the pre-commit or the post-commit ones.
You can easily do this by supplying `SKIP=<hook_id> git <command>` for example
`SKIP=terragrunt-hclfmt git rebase origin/master`.

## Terragrunt File Layout
To keep a consistent file layout, we are using the following ordering for the terragrunt blocks inside a `terragrunt.hcl` file:
```
terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-vpc.git?ref=v3.19.0"
}

include "root" {
  path = find_in_parent_folders()
}

dependency "dependency-1" {
  config_path = "dependency-1 path"
}

dependency "dependency-2" {
  config_path = "dependency-2 path"
}

# more dependencies (if you need to)

locals {
  # local variables here
}

inputs = {
 # inputs here
}

```

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface. 
3. Pull request title convention: [PLATFORM-xxxx] <type>: <actual PR title>
4. Every commit must be signed

## Checklists for contributions

- [ ] Add [semantics prefix](#semantic-pull-requests) to your PR or Commits (at least one of your commit groups)
- [ ] CI tests are passing

## Semantic Pull Requests

To generate changelog, Pull Requests or Commits must have semantic and must follow conventional specs below:

- `feat:` for new features
- `fix:` for bug fixes
- `improvement:` for enhancements
- `docs:` for documentation and examples
- `refactor:` for code refactoring
- `test:` for tests
- `ci:` for CI purpose
- `chore:` for chores stuff

The `chore` prefix skipped during changelog generation. It can be used for `chore: update changelog` commit message by example.

**Capitalise the first letter of the commit message**

Example:
`feat: Enable autoscaling in the database cluster`

## terragrunt hclfmt github action

A github action runs for pull requests that checks all files are formatted correctly (as per the pre commit hook). If this fails you need to format the files correctly

* download and install [terraform](https://www.terraform.io/downloads.html)
* download and install [terragrunt](https://github.com/gruntwork-io/terragrunt/releases/)
* run `terragrunt hclfmt` in the root directory and commit the result

<h1 align="center">
  <a href="https://github.com/orangebeard-io/jasmine-listener">
    <img src="https://raw.githubusercontent.com/orangebeard-io/jasmine-listener/main/.github/logo.svg" alt="Orangebeard.io Jasmine Listener" height="200">
  </a>
  <br>Orangebeard.io Jasmine Listener<br>
</h1>

<h4 align="center">Orangebeard listener for <a href="https://jasmine.github.io/" target="_blank" rel="noopener">Jasmine</a></h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@orangebeard-io/jasmine-orangebeard-reporter">
    <img src="https://img.shields.io/npm/v/@orangebeard-io/jasmine-orangebeard-reporter.svg?style=flat-square"
      alt="NPM Version" />
  </a>
  <a href="https://github.com/orangebeard-io/jasmine-listener/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/orangebeard-io/jasmine-listener/release.yml?branch=main&style=flat-square"
      alt="Build Status" />
  </a>
  <a href="https://github.com/orangebeard-io/jasmine-listener/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/orangebeard-io/jasmine-listener?style=flat-square"
      alt="License" />
  </a>
</p>

<div align="center">
  <h4>
    <a href="https://orangebeard.io">Orangebeard</a> |
    <a href="#installation">Installation</a> |
    <a href="#configuration">Configuration</a>
  </h4>
</div>

## Installation

### Install the npm package

```shell
npm install @orangebeard-io/jasmine-orangebeard-reporter
```

## Configuration

Create orangebeard.json (in your test project's folder (or above))

```JSON
{
  "endpoint": "https://XXX.orangebeard.app",
  "accessToken": "00000000-0000-0000-0000-00000000",
  "project": "my_project_name",
  "testset": "My Test Set Name",
  "description": "A run from jasmine",
  "attributes": [
    {
      "key": "SomeKey",
      "value": "SomeValue"
    },
    {
      "value": "Tag value"
    }
  ]
}
```

Or configure in the javascript object.

Configure the reporter in your tests:
```js
const {OrangebeardReporter} = require("@orangebeard-io/jasmine-orangebeard-reporter/dist/reporter/OrangebeardReporter");

const orangebeardReporter = new OrangebeardReporter({
  endpoint: "https://my-company.orangebeard.app",
  token: "listener-token",
  project: "my-project",
  testset: "jasmine example",
  description: "A run from jasmine",
  attributes: [
    {
      key: "Config",
      value: "Inline"
    },
    {
      value: "someTag"
    }
  ]
});

//or for use with orangebeard.json and/or env variables:
//const orangebeardReporter = new OrangebeardReporter();

jasmine.getEnv().addReporter(orangebeardReporter)
```

### Running

Run your tests as usual!

Alternatively, configure Orangebeard variables as ENV (without or on top of orangebeard.json):

```shell
 ORANGEBEARD_ENDPOINT=https://company.orangebeard.app
 ORANGEBEARD_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 ORANGEBEARD_PROJECT="my project"
 ORANGEBEARD_TESTSET="my test set"
 ORANGEBEARD_DESCRIPTION="My awesome testrun"
 ORANGEBEARD_ATTRIBUTES="key:value; value;"
 ```

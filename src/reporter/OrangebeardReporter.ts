import { OrangebeardParameters } from '@orangebeard-io/javascript-client/dist/client/models/OrangebeardParameters';
import OrangebeardAsyncV3Client from '@orangebeard-io/javascript-client/dist/client/OrangebeardAsyncV3Client';
import { UUID } from 'crypto';
import { getSpecCode, getTime, testStatusMap } from './utils';
import fs from 'node:fs';
import { StartTest } from '@orangebeard-io/javascript-client/dist/client/models/StartTest';
import { Log } from '@orangebeard-io/javascript-client/dist/client/models/Log';
import * as path from 'node:path';
import { FinishTest } from '@orangebeard-io/javascript-client/dist/client/models/FinishTest';
import CustomReporter = jasmine.CustomReporter;
import SuiteResult = jasmine.SuiteResult;
import JasmineDoneInfo = jasmine.JasmineDoneInfo;
import JasmineStartedInfo = jasmine.JasmineStartedInfo;
import SpecResult = jasmine.SpecResult;
import TestType = StartTest.TestType;
import LogLevel = Log.LogLevel;
import LogFormat = Log.LogFormat;
import Status = FinishTest.Status;

export class OrangebeardReporter implements CustomReporter {
  config: OrangebeardParameters;
  client: OrangebeardAsyncV3Client;

  testRunId: UUID;
  suites: Map<string, UUID> = new Map<string, UUID>(); //id , uuid
  tests: Map<string, UUID> = new Map<string, UUID>(); //id, uuid

  specFiles: Map<string, string> = new Map<string, string>();

  constructor(config?: OrangebeardParameters | null) {
    this.client = new OrangebeardAsyncV3Client(config);
    this.config = this.client.config;
  }

  jasmineDone(runDetails: JasmineDoneInfo, done?: () => void): void | Promise<void> {
    if (runDetails.failedExpectations.length > 0) {
      const rootSuiteUUID = this.client.startSuite({
        testRunUUID: this.testRunId,
        suiteNames: ['Top Suite'],
      })[0];
      runDetails.failedExpectations.forEach(expectation => {
        const itemUUID = this.client.startTest({
          testRunUUID: this.testRunId,
          suiteUUID: rootSuiteUUID,
          testName: expectation.message,
          testType: expectation.message.toLowerCase().includes('before') ? TestType.BEFORE : TestType.AFTER,
          startTime: getTime(),
        });
        this.client.log({
          testRunUUID: this.testRunId,
          testUUID: itemUUID,
          logTime: getTime(),
          message: `${expectation.message}\n\n${expectation.stack}`,
          logLevel: LogLevel.ERROR,
          logFormat: LogFormat.PLAIN_TEXT,
        });
        this.client.finishTest(itemUUID, {
          testRunUUID: this.testRunId,
          status: Status.FAILED,
          endTime: getTime(),
        });
      });
    }
    this.client.finishTestRun(this.testRunId, { endTime: getTime() }).then(() => {
      if (done) done();
    });
  }

  jasmineStarted(_suiteInfo: JasmineStartedInfo, done?: () => void): void | Promise<void> {
    this.testRunId = this.client.startTestRun({
      testSetName: this.config.testset,
      description: this.config.description,
      startTime: getTime(),
      attributes: this.config.attributes,
    });
    if (done) done();
  }

  specDone(result: J5SpecResult, done?: () => void): void | Promise<void> {
    //log errors
    if (result.failedExpectations.length > 0) {
      result.failedExpectations.forEach(expectation => {
        this.client.log({
          testRunUUID: this.testRunId,
          testUUID: this.tests.get(result.id),
          logTime: getTime(),
          message: `${expectation.message}\n\n${expectation.stack}`,
          logLevel: LogLevel.ERROR,
          logFormat: LogFormat.PLAIN_TEXT,
        });
      });
    }
    // determine status & finish test
    this.client.finishTest(this.tests.get(result.id), {
      testRunUUID: this.testRunId,
      status: testStatusMap[result.status],
      endTime: getTime(),
    });
    if (done) done();
  }

  specStarted(result: J5SpecResult, done?: () => void): void | Promise<void> {
    const suiteUUID = this.getOrStartSuite(result, true);
    const testUUID = this.client.startTest({
      testRunUUID: this.testRunId,
      suiteUUID: suiteUUID,
      testName: result.description,
      testType: TestType.TEST,
      startTime: getTime(),
    });
    this.tests.set(result.id, testUUID);
    const snippet = getSpecCode(this.specFiles.get(result.filename), result.fullName);
    if(snippet) {
      this.client.log({
        testRunUUID: this.testRunId,
        testUUID: testUUID,
        logTime: getTime(),
        message: snippet,
        logLevel: LogLevel.INFO,
        logFormat: LogFormat.MARKDOWN,
      });
    }
    if (done) done();
  }

  suiteDone(result: J5SuiteResult, done?: () => void): void | Promise<void> {
    if (result.failedExpectations.length > 0) {
      result.failedExpectations.forEach(expectation => {
        const itemUUID = this.client.startTest({
          testRunUUID: this.testRunId,
          suiteUUID: this.suites.get(result.id),
          testName: expectation.message,
          testType: expectation.message.toLowerCase().includes('before') ? TestType.BEFORE : TestType.AFTER,
          startTime: getTime(),
        });
        this.client.log({
          testRunUUID: this.testRunId,
          testUUID: itemUUID,
          logTime: getTime(),
          message: `${expectation.message}\n\n${expectation.stack}`,
          logLevel: LogLevel.ERROR,
          logFormat: LogFormat.PLAIN_TEXT,
        });
        this.client.finishTest(itemUUID, {
          testRunUUID: this.testRunId,
          status: Status.FAILED,
          endTime: getTime(),
        });
      });
    }

    if (done) done();
  }

  suiteStarted(result: J5SuiteResult, done?: () => void): void | Promise<void> {
    this.getOrStartSuite(result, false);
    if (done) done();
  }

  getOrStartSuite(result: J5SpecResult | J5SuiteResult, fromSpec: boolean): UUID {
    const fileName = path.basename(result.filename);
    if (!this.specFiles.has(result.filename)) {
      this.specFiles.set(result.filename, fs.readFileSync(result.filename, 'utf-8'));

      const fileParentSuiteUUID = this.client.startSuite({
        testRunUUID: this.testRunId,
        suiteNames: [fileName]
      })[0];
      this.suites.set(fileName, fileParentSuiteUUID);
    }
    const currentSuiteId = (fromSpec ? result.parentSuiteId : result.id) || fileName;
    return this.suites.get(currentSuiteId) || this.startSuite(result, currentSuiteId, result.parentSuiteId || fileName);
  }

  startSuite(result: J5SpecResult | SuiteResult, currentSuiteId: string, parentSuiteId?: string | null): UUID {
    const parentSuiteUUID = parentSuiteId ? this.suites.get(parentSuiteId) : undefined;
    const uuid = this.client.startSuite({
      testRunUUID: this.testRunId,
      parentSuiteUUID: parentSuiteUUID,
      suiteNames: currentSuiteId === path.basename(result.filename) ? [currentSuiteId] : [result.description],
    })[0];

    this.suites.set(currentSuiteId, uuid);
    return uuid;
  }
}

interface J5SpecResult extends SpecResult {
  parentSuiteId: string;
}

interface J5SuiteResult extends SuiteResult {
  parentSuiteId: string;
}

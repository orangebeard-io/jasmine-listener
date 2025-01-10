import { ZonedDateTime } from '@js-joda/core';
import { FinishTest } from '@orangebeard-io/javascript-client/dist/client/models/FinishTest';
import Status = FinishTest.Status;


export function getTime() {
  return ZonedDateTime.now().withFixedOffsetZone().toString();
}

export const testStatusMap: { [key: string]: Status } = {
  'passed': Status.PASSED,
  'failed': Status.FAILED,
  'timedOut': Status.TIMED_OUT,
  'pending': Status.SKIPPED,
  'disabled': Status.SKIPPED,
  'excluded': Status.SKIPPED,
  'interrupted': Status.STOPPED,
};

export async function attemptScreenshot(fileName: string): Promise<{ name: string; type: string; content: Buffer } | null> {
  if ((global as any).browser && typeof (global as any).browser.takeScreenshot === 'function') {
    try {
      const png: Buffer = await (global as any).browser.takeScreenshot();
      return {
        name: fileName,
        type: 'image/png',
        content: png,
      };
    } catch (error) {
      console.error('Failed to get a screenshot:', error);
      return null;
    }
  }
  return null;
}

export function getSpecCode(fileContent: string, specFullName: string): string | null {
  const lines = fileContent.split('\n');
  const describePattern = /describe\(['"`]([^'"]+)['"`]/;
  const itPattern = /it\(['"`]([^'"]+)['"`]/;
  const blockStack: { name: string; startLine: number }[] = [];
  let insideTargetBlock = false;
  let snippetLines: string[] = [];
  let currentFullName = '';
  let openBraces = 0;
  let methodDepth: Map<string, number> = new Map<string, number>();


  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim().startsWith('//') && line.includes('{')) {
      openBraces++;
    }

    const describeMatch = line.match(describePattern);
    if (describeMatch) {
      blockStack.push({ name: describeMatch[1], startLine: i });
      currentFullName = blockStack.map(d => d.name).join(' ');
      methodDepth.set(currentFullName, openBraces);
      continue;
    }

    const itMatch = line.match(itPattern);
    if (itMatch) {
      blockStack.push({ name: itMatch[1], startLine: i });
      currentFullName = blockStack.map(d => d.name).join(' ');
      methodDepth.set(currentFullName, openBraces);

      if (currentFullName === specFullName) {
        insideTargetBlock = true;
        snippetLines.push(`${line}`);
        continue;
      }
    }

    if (insideTargetBlock) {
      snippetLines.push(`${line}`);
    }

    if (!line.trim().startsWith('//') && line.includes('}')) {
      openBraces--;
      if (openBraces == methodDepth.get(currentFullName)-1 && blockStack.length > 0) {
        if (insideTargetBlock) {
          insideTargetBlock = false;
          break;
        }
        blockStack.pop();
        currentFullName = blockStack.map(d => d.name).join(' ');
      }
    }
  }

  return snippetLines.length > 0 ? `\`\`\`js\n${snippetLines.join('\n')}\n\`\`\`` : null
}
